import { Meteor } from 'meteor/meteor';
import { MessageAction } from '../../ui-utils';
import { messageArgs } from '../../ui-utils/client/lib/messageArgs';
import { Tracker } from 'meteor/tracker';

import { settings } from '../../settings';


Meteor.startup(() => {
	Tracker.autorun(() => {
		if (settings.get('Discussion_urgency') === true) {
			console.log('SETTING IS TRUE, ADDING BUTTONS');
			MessageAction.addButton({
				id: 'mark-room-urgency-normal',
				icon: 'circle',
				label: 'Mark_urgency_normal',
				context: ['message', 'message-mobile', 'threads'],
				action() {
					const { rid } = messageArgs(this);
					return Meteor.call('roomUrgencyNormal', rid);
				},
				condition() {
				},
				order: 20,
				group: 'menu',
			});
			MessageAction.addButton({
				id: 'mark-room-urgency-moderate',
				icon: 'circle',
				label: 'Mark_urgency_moderate',
				context: ['message', 'message-mobile', 'threads'],
				action() {
					const { rid } = messageArgs(this);
					return Meteor.call('roomUrgencyModerate', rid);
				},
				condition() {
				},
				order: 21,
				group: 'menu',
			});
			MessageAction.addButton({
				id: 'mark-room-urgency-urgent',
				icon: 'circle',
				label: 'Mark_urgency_urgent',
				context: ['message', 'message-mobile', 'threads'],
				action() {
					const { rid } = messageArgs(this);
					return Meteor.call('roomUrgencyUrgent', rid);
				},
				condition () {
				},
				order: 22,
				group: 'menu',
			});
		} else {
			console.log('SETTING IS FALSE, REMOVING BUTTONS');
			MessageAction.removeButton('mark-room-urgency-normal');
			MessageAction.removeButton('mark-room-urgency-moderate');
			MessageAction.removeButton('mark-room-urgency-urgent');
		}
	});
});
