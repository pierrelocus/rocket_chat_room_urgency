import { API } from '../api';
import { getStatistics, getLastStatistics } from '../../../statistics/server';
import telemetryEvent from '../../../statistics/server/lib/telemetryEvents';

API.v1.addRoute(
	'statistics',
	{ authRequired: true },
	{
		get() {
			const { refresh } = this.requestParams();
			return API.v1.success(
				Promise.await(
					getLastStatistics({
						userId: this.userId,
						refresh: refresh && refresh === 'true',
					}),
				),
			);
		},
	},
);

API.v1.addRoute(
	'statistics.list',
	{ authRequired: true },
	{
		get() {
			const { offset, count } = this.getPaginationItems();
			const { sort, fields, query } = this.parseJsonQuery();

			return API.v1.success(
				Promise.await(
					getStatistics({
						userId: this.userId,
						query,
						pagination: {
							offset,
							count,
							sort,
							fields,
						},
					}),
				),
			);
		},
	},
);

API.v1.addRoute(
	'statistics.telemetry',
	{ authRequired: true },
	{
		post() {
			const events = this.requestParams();

			events.params.forEach((event) => {
				const { eventName, ...params } = event;
				telemetryEvent.call(eventName, params);
			});

			return API.v1.success();
		},
	},
);
