import { Meteor } from 'meteor/meteor';

import { settingsRegistry, settings } from '../../../settings/server';
import { updateStatus, updateEnabled, isRegisteringOrEnabled } from '../functions/helpers';
import { getFederationDomain } from '../lib/getFederationDomain';
import { getFederationDiscoveryMethod } from '../lib/getFederationDiscoveryMethod';
import { registerWithHub } from '../lib/dns';
import { enableCallbacks, disableCallbacks } from '../lib/callbacks';
import { setupLogger } from '../lib/logger';
import { FederationKeys } from '../../../models/server/raw';
import { STATUS_ENABLED, STATUS_REGISTERING, STATUS_ERROR_REGISTERING, STATUS_DISABLED } from '../constants';

Meteor.startup(async function () {
	const federationPublicKey = await FederationKeys.getPublicKeyString();

	settingsRegistry.addGroup('Federation', function () {
		this.add('FEDERATION_Enabled', false, {
			type: 'boolean',
			i18nLabel: 'Enabled',
			i18nDescription: 'FEDERATION_Enabled',
			alert: 'FEDERATION_Enabled_Alert',
			public: true,
		});

		this.add('FEDERATION_Status', 'Disabled', {
			readonly: true,
			type: 'string',
			i18nLabel: 'FEDERATION_Status',
		});

		this.add('FEDERATION_Domain', '', {
			type: 'string',
			i18nLabel: 'FEDERATION_Domain',
			i18nDescription: 'FEDERATION_Domain_Description',
			alert: 'FEDERATION_Domain_Alert',
			// disableReset: true,
		});

		this.add('FEDERATION_Public_Key', federationPublicKey || '', {
			readonly: true,
			type: 'string',
			multiline: true,
			i18nLabel: 'FEDERATION_Public_Key',
			i18nDescription: 'FEDERATION_Public_Key_Description',
		});

		this.add('FEDERATION_Discovery_Method', 'dns', {
			type: 'select',
			values: [
				{
					key: 'dns',
					i18nLabel: 'DNS',
				},
				{
					key: 'hub',
					i18nLabel: 'Hub',
				},
			],
			i18nLabel: 'FEDERATION_Discovery_Method',
			i18nDescription: 'FEDERATION_Discovery_Method_Description',
			public: true,
		});

		this.add('FEDERATION_Test_Setup', 'FEDERATION_Test_Setup', {
			type: 'action',
			actionText: 'FEDERATION_Test_Setup',
		});
	});
});

const updateSettings = async function (): Promise<void> {
	// Get the key pair

	if (getFederationDiscoveryMethod() === 'hub' && !Promise.await(isRegisteringOrEnabled())) {
		// Register with hub
		try {
			await updateStatus(STATUS_REGISTERING);

			await registerWithHub(getFederationDomain(), settings.get('Site_Url'), await FederationKeys.getPublicKeyString());

			await updateStatus(STATUS_ENABLED);
		} catch (err) {
			// Disable federation
			await updateEnabled(false);

			await updateStatus(STATUS_ERROR_REGISTERING);
		}
		return;
	}
	await updateStatus(STATUS_ENABLED);
};

// Add settings listeners
settings.watch('FEDERATION_Enabled', function enableOrDisable(value) {
	setupLogger.info(`Federation is ${value ? 'enabled' : 'disabled'}`);

	if (value) {
		Promise.await(updateSettings());

		enableCallbacks();
	} else {
		Promise.await(updateStatus(STATUS_DISABLED));

		disableCallbacks();
	}

	value && updateSettings();
});

settings.watchMultiple(['FEDERATION_Discovery_Method', 'FEDERATION_Domain'], updateSettings);
