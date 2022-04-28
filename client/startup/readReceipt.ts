import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { settings } from '../../app/settings/client';
import { MessageAction, messageArgs } from '../../app/ui-utils/client';
import { imperativeModal } from '../lib/imperativeModal';
import ReadReceiptsModal from '../views/room/modals/ReadReceiptsModal';

Meteor.startup(() => {
	Tracker.autorun(() => {
		const enabled = settings.get('Message_Read_Receipt_Store_Users');

		if (!enabled) {
			return MessageAction.removeButton('receipt-detail');
		}

		MessageAction.addButton({
			id: 'receipt-detail',
			icon: 'info-circled',
			label: 'Info',
			context: ['starred', 'message', 'message-mobile', 'threads'],
			action() {
				const { msg: message } = messageArgs(this);
				imperativeModal.open({
					component: ReadReceiptsModal,
					props: { messageId: message._id, onClose: imperativeModal.close },
				});
			},
			order: 10,
			group: 'menu',
		});
	});
});
