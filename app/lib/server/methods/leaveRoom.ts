import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { hasPermission, hasRole } from '../../../authorization/server';
import { Subscriptions, Rooms } from '../../../models/server';
import { removeUserFromRoom } from '../functions';
import { RoomMemberActions } from '../../../../definition/IRoomTypeConfig';
import { Roles } from '../../../models/server/raw';
import { roomCoordinator } from '../../../../server/lib/rooms/roomCoordinator';
import { IUser } from '../../../../definition/IUser';

Meteor.methods({
	async leaveRoom(rid) {
		check(rid, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'leaveRoom' });
		}

		const room = Rooms.findOneById(rid);
		const user = Meteor.user() as unknown as IUser;

		if (!user || !roomCoordinator.getRoomDirectives(room.t)?.allowMemberAction(room, RoomMemberActions.LEAVE)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'leaveRoom' });
		}

		if ((room.t === 'c' && !hasPermission(user._id, 'leave-c')) || (room.t === 'p' && !hasPermission(user._id, 'leave-p'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'leaveRoom' });
		}

		const subscription = Subscriptions.findOneByRoomIdAndUserId(rid, user._id, {
			fields: { _id: 1 },
		});
		if (!subscription) {
			throw new Meteor.Error('error-user-not-in-room', 'You are not in this room', {
				method: 'leaveRoom',
			});
		}

		// If user is room owner, check if there are other owners. If there isn't anyone else, warn user to set a new owner.
		if (hasRole(user._id, 'owner', room._id)) {
			const cursor = await Roles.findUsersInRole('owner', room._id);
			const numOwners = Promise.await(cursor.count());
			if (numOwners === 1) {
				throw new Meteor.Error('error-you-are-last-owner', 'You are the last owner. Please set new owner before leaving the room.', {
					method: 'leaveRoom',
				});
			}
		}

		return removeUserFromRoom(rid, user);
	},
});
