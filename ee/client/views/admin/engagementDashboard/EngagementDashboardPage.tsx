import { Box, Select, Tabs } from '@rocket.chat/fuselage';
import React, { ReactElement, useCallback, useMemo, useState } from 'react';

import Page from '../../../../../client/components/Page';
import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import ChannelsTab from './channels/ChannelsTab';
import MessagesTab from './messages/MessagesTab';
import UsersTab from './users/UsersTab';

type EngagementDashboardPageProps = {
	tab: 'users' | 'messages' | 'channels';
	onSelectTab?: (tab: 'users' | 'messages' | 'channels') => void;
};

const EngagementDashboardPage = ({ tab = 'users', onSelectTab }: EngagementDashboardPageProps): ReactElement => {
	const t = useTranslation();

	const timezoneOptions = useMemo<[timezone: 'utc' | 'local', label: string][]>(
		() => [
			['utc', t('UTC_Timezone')],
			['local', t('Local_Timezone')],
		],
		[t],
	);

	const [timezoneId, setTimezoneId] = useState<'utc' | 'local'>('utc');
	const handleTimezoneChange = (timezoneId: string): void => setTimezoneId(timezoneId as 'utc' | 'local');

	const handleTabClick = useCallback(
		(tab: 'users' | 'messages' | 'channels'): undefined | (() => void) => (onSelectTab ? (): void => onSelectTab(tab) : undefined),
		[onSelectTab],
	);

	return (
		<Page>
			<Page.Header title={t('Engagement_Dashboard')}>
				<Select options={timezoneOptions} value={timezoneId} onChange={handleTimezoneChange} />
			</Page.Header>
			<Tabs>
				<Tabs.Item selected={tab === 'users'} onClick={handleTabClick('users')}>
					{t('Users')}
				</Tabs.Item>
				<Tabs.Item selected={tab === 'messages'} onClick={handleTabClick('messages')}>
					{t('Messages')}
				</Tabs.Item>
				<Tabs.Item selected={tab === 'channels'} onClick={handleTabClick('channels')}>
					{t('Channels')}
				</Tabs.Item>
			</Tabs>
			<Page.ScrollableContent padding={0}>
				<Box m='x24'>
					{(tab === 'users' && <UsersTab timezone={timezoneId} />) ||
						(tab === 'messages' && <MessagesTab />) ||
						(tab === 'channels' && <ChannelsTab />)}
				</Box>
			</Page.ScrollableContent>
		</Page>
	);
};

export default EngagementDashboardPage;
