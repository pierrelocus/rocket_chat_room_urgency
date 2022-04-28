import os from 'os';
import { log } from 'console';

import _ from 'underscore';
import { Meteor } from 'meteor/meteor';
import { MongoInternals } from 'meteor/mongo';

import { Settings, Users, Rooms, Subscriptions, Messages, LivechatVisitors } from '../../../models/server';
import { settings } from '../../../settings/server';
import { Info, getMongoInfo } from '../../../utils/server';
import { getControl } from '../../../../server/lib/migrations';
import { getStatistics as federationGetStatistics } from '../../../federation/server/functions/dashboard';
import {
	NotificationQueue,
	Users as UsersRaw,
	Rooms as RoomsRaw,
	Statistics,
	Sessions,
	Integrations,
	Uploads,
	LivechatDepartment,
	EmailInbox,
	LivechatBusinessHours,
	Messages as MessagesRaw,
	InstanceStatus,
} from '../../../models/server/raw';
import { readSecondaryPreferred } from '../../../../server/database/readSecondaryPreferred';
import { getAppsStatistics } from './getAppsStatistics';
import { getServicesStatistics } from './getServicesStatistics';
import { getStatistics as getEnterpriseStatistics } from '../../../../ee/app/license/server';
import { Analytics } from '../../../../server/sdk';
import { getSettingsStatistics } from '../../../../server/lib/statistics/getSettingsStatistics';
import { IRoom } from '../../../../definition/IRoom';
import { IStats } from '../../../../definition/IStats';

const wizardFields = ['Organization_Type', 'Industry', 'Size', 'Country', 'Language', 'Server_Type', 'Register_Server'];

const getUserLanguages = async (totalUsers: number): Promise<{ [key: string]: number }> => {
	const result = await UsersRaw.getUserLanguages();

	const languages: { [key: string]: number } = {
		none: totalUsers,
	};

	result.forEach(({ _id, total }: { _id: string; total: number }) => {
		if (!_id) {
			return;
		}
		languages[_id] = total;
		languages.none -= total;
	});

	return languages;
};

const { db } = MongoInternals.defaultRemoteCollectionDriver().mongo;

export const statistics = {
	get: async (): Promise<IStats> => {
		const readPreference = readSecondaryPreferred(db);

		const statistics = {} as IStats;
		const statsPms = [];

		// Setup Wizard
		statistics.wizard = {};
		wizardFields.forEach((field) => {
			const record = Settings.findOne(field);
			if (record) {
				const wizardField = field.replace(/_/g, '').replace(field[0], field[0].toLowerCase());
				statistics.wizard[wizardField] = record.value;
			}
		});

		// Version
		statistics.uniqueId = settings.get('uniqueID');
		if (Settings.findOne('uniqueID')) {
			statistics.installedAt = Settings.findOne('uniqueID').createdAt;
		}

		if (Info) {
			statistics.version = Info.version;
			statistics.tag = Info.tag;
			statistics.branch = Info.branch;
		}

		// User statistics
		statistics.totalUsers = Users.find().count();
		statistics.activeUsers = Users.getActiveLocalUserCount();
		statistics.activeGuests = Users.getActiveLocalGuestCount();
		statistics.nonActiveUsers = Users.find({ active: false }).count();
		statistics.appUsers = Users.find({ type: 'app' }).count();
		statistics.onlineUsers = Meteor.users.find({ status: 'online' }).count();
		statistics.awayUsers = Meteor.users.find({ status: 'away' }).count();
		statistics.busyUsers = Meteor.users.find({ status: 'busy' }).count();
		statistics.totalConnectedUsers = statistics.onlineUsers + statistics.awayUsers;
		statistics.offlineUsers = statistics.totalUsers - statistics.onlineUsers - statistics.awayUsers - statistics.busyUsers;
		statsPms.push(
			getUserLanguages(statistics.totalUsers).then((total) => {
				statistics.userLanguages = total;
			}),
		);

		// Room statistics
		statistics.totalRooms = Rooms.find().count();
		statistics.totalChannels = Rooms.findByType('c').count();
		statistics.totalPrivateGroups = Rooms.findByType('p').count();
		statistics.totalDirect = Rooms.findByType('d').count();
		statistics.totalLivechat = Rooms.findByType('l').count();
		statistics.totalDiscussions = Rooms.countDiscussions();
		statistics.totalThreads = Messages.countThreads();

		// livechat visitors
		statistics.totalLivechatVisitors = LivechatVisitors.find().count();

		// livechat agents
		statistics.totalLivechatAgents = Users.findAgents().count();

		// livechat enabled
		statistics.livechatEnabled = settings.get('Livechat_enabled');

		// Count and types of omnichannel rooms
		statsPms.push(
			RoomsRaw.allRoomSourcesCount()
				.toArray()
				.then((roomSources) => {
					statistics.omnichannelSources = roomSources.map(({ _id: { id, alias, type }, count }) => ({
						id,
						alias,
						type,
						count,
					}));
				}),
		);

		// Number of departments
		statsPms.push(
			LivechatDepartment.col.count().then((count) => {
				statistics.departments = count;
			}),
		);

		// Type of routing algorithm used on omnichannel
		statistics.routingAlgorithm = settings.get('Livechat_Routing_Method') || '';

		// is on-hold active
		statistics.onHoldEnabled = settings.get('Livechat_allow_manual_on_hold');

		// Number of Email Inboxes
		statsPms.push(
			EmailInbox.col.count().then((count) => {
				statistics.emailInboxes = count;
			}),
		);

		statsPms.push(
			LivechatBusinessHours.col.count().then((count) => {
				statistics.BusinessHours = {
					// Number of Business Hours
					total: count,
					// Business Hours strategy
					strategy: settings.get('Livechat_enable_business_hours') || '',
				};
			}),
		);

		// Type of routing algorithm used on omnichannel
		statistics.routingAlgorithm = settings.get('Livechat_Routing_Method');

		// is on-hold active
		statistics.onHoldEnabled = settings.get('Livechat_allow_manual_on_hold');

		// Last-Chatted Agent Preferred (enabled/disabled)
		statistics.lastChattedAgentPreferred = settings.get('Livechat_last_chatted_agent_routing');

		// Assign new conversations to the contact manager (enabled/disabled)
		statistics.assignNewConversationsToContactManager = settings.get('Omnichannel_contact_manager_routing');

		// How to handle Visitor Abandonment setting
		statistics.visitorAbandonment = settings.get('Livechat_abandoned_rooms_action');

		// Amount of chats placed on hold
		statsPms.push(
			MessagesRaw.col.distinct('rid', { t: 'omnichannel_placed_chat_on_hold' }).then((msgs) => {
				statistics.chatsOnHold = msgs.length;
			}),
		);

		// VoIP Enabled
		statistics.voipEnabled = settings.get('VoIP_Enabled');

		// Amount of VoIP Calls
		statsPms.push(
			RoomsRaw.col
				.find({ t: 'v' })
				.count()
				.then((count) => {
					statistics.voipCalls = count;
				}),
		);

		// Amount of VoIP Extensions connected
		statsPms.push(
			UsersRaw.col
				.find({ extension: { $exists: true } })
				.count()
				.then((count) => {
					statistics.voipExtensions = count;
				}),
		);

		// Amount of Calls that ended properly
		statsPms.push(
			MessagesRaw.col
				.find({ t: 'voip-call-wrapup' })
				.count()
				.then((count) => {
					statistics.voipSuccessfulCalls = count;
				}),
		);

		// Amount of Calls that ended with an error
		statsPms.push(
			MessagesRaw.col
				.find({ t: 'voip-call-ended-unexpectedly' })
				.count()
				.then((count) => {
					statistics.voipErrorCalls = count;
				}),
		);
		// Amount of Calls that were put on hold
		statsPms.push(
			MessagesRaw.col.distinct('rid', { t: 'voip-call-on-hold' }).then((msgs) => {
				statistics.voipOnHoldCalls = msgs.length;
			}),
		);

		// Message statistics
		statistics.totalChannelMessages = _.reduce(
			Rooms.findByType('c', { fields: { msgs: 1 } }).fetch(),
			function _countChannelMessages(num: number, room: IRoom) {
				return num + room.msgs;
			},
			0,
		);
		statistics.totalPrivateGroupMessages = _.reduce(
			Rooms.findByType('p', { fields: { msgs: 1 } }).fetch(),
			function _countPrivateGroupMessages(num: number, room: IRoom) {
				return num + room.msgs;
			},
			0,
		);
		statistics.totalDirectMessages = _.reduce(
			Rooms.findByType('d', { fields: { msgs: 1 } }).fetch(),
			function _countDirectMessages(num: number, room: IRoom) {
				return num + room.msgs;
			},
			0,
		);
		statistics.totalLivechatMessages = _.reduce(
			Rooms.findByType('l', { fields: { msgs: 1 } }).fetch(),
			function _countLivechatMessages(num: number, room: IRoom) {
				return num + room.msgs;
			},
			0,
		);
		statistics.totalMessages =
			statistics.totalChannelMessages +
			statistics.totalPrivateGroupMessages +
			statistics.totalDirectMessages +
			statistics.totalLivechatMessages;

		// Federation statistics
		statsPms.push(
			federationGetStatistics().then((federationOverviewData) => {
				statistics.federatedServers = federationOverviewData.numberOfServers;
				statistics.federatedUsers = federationOverviewData.numberOfFederatedUsers;
			}),
		);

		statistics.lastLogin = Users.getLastLogin();
		statistics.lastMessageSentAt = Messages.getLastTimestamp();
		statistics.lastSeenSubscription = Subscriptions.getLastSeen();

		statistics.os = {
			type: os.type(),
			platform: os.platform(),
			arch: os.arch(),
			release: os.release(),
			uptime: os.uptime(),
			loadavg: os.loadavg(),
			totalmem: os.totalmem(),
			freemem: os.freemem(),
			cpus: os.cpus(),
		};

		statistics.process = {
			nodeVersion: process.version,
			pid: process.pid,
			uptime: process.uptime(),
		};

		statistics.deploy = {
			method: process.env.DEPLOY_METHOD || 'tar',
			platform: process.env.DEPLOY_PLATFORM || 'selfinstall',
		};

		statistics.readReceiptsEnabled = settings.get('Message_Read_Receipt_Enabled');
		statistics.readReceiptsDetailed = settings.get('Message_Read_Receipt_Store_Users');

		statistics.enterpriseReady = true;
		statsPms.push(
			Uploads.find()
				.count()
				.then((count) => {
					statistics.uploadsTotal = count;
				}),
		);
		statsPms.push(
			Uploads.col
				.aggregate(
					[
						{
							$group: { _id: 'total', total: { $sum: '$size' } },
						},
					],
					{ readPreference },
				)
				.toArray()
				.then((agg) => {
					const [result] = agg;
					statistics.uploadsTotalSize = result ? (result as any).total : 0;
				}),
		);

		statistics.migration = getControl();
		statsPms.push(
			InstanceStatus.col
				.find({ _updatedAt: { $gt: new Date(Date.now() - process.uptime() * 1000 - 2000) } })
				.count()
				.then((count) => {
					statistics.instanceCount = count;
				}),
		);

		const { oplogEnabled, mongoVersion, mongoStorageEngine } = getMongoInfo();
		statistics.oplogEnabled = oplogEnabled;
		statistics.mongoVersion = mongoVersion;
		statistics.mongoStorageEngine = mongoStorageEngine;

		statsPms.push(
			Sessions.getUniqueUsersOfYesterday().then((result) => {
				statistics.uniqueUsersOfYesterday = result;
			}),
		);
		statsPms.push(
			Sessions.getUniqueUsersOfLastWeek().then((result) => {
				statistics.uniqueUsersOfLastWeek = result;
			}),
		);
		statsPms.push(
			Sessions.getUniqueUsersOfLastMonth().then((result) => {
				statistics.uniqueUsersOfLastMonth = result;
			}),
		);
		statsPms.push(
			Sessions.getUniqueDevicesOfYesterday().then((result) => {
				statistics.uniqueDevicesOfYesterday = result;
			}),
		);
		statsPms.push(
			Sessions.getUniqueDevicesOfLastWeek().then((result) => {
				statistics.uniqueDevicesOfLastWeek = result;
			}),
		);
		statsPms.push(
			Sessions.getUniqueDevicesOfLastMonth().then((result) => {
				statistics.uniqueDevicesOfLastMonth = result;
			}),
		);
		statsPms.push(
			Sessions.getUniqueOSOfYesterday().then((result) => {
				statistics.uniqueOSOfYesterday = result;
			}),
		);
		statsPms.push(
			Sessions.getUniqueOSOfLastWeek().then((result) => {
				statistics.uniqueOSOfLastWeek = result;
			}),
		);
		statsPms.push(
			Sessions.getUniqueOSOfLastMonth().then((result) => {
				statistics.uniqueOSOfLastMonth = result;
			}),
		);

		statistics.apps = getAppsStatistics();
		statistics.services = getServicesStatistics();

		// If getSettingsStatistics() returns an error, save as empty object.
		statsPms.push(
			getSettingsStatistics().then((res) => {
				const settingsStatisticsObject = res || {};
				statistics.settings = settingsStatisticsObject;
			}),
		);

		statsPms.push(
			Integrations.find(
				{},
				{
					projection: {
						_id: 0,
						type: 1,
						enabled: 1,
						scriptEnabled: 1,
					},
					readPreference,
				},
			)
				.toArray()
				.then((found) => {
					const integrations = found;

					statistics.integrations = {
						totalIntegrations: integrations.length,
						totalIncoming: integrations.filter((integration) => integration.type === 'webhook-incoming').length,
						totalIncomingActive: integrations.filter(
							(integration) => integration.enabled === true && integration.type === 'webhook-incoming',
						).length,
						totalOutgoing: integrations.filter((integration) => integration.type === 'webhook-outgoing').length,
						totalOutgoingActive: integrations.filter(
							(integration) => integration.enabled === true && integration.type === 'webhook-outgoing',
						).length,
						totalWithScriptEnabled: integrations.filter((integration) => integration.scriptEnabled === true).length,
					};
				}),
		);

		statsPms.push(
			NotificationQueue.col.estimatedDocumentCount().then((count) => {
				statistics.pushQueue = count;
			}),
		);

		statsPms.push(
			getEnterpriseStatistics().then((result) => {
				statistics.enterprise = result;
			}),
		);

		statsPms.push(Analytics.resetSeatRequestCount());

		statistics.dashboardCount = settings.get('Engagement_Dashboard_Load_Count');
		statistics.messageAuditApply = settings.get('Message_Auditing_Apply_Count');
		statistics.messageAuditLoad = settings.get('Message_Auditing_Panel_Load_Count');
		statistics.joinJitsiButton = settings.get('Jitsi_Click_To_Join_Count');
		statistics.slashCommandsJitsi = settings.get('Jitsi_Start_SlashCommands_Count');
		statistics.totalOTRRooms = Rooms.findByCreatedOTR().count();
		statistics.totalOTR = settings.get('OTR_Count');

		await Promise.all(statsPms).catch(log);

		return statistics;
	},
	async save(): Promise<IStats> {
		const rcStatistics = await statistics.get();
		rcStatistics.createdAt = new Date();
		await Statistics.insertOne(rcStatistics);
		return rcStatistics;
	},
};
