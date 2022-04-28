import type { RouteOptions } from 'meteor/kadira:flow-router';

import type { IRoom, RoomType } from './IRoom';
import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IUser } from './IUser';
import type { IMessage } from './IMessage';
import type { ReadReceipt } from './ReadReceipt';
import type { ValueOf, AtLeast } from './utils';

export type RoomIdentification = { rid?: IRoom['_id']; name?: string };
export interface IRoomTypeRouteConfig {
	name: string;
	path?: string;
	action?: RouteOptions['action'];
	link?: (data: RoomIdentification) => Record<string, string>;
}

export const RoomSettingsEnum = {
	TYPE: 'type',
	NAME: 'roomName',
	TOPIC: 'roomTopic',
	ANNOUNCEMENT: 'roomAnnouncement',
	DESCRIPTION: 'roomDescription',
	READ_ONLY: 'readOnly',
	REACT_WHEN_READ_ONLY: 'reactWhenReadOnly',
	ARCHIVE_OR_UNARCHIVE: 'archiveOrUnarchive',
	JOIN_CODE: 'joinCode',
	BROADCAST: 'broadcast',
	SYSTEM_MESSAGES: 'systemMessages',
	E2E: 'encrypted',
} as const;

export const RoomMemberActions = {
	ARCHIVE: 'archive',
	IGNORE: 'ignore',
	BLOCK: 'block',
	MUTE: 'mute',
	SET_AS_OWNER: 'setAsOwner',
	SET_AS_LEADER: 'setAsLeader',
	SET_AS_MODERATOR: 'setAsModerator',
	LEAVE: 'leave',
	REMOVE_USER: 'removeUser',
	JOIN: 'join',
	INVITE: 'invite',
} as const;

export const UiTextContext = {
	CLOSE_WARNING: 'closeWarning',
	HIDE_WARNING: 'hideWarning',
	LEAVE_WARNING: 'leaveWarning',
	NO_ROOMS_SUBSCRIBED: 'noRoomsSubscribed',
} as const;

export interface IRoomTypeConfig {
	identifier: string;
	order: number;
	icon?: string;
	header?: string;
	label?: string;
	route?: IRoomTypeRouteConfig;
	customTemplate?: string;
	notSubscribedTpl?: string;
	readOnlyTpl?: string;
}

export interface IRoomTypeClientDirectives {
	config: IRoomTypeConfig;

	allowRoomSettingChange: (room: Partial<IRoom>, setting: ValueOf<typeof RoomSettingsEnum>) => boolean;
	allowMemberAction: (room: Partial<IRoom>, action: ValueOf<typeof RoomMemberActions>) => boolean;
	roomName: (room: AtLeast<IRoom, '_id' | 'name' | 'fname' | 'prid'>) => string | undefined;
	isGroupChat: (room: Partial<IRoom>) => boolean;
	openCustomProfileTab: (instance: any, room: IRoom, username: string) => boolean;
	getUiText: (context: ValueOf<typeof UiTextContext>) => string;
	condition: () => boolean;
	getAvatarPath: (
		room: AtLeast<IRoom, '_id' | 'name' | 'fname' | 'prid' | 'avatarETag' | 'uids' | 'usernames'> & { username?: IRoom['_id'] },
	) => string;
	getIcon: (room: Partial<IRoom>) => string | undefined;
	getUserStatus: (roomId: string) => string | undefined;
	findRoom: (identifier: string) => IRoom | undefined;
	showJoinLink: (roomId: string) => boolean;
	isLivechatRoom: () => boolean;
	canSendMessage: (rid: string) => boolean;
	readOnly?: (rid: string, user: AtLeast<IUser, 'username'>) => boolean;
}

export interface IRoomTypeServerDirectives {
	config: IRoomTypeConfig;

	allowRoomSettingChange: (room: IRoom, setting: ValueOf<typeof RoomSettingsEnum>) => boolean;
	allowMemberAction: (room: IRoom, action: ValueOf<typeof RoomMemberActions>) => boolean;
	roomName: (room: IRoom, userId?: string) => string | undefined;
	isGroupChat: (room: IRoom) => boolean;
	canBeDeleted: (hasPermission: (permissionId: string, rid?: string) => boolean, room: IRoom) => boolean;
	preventRenaming: () => boolean;
	getDiscussionType: () => RoomType;
	canAccessUploadedFile: (params: { rc_uid: string; rc_rid: string; rc_token: string }) => boolean;
	getNotificationDetails: (
		room: IRoom,
		sender: AtLeast<IUser, '_id' | 'name' | 'username'>,
		notificationMessage: string,
		userId: string,
	) => { title: string | undefined; text: string };
	getMsgSender: (senderId: IRocketChatRecord['_id']) => IRocketChatRecord | undefined;
	includeInRoomSearch: () => boolean;
	getReadReceiptsExtraData: (message: IMessage) => Partial<ReadReceipt>;
	includeInDashboard: () => boolean;
	roomFind?: (rid: string) => IRoom | undefined;
}
