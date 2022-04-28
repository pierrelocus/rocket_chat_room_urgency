import { Meteor } from 'meteor/meteor';

import { Rooms } from '../../models/server';

Meteor.methods({
	async roomUrgencyNormal(rid) {
		const room = await Rooms.findOneById(rid);
		if (!room) {
			return;
		}
		Rooms.setUrgency(room._id, 'normal');
	},
});

Meteor.methods({
	async roomUrgencyModerate(rid) {
		const room = await Rooms.findOneById(rid);
		if (!room) {
			return;
		}
		Rooms.setUrgency(room._id, 'moderate');
	},
});

Meteor.methods({
	async roomUrgencyUrgent(rid) {
		const room = await Rooms.findOneById(rid);
		if (!room) {
			return;
		}
		Rooms.setUrgency(room._id, 'urgent');
	},
});
