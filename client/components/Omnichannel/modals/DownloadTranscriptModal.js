import { Field, Button, TextAreaInput, Icon, ButtonGroup, Modal, Box, PaginatedSelectFiltered } from '@rocket.chat/fuselage';
import { useMutableCallback, useAutoFocus, useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import React, { FC, useCallback, useEffect, useState, useMemo } from 'react';

import { Meteor } from 'meteor/meteor';

import { useEndpoint } from '../../../contexts/ServerContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useRecordList } from '../../../hooks/lists/useRecordList';
import { AsyncStatePhase } from '../../../hooks/useAsyncState';
import { useForm } from '../../../hooks/useForm';
import UserAutoComplete from '../../UserAutoComplete';
import ModalSeparator from './ModalSeparator';

const DownloadTranscriptModal = ({ onCancel, room, ...props }) => {
	const t = useTranslation();

	const inputRef = useAutoFocus(true);

	const { values, handlers } = useForm({
		username: '',
		comment: '',
		department: {},
	});
	const { username, comment, department } = values;
	const [userId, setUserId] = useState('');

	const { handleUsername, handleComment, handleDepartment } = handlers;
	const getUserData = useEndpoint('GET', `users.info?username=${username}`);

	const { servedBy: { _id: agentId } = {} } = room || {};

	const _id = agentId && { $ne: agentId };

	const conditions = { _id, status: { $ne: 'offline' }, statusLivechat: 'available' };

	const onConfirm = useCallback(async () => {
		await Meteor.call('roomToPdf', room._id);
		let p = new Date();
		let hour = p.getFullYear() + '' + p.getMonth() + '' + p.getDay();
		let filepath = 'https://files.relatient.space/transcript_' + room._id + '_' + hour + '.pdf';
		window.open(filepath, '_blank');
	});

	return (
		<Modal {...props}>
			<Modal.Header>
				<Icon name='file-pdf' size={20}/>
				<Modal.Title>{t('Download_Transcript')}</Modal.Title>
			</Modal.Header>
			<Modal.Content fontScale='p2'>
			</Modal.Content>
			<Modal.Footer>
				<ButtonGroup align='end'>
					<Button onClick={onCancel}>{t('Cancel')}</Button>
					<Button primary onClick={onConfirm}>{t('Download')}</Button>
				</ButtonGroup>
			</Modal.Footer>
		</Modal>
	);
};

export default DownloadTranscriptModal;
