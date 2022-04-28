import { Meta, Story } from '@storybook/react';
import React, { ContextType } from 'react';

import { ISetting } from '../../definition/ISetting';
import { ISubscription } from '../../definition/ISubscription';
import { SettingsContext } from '../contexts/SettingsContext';
import { UserContext } from '../contexts/UserContext';
import RoomList from './RoomList/index';
import Header from './header';

export default {
	title: 'Sidebar',
} as Meta;

const settings: Record<string, ISetting> = {
	// eslint-disable-next-line @typescript-eslint/camelcase
	UI_Use_Real_Name: {
		_id: 'UI_Use_Real_Name',
		blocked: false,
		createdAt: new Date(),
		env: true,
		i18nLabel: 'Use real name',
		packageValue: false,
		sorter: 1,
		ts: new Date(),
		type: 'boolean',
		value: true,
		public: true,
	},
};

const settingContextValue: ContextType<typeof SettingsContext> = {
	hasPrivateAccess: true,
	isLoading: false,
	querySetting: (_id) => ({
		getCurrentValue: () => settings[_id],
		subscribe: () => () => undefined,
	}),
	querySettings: () => ({
		getCurrentValue: () => [],
		subscribe: () => () => undefined,
	}),
	dispatch: async () => undefined,
};

const userPreferences: Record<string, unknown> = {
	sidebarViewMode: 'medium',
	sidebarDisplayAvatar: true,
	sidebarGroupByType: true,
	sidebarShowFavorites: true,
	sidebarShowUnread: true,
	sidebarSortby: 'activity',
};

const subscriptions: ISubscription[] = [
	{
		_id: '3Bysd8GrmkWBdS9RT',
		open: true,
		alert: true,
		unread: 0,
		userMentions: 0,
		groupMentions: 0,
		ts: new Date(),
		rid: 'GENERAL',
		name: 'general',
		t: 'c',
		u: {
			_id: '5yLFEABCSoqR5vozz',
			username: 'yyy',
			name: 'yyy',
		},
		_updatedAt: new Date(),
		ls: new Date(),
		lr: new Date(),
		tunread: [],
	},
];

const userContextValue: ContextType<typeof UserContext> = {
	userId: 'john.doe',
	user: {
		_id: 'john.doe',
		username: 'john.doe',
		name: 'John Doe',
		createdAt: new Date(),
		active: true,
		_updatedAt: new Date(),
		roles: ['admin'],
		type: 'user',
	},
	queryPreference: <T,>(pref: string | Mongo.ObjectID, defaultValue: T) => ({
		getCurrentValue: () => (typeof pref === 'string' ? (userPreferences[pref] as T) : defaultValue),
		subscribe: () => () => undefined,
	}),
	querySubscriptions: () => ({
		getCurrentValue: () => subscriptions,
		subscribe: () => () => undefined,
	}),
	querySubscription: () => ({
		getCurrentValue: () => undefined,
		subscribe: () => () => undefined,
	}),
	loginWithPassword: () => Promise.resolve(undefined),
	logout: () => Promise.resolve(undefined),
	queryRoom: () => ({
		getCurrentValue: () => undefined,
		subscribe: () => () => undefined,
	}),
};

export const Sidebar: Story = () => (
	<aside className='sidebar sidebar--main' role='navigation'>
		<Header />
		<div className='rooms-list sidebar--custom-colors' aria-label='Channels' role='region'>
			<RoomList />
		</div>
	</aside>
);
Sidebar.decorators = [
	(fn) => (
		<SettingsContext.Provider value={settingContextValue}>
			<UserContext.Provider value={userContextValue}>{fn()}</UserContext.Provider>
		</SettingsContext.Provider>
	),
];
