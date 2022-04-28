import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { ChatRoom, CachedChatRoom } from '../../../../models';
import { callWithErrorHandling } from '../../../../../client/lib/utils/callWithErrorHandling';
import './livechatReadOnly.html';
import { APIClient } from '../../../../utils/client';
import { RoomManager } from '../../../../ui-utils/client/lib/RoomManager';
import { inquiryDataStream } from '../../lib/stream/inquiry';
import { handleError } from '../../../../../client/lib/utils/handleError';

Template.livechatReadOnly.helpers({
	inquiryOpen() {
		const inquiry = Template.instance().inquiry.get();
		return inquiry && inquiry.status === 'queued';
	},

	roomOpen() {
		const room = Template.instance().room.get();
		return room && room.open === true;
	},

	showPreview() {
		const config = Template.instance().routingConfig.get();
		return config.previewRoom || Template.currentData().onHold;
	},

	isPreparing() {
		return Template.instance().preparing.get();
	},

	isOnHold() {
		return Template.currentData().onHold;
	},
});

Template.livechatReadOnly.events({
	async 'click .js-take-it'(event, instance) {
		event.preventDefault();
		event.stopPropagation();

		const inquiry = instance.inquiry.get();
		const { _id } = inquiry;
		await callWithErrorHandling('livechat:takeInquiry', _id, { clientAction: true });
		instance.loadInquiry(inquiry.rid);
	},

	async 'click .js-resume-it'(event, instance) {
		event.preventDefault();
		event.stopPropagation();

		const room = instance.room.get();

		await callWithErrorHandling('livechat:resumeOnHold', room._id, { clientAction: true });
	},

	async 'click .js-join-it'(event) {
		event.preventDefault();
		event.stopPropagation();

		try {
			const { success } = (await APIClient.v1.get(`livechat/room.join?roomId=${this.rid}`)) || {};
			if (!success) {
				throw new Meteor.Error('error-join-room', 'Error joining room');
			}
		} catch (error) {
			handleError(error);
			throw error;
		}
	},
});

Template.livechatReadOnly.onCreated(async function () {
	this.rid = Template.currentData().rid;
	this.room = new ReactiveVar();
	this.inquiry = new ReactiveVar();
	this.routingConfig = new ReactiveVar({});
	this.preparing = new ReactiveVar(true);
	this.updateInquiry = async ({ clientAction, ...inquiry }) => {
		if (clientAction === 'removed') {
			// this will force to refresh the room
			// since the client wont get notified of room changes when chats are on queue (no one assigned)
			// a better approach should be performed when refactoring these templates to use react
			ChatRoom.remove(this.rid);
			CachedChatRoom.save();
			return FlowRouter.go('/home');
		}

		this.inquiry.set(inquiry);
	};

	Meteor.call('livechat:getRoutingConfig', (err, config) => {
		if (config) {
			this.routingConfig.set(config);
		}
	});

	this.loadRoomAndInquiry = async (roomId) => {
		this.preparing.set(true);
		const { inquiry } = await APIClient.v1.get(`livechat/inquiries.getOne?roomId=${roomId}`);
		this.inquiry.set(inquiry);
		if (inquiry && inquiry._id) {
			inquiryDataStream.on(inquiry._id, this.updateInquiry);
		}

		const { room } = await APIClient.v1.get(`rooms.info?roomId=${roomId}`);
		this.room.set(room);
		if (room && room._id) {
			RoomManager.roomStream.on(roomId, (room) => this.room.set(room));
		}

		this.preparing.set(false);
	};

	this.autorun(() => this.loadRoomAndInquiry(this.rid));
});

Template.livechatReadOnly.onDestroyed(function () {
	const inquiry = this.inquiry.get();
	if (inquiry && inquiry._id) {
		inquiryDataStream.removeListener(inquiry._id, this.updateInquiry);
	}

	const { rid } = Template.currentData();
	RoomManager.roomStream.removeListener(rid);
});
