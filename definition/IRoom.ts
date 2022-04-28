import { IRocketChatRecord } from './IRocketChatRecord';
import { IMessage } from './IMessage';
import { IUser, Username } from './IUser';
import { RoomType } from './RoomType';

type CallStatus = 'ringing' | 'ended' | 'declined' | 'ongoing';

export type RoomID = string;
export type ChannelName = string;
interface IRequestTranscript {
	email: string;
	requestedAt: Date;
	requestedBy: IUser;
	subject: string;
}

export interface IRoom extends IRocketChatRecord {
	_id: RoomID;
	t: RoomType;
	name?: string;
	fname?: string;
	msgs: number;
	default?: true;
	broadcast?: true;
	featured?: true;
	encrypted?: boolean;
	topic?: string;

	reactWhenReadOnly?: boolean;

	u: Pick<IUser, '_id' | 'username' | 'name'>;
	uids?: Array<string>;

	lastMessage?: IMessage;
	lm?: Date;
	usersCount: number;
	jitsiTimeout?: Date;
	urgency?: string;
	callStatus?: CallStatus;
	webRtcCallStartTime?: Date;
	servedBy?: {
		_id: string;
	};

	streamingOptions?: {
		id?: string;
		type: string;
	};

	prid?: string;
	avatarETag?: string;
	tokenpass?: {
		require: string;
		tokens: {
			token: string;
			balance: number;
		}[];
	};

	teamMain?: boolean;
	teamId?: string;
	teamDefault?: boolean;
	open?: boolean;

	autoTranslateLanguage: string;
	autoTranslate?: boolean;
	unread?: number;
	alert?: boolean;
	hideUnreadStatus?: boolean;

	sysMes?: string[];
	muted?: string[];
	unmuted?: string[];

	usernames?: string[];
	ts?: Date;

	cl?: boolean;
	ro?: boolean;
	favorite?: boolean;
	archived?: boolean;
	announcement?: string;
	description?: string;
	createdOTR?: boolean;
	e2eKeyId?: string;
}

export interface ICreatedRoom extends IRoom {
	rid: string;
}

export interface ITeamRoom extends IRoom {
	teamMain: boolean;
	teamId: string;
}

export const isTeamRoom = (room: Partial<IRoom>): room is ITeamRoom => !!room.teamMain;
export const isPrivateTeamRoom = (room: Partial<IRoom>): room is ITeamRoom => isTeamRoom(room) && room.t === 'p';
export const isPublicTeamRoom = (room: Partial<IRoom>): room is ITeamRoom => isTeamRoom(room) && room.t === 'c';

export const isDiscussion = (room: Partial<IRoom>): room is IRoom => !!room.prid;
export const isPrivateDiscussion = (room: Partial<IRoom>): room is IRoom => isDiscussion(room) && room.t === 'p';
export const isPublicDiscussion = (room: Partial<IRoom>): room is IRoom => isDiscussion(room) && room.t === 'c';

export interface IDirectMessageRoom extends Omit<IRoom, 'default' | 'featured' | 'u' | 'name'> {
	t: 'd';
	uids: Array<string>;
	usernames: Array<Username>;
}

export const isDirectMessageRoom = (room: Partial<IRoom>): room is IDirectMessageRoom => room.t === 'd';
export const isMultipleDirectMessageRoom = (room: Partial<IRoom>): room is IDirectMessageRoom =>
	isDirectMessageRoom(room) && room.uids.length > 2;

export enum OmnichannelSourceType {
	WIDGET = 'widget',
	EMAIL = 'email',
	SMS = 'sms',
	APP = 'app',
	API = 'api',
	OTHER = 'other', // catch-all source type
}

export interface IOmnichannelGenericRoom extends Omit<IRoom, 'default' | 'featured' | 'broadcast' | ''> {
	t: 'l' | 'v';
	v: {
		_id?: string;
		token?: string;
		status: 'online' | 'busy' | 'away' | 'offline';
	};
	email?: {
		// Data used when the room is created from an email, via email Integration.
		inbox: string;
		thread: string;
		replyTo: string;
		subject: string;
	};
	source: {
		// TODO: looks like this is not so required as the definition suggests
		// The source, or client, which created the Omnichannel room
		type: OmnichannelSourceType;
		// An optional identification of external sources, such as an App
		id?: string;
		// A human readable alias that goes with the ID, for post analytical purposes
		alias?: string;
		// A label to be shown in the room info
		label?: string;
		// The sidebar icon
		sidebarIcon?: string;
		// The default sidebar icon
		defaultIcon?: string;
	};
	transcriptRequest?: IRequestTranscript;
	servedBy?: {
		_id: string;
		ts: Date;
		username: IUser['username'];
	};
	onHold?: boolean;
	departmentId?: string;

	lastMessage?: IMessage & { token?: string };

	tags?: any;
	closedAt?: Date;
	metrics?: any;
	waitingResponse: any;
	responseBy: any;
	priorityId: any;
	livechatData: any;
	queuedAt?: Date;

	ts: Date;
	label?: string;
	crmData?: unknown;

	// optional keys for closed rooms
	closer?: 'user' | 'visitor';
	closedBy?: {
		_id: string;
		username: IUser['username'];
	};
}

export interface IOmnichannelRoom extends IOmnichannelGenericRoom {
	t: 'l';
}

export interface IVoipRoom extends IOmnichannelGenericRoom {
	t: 'v';
	// The timestamp when call was started
	callStarted: Date;
	// The amount of time the call lasted, in milliseconds
	callDuration?: number;
	// The amount of time call was in queue in milliseconds
	callWaitingTime?: number;
	// The time when call was ended
	callEndedAt?: Date;
	// The total of hold time for call (calculated at closing time) in seconds
	callTotalHoldTime?: number;
	// The pbx queue the call belongs to
	queue: string;
	// The ID assigned to the call (opaque ID)
	callUniqueId?: string;
	v: {
		_id?: string;
		token?: string;
		status: 'online' | 'busy' | 'away' | 'offline';
		phone?: string | null;
	};
}

export interface IOmnichannelRoomFromAppSource extends IOmnichannelRoom {
	source: {
		type: OmnichannelSourceType.APP;
		id: string;
		alias?: string;
		sidebarIcon?: string;
		defaultIcon?: string;
	};
}

export type IRoomClosingInfo = Pick<IOmnichannelGenericRoom, 'closer' | 'closedBy' | 'closedAt' | 'tags'> &
	Pick<IVoipRoom, 'callDuration' | 'callTotalHoldTime'> & { serviceTimeDuration?: number };

export const isOmnichannelRoom = (room: IRoom): room is IOmnichannelRoom & IRoom => room.t === 'l';

export const isVoipRoom = (room: IRoom): room is IVoipRoom & IRoom => room.t === 'v';

export const isOmnichannelRoomFromAppSource = (room: IRoom): room is IOmnichannelRoomFromAppSource => {
	if (!isOmnichannelRoom(room)) {
		return false;
	}

	return room.source?.type === OmnichannelSourceType.APP;
};

/** @deprecated */
export { RoomType };
