import { Meteor } from 'meteor/meteor';

import logger from './logger';
import { Messages, Subscriptions } from '../../models';

Meteor.methods({
	customAction() {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'unreadMessages',
			});
		}
		logger.debug('Custom Action Triggereeeeeeeeeeeed');
	},
});
