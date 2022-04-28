import { escapeRegExp } from '@rocket.chat/string-helpers';

import { hasPermissionAsync } from '../../../../../../app/authorization/server/functions/hasPermission';
import LivechatUnit from '../../../../models/server/models/LivechatUnit';
import LivechatUnitMonitors from '../../../../models/server/raw/LivechatUnitMonitors';
import { IOmnichannelBusinessUnit } from '../../../../../../definition/IOmnichannelBusinessUnit';
import { ILivechatMonitor } from '../../../../../../definition/ILivechatMonitor';

export async function findUnits({
	userId,
	text,
	pagination: { offset, count, sort },
}: {
	userId: string;
	text?: string;
	pagination: {
		offset: number;
		count: number;
		sort: Record<string, unknown>;
	};
}): Promise<{
	units: IOmnichannelBusinessUnit[];
	count: number;
	offset: number;
	total: number;
}> {
	if (!(await hasPermissionAsync(userId, 'manage-livechat-units'))) {
		throw new Error('error-not-authorized');
	}
	const filter = text && new RegExp(escapeRegExp(text), 'i');

	const query = { ...(text && { $or: [{ name: filter }] }) };

	const cursor = LivechatUnit.find(query, {
		sort: sort || { name: 1 },
		skip: offset,
		limit: count,
	});

	const total = cursor.count();

	const units = cursor.fetch();

	return {
		units,
		count: units.length,
		offset,
		total,
	};
}

export async function findUnitMonitors({ userId, unitId }: { userId: string; unitId: string }): Promise<ILivechatMonitor[]> {
	if (!(await hasPermissionAsync(userId, 'manage-livechat-monitors'))) {
		throw new Error('error-not-authorized');
	}
	return LivechatUnitMonitors.find({ unitId }).toArray() as Promise<ILivechatMonitor[]>;
}

export async function findUnitById({ userId, unitId }: { userId: string; unitId: string }): Promise<IOmnichannelBusinessUnit> {
	if (!(await hasPermissionAsync(userId, 'manage-livechat-units'))) {
		throw new Error('error-not-authorized');
	}
	return LivechatUnit.findOneById(unitId);
}
