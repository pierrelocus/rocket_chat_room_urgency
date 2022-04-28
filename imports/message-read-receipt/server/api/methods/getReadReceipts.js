import { Meteor } from 'meteor/meteor';

import { Messages } from '../../../../../app/models/server';
import { canAccessRoomId } from '../../../../../app/authorization/server';
import { ReadReceipt } from '../../lib/ReadReceipt';

Meteor.methods({
	async getReadReceipts({ messageId }) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getReadReceipts' });
		}

		if (!messageId) {
			throw new Meteor.Error('error-invalid-message', "The required 'messageId' param is missing.", { method: 'getReadReceipts' });
		}

		const message = Messages.findOneById(messageId);

		if (!message) {
			throw new Meteor.Error('error-invalid-message', 'Invalid message', {
				method: 'getReadReceipts',
			});
		}

		if (!canAccessRoomId(message.rid, Meteor.userId())) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'getReadReceipts' });
		}

		return ReadReceipt.getReceipts(message);
	},
});
