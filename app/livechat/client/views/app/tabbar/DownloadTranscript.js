import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';

import { ChatRoom } from '../../../../../models';
import { t } from '../../../../../utils';
import './DownloadTranscript.html';
import { APIClient } from '../../../../../utils/client';
import { dispatchToastMessage } from '../../../../../../client/lib/toast';

Template.DownloadTranscript.helpers({
	visitor() {
		console.log("JE SUIS DANS LE RENDER COUCOU");
		return Template.instance().visitor.get();
	},
	agentName() {
		return this.name || this.username;
	},
	onSelectAgents() {
		return Template.instance().onSelectAgents;
	},
	agentModifier() {
		return (filter, text = '') => {
			const f = filter.get();
			return `@${f.length === 0 ? text : text.replace(new RegExp(filter.get()), (part) => `<strong>${part}</strong>`)}`;
		};
	},
	agentConditions() {
		const room = Template.instance().room.get();
		const { servedBy: { _id: agentId } = {} } = room || {};
		const _id = agentId && { $ne: agentId };
		return { _id, status: { $ne: 'offline' }, statusLivechat: 'available' };
	},
	selectedAgents() {
		return Template.instance().selectedAgents.get();
	},
	onClickTagAgent() {
		return Template.instance().onClickTagAgent;
	},
	departmentModifier() {
		return (filter, text = '') => {
			const f = filter.get();
			return `${f.length === 0 ? text : text.replace(new RegExp(filter.get(), 'i'), (part) => `<strong>${part}</strong>`)}`;
		};
	},
});

Template.DownloadTranscript.onCreated(async function () {
	this.visitor = new ReactiveVar();
	this.room = new ReactiveVar();
	this.departments = new ReactiveVar([]);
	this.selectedAgents = new ReactiveVar([]);
	this.selectedDepartments = new ReactiveVar([]);

	this.onSelectDepartments = ({ item: department }) => {
		department.text = department.name;
		this.selectedDepartments.set([department]);
		this.selectedAgents.set([]);
	};

	this.onClickTagDepartment = () => {
		this.selectedDepartments.set([]);
	};

	this.onSelectAgents = ({ item: agent }) => {
		this.selectedAgents.set([agent]);
		this.selectedDepartments.set([]);
	};

	this.onClickTagAgent = ({ username }) => {
		this.selectedAgents.set(this.selectedAgents.get().filter((user) => user.username !== username));
	};

	this.autorun(() => {
		this.visitor.set(Meteor.users.findOne({ _id: Template.currentData().visitorId }));
	});
});

Template.DownloadTranscript.events({
	'submit form'(event, instance) {
		event.preventDefault();

		const transferData = {
			roomId: instance.room.get()._id,
			comment: event.target.comment.value,
			clientAction: true,
		};

		const [user] = instance.selectedAgents.get();
		if (user) {
			transferData.userId = user._id;
		}

		if (!transferData.userId && !transferData.departmentId) {
			return;
		}
	},

	'click .cancel'(event) {
		event.preventDefault();

		this.cancel();
	},
});
