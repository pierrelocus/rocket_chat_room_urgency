import { Box, Sidebar } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { memo, ReactElement } from 'react';

import { usePermission } from '../../contexts/AuthorizationContext';
import { useIsCallEnabled } from '../../contexts/CallContext';
import { useLayout } from '../../contexts/LayoutContext';
import { useOmnichannelShowQueueLink, useOmnichannelAgentAvailable } from '../../contexts/OmnichannelContext';
import { useRoute } from '../../contexts/RouterContext';
import { useMethod } from '../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { OmnichannelCallToggle } from './components/OmnichannelCallToggle';

const OmnichannelSection = (props: typeof Box): ReactElement => {
	const t = useTranslation();
	const changeAgentStatus = useMethod('livechat:changeLivechatStatus');
	const isCallEnabled = useIsCallEnabled();
	const hasPermission = usePermission('view-omnichannel-contact-center');
	const agentAvailable = useOmnichannelAgentAvailable();

	const showOmnichannelQueueLink = useOmnichannelShowQueueLink();
	const { sidebar } = useLayout();
	const directoryRoute = useRoute('omnichannel-directory');
	const queueListRoute = useRoute('livechat-queue');
	const dispatchToastMessage = useToastMessageDispatch();

	const availableIcon = {
		title: agentAvailable ? t('Available') : t('Not_Available'),
		color: agentAvailable ? 'success' : undefined,
		icon: agentAvailable ? 'message' : 'message-disabled',
	} as const;

	const directoryIcon = {
		title: t('Contact_Center'),
		icon: 'contact',
	} as const;

	const handleAvailableStatusChange = useMutableCallback(async () => {
		try {
			await changeAgentStatus();
		} catch (error: any) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const handleRoute = useMutableCallback((route) => {
		sidebar.toggle();

		switch (route) {
			case 'directory':
				directoryRoute.push({});
				break;
			case 'queue':
				queueListRoute.push({});
				break;
		}
	});

	// The className is a paliative while we make TopBar.ToolBox optional on fuselage
	return (
		<Sidebar.TopBar.ToolBox className='omnichannel-sidebar' {...props}>
			<Sidebar.TopBar.Title>{t('Omnichannel')}</Sidebar.TopBar.Title>
			<Sidebar.TopBar.Actions>
				{showOmnichannelQueueLink && <Sidebar.TopBar.Action icon='queue' title={t('Queue')} onClick={(): void => handleRoute('queue')} />}
				{isCallEnabled && <OmnichannelCallToggle />}
				<Sidebar.TopBar.Action {...availableIcon} onClick={handleAvailableStatusChange} />
				{hasPermission && <Sidebar.TopBar.Action {...directoryIcon} onClick={(): void => handleRoute('directory')} />}
			</Sidebar.TopBar.Actions>
		</Sidebar.TopBar.ToolBox>
	);
};

export default Object.assign(memo(OmnichannelSection), {
	size: 56,
});
