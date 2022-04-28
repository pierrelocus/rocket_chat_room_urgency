import { Rooms } from '../../../app/models/server/raw';
import { addMigration } from '../../lib/migrations';

addMigration({
	version: 259,
	async up() {
		await Rooms.updateMany(
			{},
			{
				$set: {
					urgency: 'normal'
				},
			},
		);
	},
});
