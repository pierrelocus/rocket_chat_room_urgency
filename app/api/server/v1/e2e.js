import { Meteor } from 'meteor/meteor';

import { API } from '../api';

API.v1.addRoute(
	'e2e.fetchMyKeys',
	{ authRequired: true },
	{
		get() {
			let result;
			Meteor.runAsUser(this.userId, () => {
				result = Meteor.call('e2e.fetchMyKeys');
			});

			return API.v1.success(result);
		},
	},
);

API.v1.addRoute(
	'e2e.getUsersOfRoomWithoutKey',
	{ authRequired: true },
	{
		get() {
			const { rid } = this.queryParams;

			let result;
			Meteor.runAsUser(this.userId, () => {
				result = Meteor.call('e2e.getUsersOfRoomWithoutKey', rid);
			});

			return API.v1.success(result);
		},
	},
);

/**
 * @openapi
 *  /api/v1/e2e.setRoomKeyID:
 *    post:
 *      description: Sets the end-to-end encryption key ID for a room
 *      security:
 *        - autenticated: {}
 *      requestBody:
 *        description: A tuple containing the room ID and the key ID
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                rid:
 *                  type: string
 *                keyID:
 *                  type: string
 *      responses:
 *        200:
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/ApiSuccessV1'
 *        default:
 *          description: Unexpected error
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/ApiFailureV1'
 */
API.v1.addRoute(
	'e2e.setRoomKeyID',
	{ authRequired: true },
	{
		post() {
			const { rid, keyID } = this.bodyParams;

			Meteor.runAsUser(this.userId, () => {
				API.v1.success(Meteor.call('e2e.setRoomKeyID', rid, keyID));
			});

			return API.v1.success();
		},
	},
);

/**
 * @openapi
 *  /api/v1/e2e.setUserPublicAndPrivateKeys:
 *    post:
 *      description: Sets the end-to-end encryption keys for the authenticated user
 *      security:
 *        - autenticated: {}
 *      requestBody:
 *        description: A tuple containing the public and the private keys
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                public_key:
 *                  type: string
 *                private_key:
 *                  type: string
 *      responses:
 *        200:
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/ApiSuccessV1'
 *        default:
 *          description: Unexpected error
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/ApiFailureV1'
 */
API.v1.addRoute(
	'e2e.setUserPublicAndPrivateKeys',
	{ authRequired: true },
	{
		post() {
			const { public_key, private_key } = this.bodyParams;

			Meteor.runAsUser(this.userId, () => {
				API.v1.success(
					Meteor.call('e2e.setUserPublicAndPrivateKeys', {
						public_key,
						private_key,
					}),
				);
			});

			return API.v1.success();
		},
	},
);

/**
 * @openapi
 *  /api/v1/e2e.updateGroupKey:
 *    post:
 *      description: Updates the end-to-end encryption key for a user on a room
 *      security:
 *        - autenticated: {}
 *      requestBody:
 *        description: A tuple containing the user ID, the room ID, and the key
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                uid:
 *                  type: string
 *                rid:
 *                  type: string
 *                key:
 *                  type: string
 *      responses:
 *        200:
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/ApiSuccessV1'
 *        default:
 *          description: Unexpected error
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/ApiFailureV1'
 */
API.v1.addRoute(
	'e2e.updateGroupKey',
	{ authRequired: true },
	{
		post() {
			const { uid, rid, key } = this.bodyParams;

			Meteor.runAsUser(this.userId, () => {
				API.v1.success(Meteor.call('e2e.updateGroupKey', rid, uid, key));
			});

			return API.v1.success();
		},
	},
);
