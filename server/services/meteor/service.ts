import { Meteor } from 'meteor/meteor';
import { ServiceConfiguration } from 'meteor/service-configuration';
import { UserPresenceMonitor, UserPresence } from 'meteor/konecty:user-presence';
import { MongoInternals } from 'meteor/mongo';

import { metrics } from '../../../app/metrics';
import { ServiceClassInternal } from '../../sdk/types/ServiceClass';
import { AutoUpdateRecord, IMeteor } from '../../sdk/types/IMeteor';
import { api } from '../../sdk/api';
import { Users } from '../../../app/models/server/raw/index';
import { Livechat } from '../../../app/livechat/server';
import { settings } from '../../../app/settings/server/functions/settings';
import { setValue, updateValue } from '../../../app/settings/server/raw';
import { IRoutingManagerConfig } from '../../../definition/IRoutingManagerConfig';
import { RoutingManager } from '../../../app/livechat/server/lib/RoutingManager';
import { onlineAgents, monitorAgents } from '../../../app/livechat/server/lib/stream/agentStatus';
import { IUser } from '../../../definition/IUser';
import { matrixBroadCastActions } from '../../stream/streamBroadcast';
import { triggerHandler } from '../../../app/integrations/server/lib/triggerHandler';
import { ListenersModule, minimongoChangeMap } from '../../modules/listeners/listeners.module';
import notifications from '../../../app/notifications/server/lib/Notifications';
import { configureEmailInboxes } from '../../features/EmailInbox/EmailInbox';
import { isPresenceMonitorEnabled } from '../../lib/isPresenceMonitorEnabled';
import { use } from '../../../app/settings/server/Middleware';

type Callbacks = {
	added(id: string, record: object): void;
	changed(id: string, record: object): void;
	removed(id: string): void;
};

let processOnChange: (diff: Record<string, any>, id: string) => void;
// eslint-disable-next-line no-undef
const disableOplog = !!(Package as any)['disable-oplog'];
const serviceConfigCallbacks = new Set<Callbacks>();

if (disableOplog) {
	// Stores the callbacks for the disconnection reactivity bellow
	const userCallbacks = new Map();

	// Overrides the native observe changes to prevent database polling and stores the callbacks
	// for the users' tokens to re-implement the reactivity based on our database listeners
	const { mongo } = MongoInternals.defaultRemoteCollectionDriver();
	MongoInternals.Connection.prototype._observeChanges = function (
		{
			collectionName,
			selector,
			options = {},
		}: {
			collectionName: string;
			selector: Record<string, any>;
			options?: { fields?: Record<string, number> };
		},
		_ordered: boolean,
		callbacks: Callbacks,
	): any {
		// console.error('Connection.Collection.prototype._observeChanges', collectionName, selector, options);
		let cbs: Set<{ hashedToken: string; callbacks: Callbacks }>;
		let data: { hashedToken: string; callbacks: Callbacks };
		if (callbacks?.added) {
			const records = Promise.await(mongo.rawCollection(collectionName).find(selector, { projection: options.fields }).toArray());
			for (const { _id, ...fields } of records) {
				callbacks.added(_id, fields);
			}

			if (collectionName === 'users' && selector['services.resume.loginTokens.hashedToken']) {
				cbs = userCallbacks.get(selector._id) || new Set();
				data = {
					hashedToken: selector['services.resume.loginTokens.hashedToken'],
					callbacks,
				};

				cbs.add(data);
				userCallbacks.set(selector._id, cbs);
			}
		}

		if (collectionName === 'meteor_accounts_loginServiceConfiguration') {
			serviceConfigCallbacks.add(callbacks);
		}

		return {
			stop(): void {
				if (cbs) {
					cbs.delete(data);
				}
				serviceConfigCallbacks.delete(callbacks);
			},
		};
	};

	// Re-implement meteor's reactivity that uses observe to disconnect sessions when the token
	// associated was removed
	processOnChange = (diff: Record<string, any>, id: string): void => {
		const loginTokens: undefined | { hashedToken: string }[] = diff['services.resume.loginTokens'];
		if (loginTokens) {
			const tokens = loginTokens.map(({ hashedToken }) => hashedToken);

			const cbs = userCallbacks.get(id);
			if (cbs) {
				[...cbs]
					.filter(({ hashedToken }) => !tokens.includes(hashedToken))
					.forEach((item) => {
						item.callbacks.removed(id);
						cbs.delete(item);
					});
			}
		}
	};
}

settings.set = use(settings.set, (context, next) => {
	next(...context);
	const [record] = context;
	updateValue(record._id, record);
});

const clientVersionsStore = new Map<string, AutoUpdateRecord>();

export class MeteorService extends ServiceClassInternal implements IMeteor {
	protected name = 'meteor';

	constructor() {
		super();

		new ListenersModule(this, notifications);

		this.onEvent('watch.settings', async ({ clientAction, setting }): Promise<void> => {
			if (clientAction !== 'removed') {
				settings.set(setting);
				return;
			}

			settings.set({ ...setting, value: undefined });
			setValue(setting._id, undefined);
		});

		// TODO: May need to merge with https://github.com/RocketChat/Rocket.Chat/blob/0ddc2831baf8340cbbbc432f88fc2cb97be70e9b/ee/server/services/Presence/Presence.ts#L28
		if (isPresenceMonitorEnabled()) {
			this.onEvent('watch.userSessions', async ({ clientAction, userSession }): Promise<void> => {
				if (clientAction === 'removed') {
					UserPresenceMonitor.processUserSession(
						{
							_id: userSession._id,
							connections: [
								{
									fake: true,
								},
							],
						},
						'removed',
					);
				}

				UserPresenceMonitor.processUserSession(userSession, minimongoChangeMap[clientAction]);
			});
		}

		this.onEvent('watch.instanceStatus', async ({ clientAction, id, data }): Promise<void> => {
			if (clientAction === 'removed') {
				UserPresence.removeConnectionsByInstanceId(id);
				matrixBroadCastActions?.removed?.(id);
				return;
			}

			if (clientAction === 'inserted') {
				if (data?.extraInformation?.port) {
					matrixBroadCastActions?.added?.(data);
				}
			}
		});

		if (disableOplog) {
			this.onEvent('watch.loginServiceConfiguration', ({ clientAction, id, data }) => {
				if (clientAction === 'removed') {
					serviceConfigCallbacks.forEach((callbacks) => {
						callbacks.removed?.(id);
					});
					return;
				}

				serviceConfigCallbacks.forEach((callbacks) => {
					callbacks[clientAction === 'inserted' ? 'added' : 'changed']?.(id, data);
				});
			});
		}

		this.onEvent('watch.users', async ({ clientAction, id, diff }) => {
			if (disableOplog) {
				if (clientAction === 'updated' && diff) {
					processOnChange(diff, id);
				}
			}

			if (!monitorAgents) {
				return;
			}

			if (clientAction !== 'removed' && diff && !diff.status && !diff.statusLivechat) {
				return;
			}

			switch (clientAction) {
				case 'updated':
				case 'inserted':
					const agent: IUser | undefined = await Users.findOneAgentById(id, {
						projection: {
							status: 1,
							statusLivechat: 1,
						},
					});
					const serviceOnline = agent && agent.status !== 'offline' && agent.statusLivechat === 'available';

					if (serviceOnline) {
						return onlineAgents.add(id);
					}

					onlineAgents.remove(id);

					break;
				case 'removed':
					onlineAgents.remove(id);
					break;
			}
		});

		this.onEvent('watch.integrations', async ({ clientAction, id, data }) => {
			switch (clientAction) {
				case 'inserted':
					if (data.type === 'webhook-outgoing') {
						triggerHandler.addIntegration(data);
					}
					break;
				case 'updated':
					if (data.type === 'webhook-outgoing') {
						triggerHandler.removeIntegration(data);
						triggerHandler.addIntegration(data);
					}
					break;
				case 'removed':
					triggerHandler.removeIntegration({ _id: id });
					break;
			}
		});

		this.onEvent('watch.emailInbox', async () => {
			configureEmailInboxes();
		});

		if (!process.env.DISABLE_MESSAGE_ROUNDTRIP_TRACKING) {
			this.onEvent('watch.messages', ({ message }) => {
				if (message?._updatedAt) {
					metrics.messageRoundtripTime.set(Date.now() - message._updatedAt.getDate());
				}
			});
		}
	}

	async started(): Promise<void> {
		// Even after server startup, client versions might not be updated yet, the only way
		// to make sure we can send the most up to date versions is using the publication below.
		// Since it receives each document one at a time, we have to store them to be able to send
		// them all when needed (i.e.: on ddp-streamer startup).
		Meteor.server.publish_handlers.meteor_autoupdate_clientVersions.call({
			added(_collection: string, _id: string, version: AutoUpdateRecord) {
				clientVersionsStore.set(_id, version);
				api.broadcast('meteor.clientVersionUpdated', version);
			},
			changed(_collection: string, _id: string, version: AutoUpdateRecord) {
				clientVersionsStore.set(_id, version);
				api.broadcast('meteor.clientVersionUpdated', version);
			},
			onStop() {
				//
			},
			ready() {
				//
			},
		});
	}

	async getAutoUpdateClientVersions(): Promise<Record<string, AutoUpdateRecord>> {
		return Object.fromEntries(clientVersionsStore);
	}

	async getLoginServiceConfiguration(): Promise<any[]> {
		return ServiceConfiguration.configurations.find({}, { fields: { secret: 0 } }).fetch();
	}

	async callMethodWithToken(userId: string, token: string, method: string, args: any[]): Promise<void | any> {
		const user = await Users.findOneByIdAndLoginHashedToken(userId, token, {
			projection: { _id: 1 },
		});
		if (!user) {
			return {
				result: Meteor.call(method, ...args),
			};
		}

		return {
			result: Meteor.runAsUser(userId, () => Meteor.call(method, ...args)),
		};
	}

	async notifyGuestStatusChanged(token: string, status: string): Promise<void> {
		return Livechat.notifyGuestStatusChanged(token, status);
	}

	getRoutingManagerConfig(): IRoutingManagerConfig {
		// return false if called before routing method is set
		// this will cause that oplog events received on early stages of server startup
		// won't be fired (at least, inquiry events)
		return RoutingManager.isMethodSet() && RoutingManager.getConfig();
	}
}
