import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';
import { Accounts } from 'meteor/accounts-base';

import { settings } from '../../../settings/server';
import { Users } from '../../../models/server';
import { Invites } from '../../../models/server/raw';
import { hasPermission } from '../../../authorization/server';
import { RateLimiter } from '../lib';
import { addUserToRoom } from './addUserToRoom';
import { api } from '../../../../server/sdk/api';
import { checkUsernameAvailability, setUserAvatar } from '.';
import { getAvatarSuggestionForUser } from './getAvatarSuggestionForUser';
import { SystemLogger } from '../../../../server/lib/logger/system';
import { IUser } from '../../../../definition/IUser';

export const _setUsername = function (userId: string, u: string, fullUser: IUser): unknown {
	const username = s.trim(u);
	if (!userId || !username) {
		return false;
	}
	let nameValidation;
	try {
		nameValidation = new RegExp(`^${settings.get('UTF8_User_Names_Validation')}$`);
	} catch (error) {
		nameValidation = new RegExp('^[0-9a-zA-Z-_.]+$');
	}
	if (!nameValidation.test(username)) {
		return false;
	}
	const user = fullUser || Users.findOneById(userId);
	// User already has desired username, return
	if (user.username === username) {
		return user;
	}
	const previousUsername = user.username;
	// Check username availability or if the user already owns a different casing of the name
	if (!previousUsername || !(username.toLowerCase() === previousUsername.toLowerCase())) {
		if (!checkUsernameAvailability(username)) {
			return false;
		}
	}
	// If first time setting username, send Enrollment Email
	try {
		if (!previousUsername && user.emails && user.emails.length > 0 && settings.get('Accounts_Enrollment_Email')) {
			Meteor.defer(() => {
				Accounts.sendEnrollmentEmail(user._id);
			});
		}
	} catch (e: any) {
		SystemLogger.error(e);
	}
	// Set new username*
	Users.setUsername(user._id, username);
	user.username = username;
	if (!previousUsername && settings.get('Accounts_SetDefaultAvatar') === true) {
		const avatarSuggestions = Promise.await(getAvatarSuggestionForUser(user)) as [];
		let gravatar;
		Object.keys(avatarSuggestions).some((service) => {
			const avatarData = avatarSuggestions[+service];
			if (service !== 'gravatar') {
				// eslint-disable-next-line dot-notation
				setUserAvatar(user, avatarData['blob'], avatarData['contentType'], service);
				gravatar = null;
				return true;
			}
			gravatar = avatarData;
			return false;
		});
		if (gravatar != null) {
			// eslint-disable-next-line dot-notation
			setUserAvatar(user, gravatar['blob'], gravatar['contentType'], 'gravatar');
		}
	}

	// If it's the first username and the user has an invite Token, then join the invite room
	if (!previousUsername && user.inviteToken) {
		const inviteData = Promise.await(Invites.findOneById(user.inviteToken));
		if (inviteData?.rid) {
			addUserToRoom(inviteData.rid, user);
		}
	}

	api.broadcast('user.nameChanged', {
		_id: user._id,
		name: user.name,
		username: user.username,
	});

	return user;
};

export const setUsername = RateLimiter.limitFunction(_setUsername, 1, 60000, {
	0() {
		const userId = Meteor.userId();
		return !userId || !hasPermission(userId, 'edit-other-user-info');
	},
});
