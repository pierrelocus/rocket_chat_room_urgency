import { Meteor } from 'meteor/meteor';
import { parser } from '@rocket.chat/message-parser';

import { Messages, Rooms } from '../../../models/server';
import { settings } from '../../../settings/server';
import { callbacks } from '../../../../lib/callbacks';
import { SystemLogger } from '../../../../server/lib/logger/system';
import { Apps } from '../../../apps/server';
import { parseUrlsInMessage } from './parseUrlsInMessage';
import { IMessage, IMessageEdited } from '../../../../definition/IMessage';
import { IUser } from '../../../../definition/IUser';

const { DISABLE_MESSAGE_PARSER = 'false' } = process.env;

export const updateMessage = function (message: IMessage, user: IUser, originalMessage?: IMessage): void {
	if (!originalMessage) {
		originalMessage = Messages.findOneById(message._id);
	}

	// For the Rocket.Chat Apps :)
	if (message && Apps && Apps.isLoaded()) {
		const appMessage = Object.assign({}, originalMessage, message);

		const prevent = Promise.await(Apps.getBridges()?.getListenerBridge().messageEvent('IPreMessageUpdatedPrevent', appMessage));
		if (prevent) {
			throw new Meteor.Error('error-app-prevented-updating', 'A Rocket.Chat App prevented the message updating.');
		}

		let result;
		result = Promise.await(Apps.getBridges()?.getListenerBridge().messageEvent('IPreMessageUpdatedExtend', appMessage));
		result = Promise.await(Apps.getBridges()?.getListenerBridge().messageEvent('IPreMessageUpdatedModify', result));

		if (typeof result === 'object') {
			message = Object.assign(appMessage, result);
		}
	}

	// If we keep history of edits, insert a new message to store history information
	if (settings.get('Message_KeepHistory')) {
		Messages.cloneAndSaveAsHistoryById(message._id, user);
	}

	(message as IMessageEdited).editedAt = new Date();
	(message as IMessageEdited).editedBy = {
		_id: user._id,
		username: user.username,
	};

	parseUrlsInMessage(message);

	message = callbacks.run('beforeSaveMessage', message);

	try {
		if (message.msg && DISABLE_MESSAGE_PARSER !== 'true') {
			message.md = parser(message.msg);
		}
	} catch (e: unknown) {
		SystemLogger.error(String(e)); // errors logged while the parser is at experimental stage
	}

	const { _id, ...editedMessage } = message;

	Messages.update({ _id }, { $set: editedMessage });

	const room = Rooms.findOneById(message.rid);

	if (Apps?.isLoaded()) {
		// This returns a promise, but it won't mutate anything about the message
		// so, we don't really care if it is successful or fails
		Apps.getBridges()?.getListenerBridge().messageEvent('IPostMessageUpdated', message);
	}

	Meteor.defer(function () {
		callbacks.run('afterSaveMessage', Messages.findOneById(_id), room, user._id);
	});
};
