import { AppsEngineException } from '@rocket.chat/apps-engine/definition/exceptions';
import { Meteor } from 'meteor/meteor';
import _ from 'underscore';
import s from 'underscore.string';

import { Apps } from '../../../apps/server';
import { addUserRoles } from '../../../../server/lib/roles/addUserRoles';
import { callbacks } from '../../../../lib/callbacks';
import { Messages, Rooms, Subscriptions, Users } from '../../../models/server';
import { getValidRoomName } from '../../../utils/server';
import { createDirectRoom } from './createDirectRoom';
import { Team } from '../../../../server/sdk';
import { IUser } from '../../../../definition/IUser';
import { ICreateRoomParams, ISubscriptionExtraData } from '../../../../server/sdk/types/IRoomService';
import { IRoom, RoomType } from '../../../../definition/IRoom';

const isValidName = (name: unknown): name is string => {
	return typeof name === 'string' && s.trim(name).length > 0;
};

export const createRoom = function <T extends RoomType>(
	type: T,
	name: T extends 'd' ? undefined : string,
	ownerUsername: string,
	members: T extends 'd' ? IUser[] : string[] = [],
	readOnly?: boolean,
	roomExtraData?: Partial<IRoom>,
	options?: ICreateRoomParams['options'],
): unknown {
	const { teamId, ...extraData } = roomExtraData || ({} as IRoom);
	callbacks.run('beforeCreateRoom', { type, name, owner: ownerUsername, members, readOnly, extraData, options });

	if (type === 'd') {
		return createDirectRoom(members as IUser[], extraData, options);
	}

	if (!isValidName(name)) {
		throw new Meteor.Error('error-invalid-name', 'Invalid name', {
			function: 'RocketChat.createRoom',
		});
	}

	const owner = Users.findOneByUsernameIgnoringCase(ownerUsername, { fields: { username: 1 } });

	if (!owner) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			function: 'RocketChat.createRoom',
		});
	}

	if (!_.contains(members, owner)) {
		members.push(owner.username);
	}

	if (extraData.broadcast) {
		readOnly = true;
		delete extraData.reactWhenReadOnly;
	}

	const now = new Date();

	const roomProps: Omit<IRoom, '_id' | '_updatedAt' | 'uids' | 'jitsiTimeout' | 'autoTranslateLanguage'> = {
		fname: name,
		...extraData,
		name: getValidRoomName(name.trim(), undefined, {
			...(options?.nameValidationRegex && { nameValidationRegex: options.nameValidationRegex }),
		}),
		t: type,
		msgs: 0,
		usersCount: 0,
		u: {
			_id: owner._id,
			username: owner.username,
		},
		ts: now,
		ro: readOnly === true,
	};

	if (teamId) {
		const team = Promise.await(Team.getOneById(teamId, { projection: { _id: 1 } }));
		if (team) {
			roomProps.teamId = team._id;
		}
	}

	const tmp = {
		...roomProps,
		_USERNAMES: members,
	};

	const prevent = Promise.await(
		Apps.triggerEvent('IPreRoomCreatePrevent', tmp).catch((error) => {
			if (error instanceof AppsEngineException) {
				throw new Meteor.Error('error-app-prevented', error.message);
			}

			throw error;
		}),
	);

	if (prevent) {
		throw new Meteor.Error('error-app-prevented', 'A Rocket.Chat App prevented the room creation.');
	}

	const { _USERNAMES, ...result } = Promise.await(
		Apps.triggerEvent('IPreRoomCreateModify', Promise.await(Apps.triggerEvent('IPreRoomCreateExtend', tmp))),
	);

	if (typeof result === 'object') {
		Object.assign(roomProps, result);
	}

	if (type === 'c') {
		callbacks.run('beforeCreateChannel', owner, roomProps);
	}
	const room = Rooms.createWithFullRoomData(roomProps);

	for (const username of [...new Set(members as string[])]) {
		const member = Users.findOneByUsername(username, {
			fields: { 'username': 1, 'settings.preferences': 1 },
		});
		if (!member) {
			continue;
		}

		const extra: Partial<ISubscriptionExtraData> = options?.subscriptionExtra || {};

		extra.open = true;

		if (room.prid) {
			extra.prid = room.prid;
		}

		if (username === owner.username) {
			extra.ls = now;
		}

		Subscriptions.createWithRoomAndUser(room, member, extra);
	}

	addUserRoles(owner._id, ['owner'], room._id);

	if (type === 'c') {
		if (room.teamId) {
			const team = Promise.await(Team.getOneById(room.teamId));
			team && Messages.createUserAddRoomToTeamWithRoomIdAndUser(team.roomId, room.name, owner);
		}
		callbacks.run('afterCreateChannel', owner, room);
	} else if (type === 'p') {
		callbacks.runAsync('afterCreatePrivateGroup', owner, room);
	}
	callbacks.runAsync('afterCreateRoom', owner, room);

	Apps.triggerEvent('IPostRoomCreate', room);

	return {
		rid: room._id, // backwards compatible
		...room,
	};
};
