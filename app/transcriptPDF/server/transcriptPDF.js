import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { fs } from 'fs';

import { Rooms, Messages, LivechatVisitors } from '../../models/server';

Meteor.methods({
	async roomToHtml(room_id) {
		const room = await Rooms.findOneById(room_id);
		// GET VISITORS
		const v = LivechatVisitors.getVisitorByToken(room.v.token, {
			fields: { _id: 1, token: 1, language: 1, username: 1, name: 1 },
		})
		const ignoredMessageTypes = [
			'livechat_navigation_history',
			'livechat_transcript_history',
			'livechat_transfer_history',
			'command',
			'livechat-close',
			'livechat-started',
			'livechat_video_call',
		];
		const templateMessage = `<div style="{% css_style %}"><strong>{% author %}</strong>: <p>{% message %}</p></div><br/>`;
		const messages = await Messages.findVisibleByRoomIdNotContainingTypes(room_id, ignoredMessageTypes, {
			sort: { ts: 1 },
		}).fetch();
		let html = '';
		let firstPerson = messages[0].u.name;
		messages.forEach((message) => {
			if (message.u.name !== undefined && message.msg) {
				html += templateMessage.replace('{% author %}', message.u.name).replace('{% message %}', message.msg);
				if (message.u.name == firstPerson) {
					html = html.replace('{% css_style %}', '');
				} else {
					html = html.replace('{% css_style %}', '');
				}
			}
		})

		header = `<head><meta charset="UTF-8"><meta http-equiv="X-UA-Compatible" content="IE=edge"><title>${v.name}</title></head>`;
		return '<html>' + header + '<body><div style="width: 100%; margin: auto;">' + html + '</div></body></html>';
	},
});

Meteor.methods({
	async HtmlToPdf(html, format, filename) {
		var pdf = require('html-pdf');
		const options = { format: format };
		pdf.create(html, options).toFile('/home/files.relatient.space/' + `${filename}`);
		return `${filename}`;
	},
});

Meteor.methods({
	async roomToPdf(room_id) {
		let p = new Date();
		let hour = p.getFullYear() + '' + p.getMonth() + '' + p.getDay();
		const html = await Meteor.call('roomToHtml', room_id);
		const filepath = await Meteor.call('HtmlToPdf', html, 'a4', 'transcript_'+room_id+ '_' + hour +'.pdf');
		return filepath;
	},
});
