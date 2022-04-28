import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import React, { ReactElement } from 'react';

import GenericModal from '../../../components/GenericModal';
import {
	GenericTable,
	GenericTableBody,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableLoadingTable,
} from '../../../components/GenericTable';
import Page from '../../../components/Page';
import { useSetModal } from '../../../contexts/ModalContext';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useEndpointData } from '../../../hooks/useEndpointData';
import { AsyncStatePhase } from '../../../lib/asyncState';
import InviteRow from './InviteRow';

const InvitesPage = (): ReactElement => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const setModal = useSetModal();

	const { phase, value, reload } = useEndpointData('listInvites');

	const onRemove = (removeInvite: () => void): void => {
		const confirmRemove = async (): Promise<void> => {
			try {
				await removeInvite();
				dispatchToastMessage({ type: 'success', message: t('Invite_removed') });
				reload();
			} catch (error) {
				if (typeof error === 'string' || error instanceof Error) {
					dispatchToastMessage({ type: 'error', message: error });
				}
			} finally {
				setModal();
			}
		};

		setModal(
			<GenericModal
				title={t('Are_you_sure')}
				children={t('Are_you_sure_you_want_to_delete_this_record')}
				variant='danger'
				confirmText={t('Yes')}
				cancelText={t('No')}
				onClose={(): void => setModal()}
				onCancel={(): void => setModal()}
				onConfirm={confirmRemove}
			/>,
		);
	};

	const notSmall = useMediaQuery('(min-width: 768px)');

	return (
		<Page>
			<Page.Header title={t('Invites')} />
			<Page.Content>
				<GenericTable>
					<GenericTableHeader>
						<GenericTableHeaderCell w={notSmall ? '20%' : '80%'}>{t('Token')}</GenericTableHeaderCell>
						{notSmall && (
							<>
								<GenericTableHeaderCell w='35%'>{t('Created_at')}</GenericTableHeaderCell>
								<GenericTableHeaderCell w='20%'>{t('Expiration')}</GenericTableHeaderCell>
								<GenericTableHeaderCell w='10%'>{t('Uses')}</GenericTableHeaderCell>
								<GenericTableHeaderCell w='10%'>{t('Uses_left')}</GenericTableHeaderCell>
							</>
						)}
						<GenericTableHeaderCell />
					</GenericTableHeader>
					<GenericTableBody>
						{phase === AsyncStatePhase.LOADING && <GenericTableLoadingTable headerCells={notSmall ? 4 : 1} />}
						{phase === AsyncStatePhase.RESOLVED &&
							Array.isArray(value) &&
							value.map((invite) => <InviteRow key={invite._id} {...invite} onRemove={onRemove} />)}
					</GenericTableBody>
				</GenericTable>
			</Page.Content>
		</Page>
	);
};

export default InvitesPage;
