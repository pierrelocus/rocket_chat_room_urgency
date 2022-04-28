import { FilterQuery, FindOneOptions, WithoutProjection } from 'mongodb';

import { ITeam, IRecordsWithTotal, IPaginationOptions, IQueryOptions, ITeamMember, TEAM_TYPE } from '../../../definition/ITeam';
import { IRoom } from '../../../definition/IRoom';
import { IUser, IRole } from '../../../definition/IUser';
import { ICreateRoomParams } from './IRoomService';

export interface ITeamCreateRoom extends Omit<ICreateRoomParams, 'type'> {
	id?: string;
}

export interface ITeamCreateParams {
	team: Pick<ITeam, 'name' | 'type'>;
	room: ITeamCreateRoom;
	members?: Array<string> | null; // list of user _ids
	owner?: string | null; // the team owner. If not present, owner = requester
}

export interface ITeamMemberParams {
	userId: string;
	roles?: Array<IRole['_id']> | null;
}

export interface IUserInfo {
	_id: string;
	username?: string;
	name: string;
	status: string;
	settings?: Record<string, any>;
}

export interface ITeamMemberInfo {
	user: IUserInfo;
	roles?: IRole['_id'][] | null;
	createdBy: Omit<IUserInfo, 'name' | 'status'>;
	createdAt: Date;
}

export interface ITeamInfo extends ITeam {
	rooms: number;
	numberOfUsers: number;
}

export interface IListRoomsFilter {
	name?: string;
	isDefault: boolean;
	getAllRooms: boolean;
	allowPrivateTeam: boolean;
}

export type ITeamUpdateData = { updateRoom?: boolean } & (
	| {
			name: string;
			type?: TEAM_TYPE;
	  }
	| {
			name?: string;
			type: TEAM_TYPE;
	  }
);

export type ITeamAutocompleteResult = Pick<IRoom, '_id' | 'fname' | 'teamId' | 'name' | 't' | 'avatarETag'>;

export interface ITeamService {
	create(uid: string, params: ITeamCreateParams): Promise<ITeam>;
	addRooms(uid: string, rooms: Array<string>, teamId: string): Promise<Array<IRoom>>;
	removeRoom(uid: string, rid: string, teamId: string, canRemoveAnyRoom: boolean): Promise<IRoom>;
	listRooms(uid: string, teamId: string, filter: IListRoomsFilter, pagination: IPaginationOptions): Promise<IRecordsWithTotal<IRoom>>;
	listRoomsOfUser(
		uid: string,
		teamId: string,
		userId: string,
		allowPrivateTeam: boolean,
		showCanDeleteOnly: boolean,
		pagination: IPaginationOptions,
	): Promise<IRecordsWithTotal<IRoom>>;
	updateRoom(uid: string, rid: string, isDefault: boolean, canUpdateAnyRoom: boolean): Promise<IRoom>;
	list(uid: string, paginationOptions?: IPaginationOptions, queryOptions?: IQueryOptions<ITeam>): Promise<IRecordsWithTotal<ITeam>>;
	listAll(options?: IPaginationOptions): Promise<IRecordsWithTotal<ITeam>>;
	listByNames(names: Array<string>, options?: FindOneOptions<ITeam>): Promise<Array<ITeam>>;
	listByIds(ids: Array<string>, options?: FindOneOptions<ITeam>): Promise<ITeam[]>;
	search(userId: string, term: string | RegExp, options?: FindOneOptions<ITeam>): Promise<ITeam[]>;
	members(
		uid: string,
		teamId: string,
		canSeeAll: boolean,
		options?: IPaginationOptions,
		queryOptions?: FilterQuery<IUser>,
	): Promise<IRecordsWithTotal<ITeamMemberInfo>>;
	addMember(inviter: Pick<IUser, '_id' | 'username'>, userId: string, teamId: string): Promise<boolean>;
	addMembers(uid: string, teamId: string, members: Array<ITeamMemberParams>): Promise<void>;
	updateMember(teamId: string, members: ITeamMemberParams): Promise<void>;
	removeMember(teamId: string, userId: string): Promise<void>;
	removeMembers(uid: string, teamId: string, members: Array<ITeamMemberParams>): Promise<boolean>;
	getInfoByName(teamName: string): Promise<Partial<ITeam> | null>;
	getInfoById(teamId: string): Promise<Partial<ITeam> | null>;
	deleteById(teamId: string): Promise<boolean>;
	deleteByName(teamName: string): Promise<boolean>;
	unsetTeamIdOfRooms(uid: string, teamId: string): void;
	getOneById(teamId: string, options?: FindOneOptions<ITeam>): Promise<ITeam | null>;
	getOneById<P>(teamId: string, options?: FindOneOptions<P extends ITeam ? ITeam : P>): Promise<ITeam | P | null>;
	getOneByName(teamName: string | RegExp, options?: FindOneOptions<ITeam>): Promise<ITeam | null>;
	getOneByMainRoomId(teamId: string): Promise<Pick<ITeam, '_id'> | null>;
	getOneByRoomId(teamId: string): Promise<ITeam | null>;
	getMatchingTeamRooms(teamId: string, rids: Array<string>): Promise<Array<string>>;
	autocomplete(uid: string, name: string): Promise<ITeamAutocompleteResult[]>;
	getAllPublicTeams(options?: WithoutProjection<FindOneOptions<ITeam>>): Promise<Array<ITeam>>;
	getMembersByTeamIds(teamIds: Array<string>, options: FindOneOptions<ITeamMember>): Promise<Array<ITeamMember>>;
	update(uid: string, teamId: string, updateData: ITeamUpdateData): Promise<void>;
	listTeamsBySubscriberUserId(uid: string, options?: FindOneOptions<ITeamMember>): Promise<Array<ITeamMember> | null>;
	insertMemberOnTeams(userId: string, teamIds: Array<string>): Promise<void>;
	removeMemberFromTeams(userId: string, teamIds: Array<string>): Promise<void>;
	removeAllMembersFromTeam(teamId: string): Promise<void>;
	removeRolesFromMember(teamId: string, userId: string, roles: Array<IRole['_id']>): Promise<boolean>;
}
