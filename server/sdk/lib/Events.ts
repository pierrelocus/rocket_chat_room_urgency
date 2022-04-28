import { IUIKitInteraction } from '@rocket.chat/apps-engine/definition/uikit';

import { IEmailInbox } from '../../../definition/IEmailInbox';
import { IEmoji } from '../../../definition/IEmoji';
import { IInquiry } from '../../../definition/IInquiry';
import { IInstanceStatus } from '../../../definition/IInstanceStatus';
import { IIntegration } from '../../../definition/IIntegration';
import { IIntegrationHistory } from '../../../definition/IIntegrationHistory';
import { ILivechatDepartmentAgents } from '../../../definition/ILivechatDepartmentAgents';
import { ILoginServiceConfiguration } from '../../../definition/ILoginServiceConfiguration';
import { IMessage } from '../../../definition/IMessage';
import { INotificationDesktop } from '../../../definition/INotification';
import { IPbxEvent } from '../../../definition/IPbxEvent';
import { IRole } from '../../../definition/IRole';
import { IRoom } from '../../../definition/IRoom';
import { ISetting } from '../../../definition/ISetting';
import { ISocketConnection } from '../../../definition/ISocketConnection';
import { ISubscription } from '../../../definition/ISubscription';
import { IUser } from '../../../definition/IUser';
import { IUserSession } from '../../../definition/IUserSession';
import { IUserStatus } from '../../../definition/IUserStatus';
import { AutoUpdateRecord } from '../types/IMeteor';
import { IInvite } from '../../../definition/IInvite';
import { IWebdavAccount } from '../../../definition/IWebdavAccount';
import { ICustomSound } from '../../../definition/ICustomSound';

type ClientAction = 'inserted' | 'updated' | 'removed' | 'changed';

export type EventSignatures = {
	'shutdown': (params: Record<string, string[]>) => void;
	'$services.changed': (info: { localService: boolean }) => void;
	'accounts.login': (info: { userId: string; connection: ISocketConnection }) => void;
	'accounts.logout': (info: { userId: string; connection: ISocketConnection }) => void;
	'authorization.guestPermissions': (permissions: string[]) => void;
	'socket.connected': (connection: ISocketConnection) => void;
	'socket.disconnected': (connection: ISocketConnection) => void;
	'banner.new'(bannerId: string): void;
	'banner.enabled'(bannerId: string): void;
	'banner.disabled'(bannerId: string): void;
	'emoji.deleteCustom'(emoji: IEmoji): void;
	'emoji.updateCustom'(emoji: IEmoji): void;
	'license.module'(data: { module: string; valid: boolean }): void;
	'livechat-inquiry-queue-observer'(data: { action: string; inquiry: IInquiry }): void;
	'message'(data: { action: string; message: IMessage }): void;
	'meteor.clientVersionUpdated'(data: AutoUpdateRecord): void;
	'notify.desktop'(uid: string, data: INotificationDesktop): void;
	'notify.uiInteraction'(uid: string, data: IUIKitInteraction): void;
	'notify.updateInvites'(uid: string, data: { invite: IInvite }): void;
	'notify.ephemeralMessage'(uid: string, rid: string, message: Partial<IMessage>): void;
	'notify.webdav'(
		uid: string,
		data:
			| {
					type: 'changed';
					account: Partial<IWebdavAccount>;
			  }
			| {
					type: 'removed';
					account: { _id: IWebdavAccount['_id'] };
			  },
	): void;
	'notify.e2e.keyRequest'(rid: string, data: IRoom['e2eKeyId']): void;
	'notify.deleteMessage'(rid: string, data: { _id: string }): void;
	'notify.deleteMessageBulk'(
		rid: string,
		data: {
			rid: string;
			excludePinned: boolean;
			ignoreDiscussion: boolean;
			ts: Record<string, Date>;
			users: string[];
		},
	): void;
	'notify.deleteCustomSound'(data: { soundData: ICustomSound }): void;
	'notify.updateCustomSound'(data: { soundData: ICustomSound }): void;
	'permission.changed'(data: { clientAction: ClientAction; data: any }): void;
	'room'(data: { action: string; room: Partial<IRoom> }): void;
	'room.avatarUpdate'(room: Partial<IRoom>): void;
	'setting'(data: { action: string; setting: Partial<ISetting> }): void;
	'stream'([streamer, eventName, payload]: [string, string, any[]]): void;
	'subscription'(data: { action: string; subscription: Partial<ISubscription> }): void;
	'user.avatarUpdate'(user: Partial<IUser>): void;
	'user.deleted'(user: Partial<IUser>): void;
	'user.deleteCustomStatus'(userStatus: IUserStatus): void;
	'user.nameChanged'(user: Partial<IUser>): void;
	'user.roleUpdate'(update: Record<string, any>): void;
	'user.updateCustomStatus'(userStatus: IUserStatus): void;
	'presence.status'(data: { user: Partial<IUser> }): void;
	'watch.messages'(data: { clientAction: ClientAction; message: Partial<IMessage> }): void;
	'watch.roles'(data: { clientAction: ClientAction; role: Partial<IRole> }): void;
	'watch.rooms'(data: { clientAction: ClientAction; room: Pick<IRoom, '_id'> & Partial<IRoom> }): void;
	'watch.subscriptions'(data: { clientAction: ClientAction; subscription: Partial<ISubscription> }): void;
	'watch.userSessions'(data: { clientAction: ClientAction; userSession: Partial<IUserSession> }): void;
	'watch.inquiries'(data: { clientAction: ClientAction; inquiry: IInquiry; diff?: undefined | Record<string, any> }): void;
	'watch.settings'(data: { clientAction: ClientAction; setting: ISetting }): void;
	'watch.users'(data: {
		clientAction: ClientAction;
		data?: undefined | Partial<IUser>;
		diff?: undefined | Record<string, any>;
		unset?: undefined | Record<string, number>;
		id: string;
	}): void;
	'watch.loginServiceConfiguration'(data: { clientAction: ClientAction; data: Partial<ILoginServiceConfiguration>; id: string }): void;
	'watch.instanceStatus'(data: {
		clientAction: ClientAction;
		data?: undefined | Partial<IInstanceStatus>;
		diff?: undefined | Record<string, any>;
		id: string;
	}): void;
	'watch.integrationHistory'(data: {
		clientAction: ClientAction;
		data: Partial<IIntegrationHistory>;
		diff?: undefined | Record<string, any>;
		id: string;
	}): void;
	'watch.integrations'(data: { clientAction: ClientAction; data: Partial<IIntegration>; id: string }): void;
	'watch.emailInbox'(data: { clientAction: ClientAction; data: Partial<IEmailInbox>; id: string }): void;
	'watch.livechatDepartmentAgents'(data: {
		clientAction: ClientAction;
		data: Partial<ILivechatDepartmentAgents>;
		diff?: undefined | Record<string, any>;
		id: string;
	}): void;
	'queue.agentcalled'(userid: string, queuename: string, callerid: Record<string, string>): void;
	'queue.agentconnected'(userid: string, queuename: string, queuedcalls: string, waittimeinqueue: string): void;
	'queue.callerjoined'(userid: string, queuename: string, callerid: Record<string, string>, queuedcalls: string): void;
	'queue.queuememberadded'(userid: string, queuename: string, queuedcalls: string): void;
	'queue.queuememberremoved'(userid: string, queuename: string, queuedcalls: string): void;
	'queue.callabandoned'(userid: string, queuename: string, queuedcallafterabandon: string): void;
	'watch.pbxevents'(data: { clientAction: ClientAction; data: Partial<IPbxEvent>; id: string }): void;
};
