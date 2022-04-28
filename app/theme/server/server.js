import crypto from 'crypto';

import _ from 'underscore';
import less from 'less';
import Autoprefixer from 'less-plugin-autoprefixer';
import { WebApp } from 'meteor/webapp';
import { Meteor } from 'meteor/meteor';

import { settings, settingsRegistry } from '../../settings/server';
import { Logger } from '../../logger';
import { addStyle } from '../../ui-master/server/inject';
import { Settings } from '../../models/server';

const logger = new Logger('rocketchat:theme');

let currentHash = '';
let currentSize = 0;

export const theme = new (class {
	constructor() {
		this.variables = {};
		this.packageCallbacks = [];
		this.customCSS = '';
		settingsRegistry.add('css', '');
		settingsRegistry.addGroup('Layout');
		settings.change('css', () => {
			process.emit('message', {
				refresh: 'client',
			});
		});

		this.compileDelayed = _.debounce(Meteor.bindEnvironment(this.compile.bind(this)), 100);
		settings.watchByRegex(/^theme-./, (key, value) => {
			if (key === 'theme-custom-css' && value != null) {
				this.customCSS = value;
			} else {
				const name = key.replace(/^theme-[a-z]+-/, '');
				if (this.variables[name] != null) {
					this.variables[name].value = value;
				}
			}

			this.compileDelayed();
		});
	}

	compile() {
		let content = [];

		content.push(...this.packageCallbacks.map((name) => name()));

		content.push(this.customCSS);
		content = content.join('\n');
		const options = {
			compress: true,
			plugins: [new Autoprefixer()],
		};
		const start = Date.now();
		return less.render(content, options, function (err, data) {
			logger.info({ stop_rendering: Date.now() - start });
			if (err != null) {
				return logger.error(err);
			}
			Settings.updateValueById('css', data.css);

			return Meteor.startup(function () {
				return Meteor.setTimeout(function () {
					return process.emit('message', {
						refresh: 'client',
					});
				}, 200);
			});
		});
	}

	addColor(name, value, section, properties) {
		const config = {
			group: 'Colors',
			type: 'color',
			editor: 'color',
			public: true,
			properties,
			section,
		};

		return settingsRegistry.add(`theme-color-${name}`, value, config);
	}

	addVariable(type, name, value, section, persist = true, editor, allowedTypes, property) {
		this.variables[name] = {
			type,
			value,
			editor,
		};
		if (persist) {
			const config = {
				group: 'Layout',
				type,
				editor: editor || type,
				section,
				public: true,
				allowedTypes,
				property,
			};
			return settingsRegistry.add(`theme-${type}-${name}`, value, config);
		}
	}

	getVariablesAsObject() {
		return Object.keys(this.variables).reduce((obj, name) => {
			obj[name] = this.variables[name].value;
			return obj;
		}, {});
	}

	addPackageAsset(cb) {
		this.packageCallbacks.push(cb);
		return this.compileDelayed();
	}

	getCss() {
		return settings.get('css') || '';
	}
})();

Meteor.startup(() => {
	settings.watch('css', (value = '') => {
		currentHash = crypto.createHash('sha1').update(value).digest('hex');
		currentSize = value.length;
		addStyle('css-theme', value);
	});
});

WebApp.rawConnectHandlers.use(function (req, res, next) {
	const path = req.url.split('?')[0];
	const prefix = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX || '';
	if (path !== `${prefix}/theme.css`) {
		return next();
	}

	res.setHeader('Content-Type', 'text/css; charset=UTF-8');
	res.setHeader('Content-Length', currentSize);
	res.setHeader('ETag', `"${currentHash}"`);
	res.write(theme.getCss());
	res.end();
});
