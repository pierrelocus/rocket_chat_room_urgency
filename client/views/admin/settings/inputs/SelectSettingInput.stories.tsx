import { Field } from '@rocket.chat/fuselage';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import SelectSettingInput from './SelectSettingInput';

export default {
	title: 'Admin/Settings/Inputs/SelectSettingInput',
	component: SelectSettingInput,
	parameters: {
		actions: {
			argTypesRegex: '^on.*',
		},
	},
	decorators: [(fn) => <Field>{fn()}</Field>],
} as ComponentMeta<typeof SelectSettingInput>;

const Template: ComponentStory<typeof SelectSettingInput> = (args) => <SelectSettingInput {...args} />;

export const Default = Template.bind({});
Default.args = {
	_id: 'setting_id',
	label: 'Label',
	placeholder: 'Placeholder',
	values: [
		{ key: '1', i18nLabel: '1' },
		{ key: '2', i18nLabel: '2' },
		{ key: '3', i18nLabel: '3' },
	],
};

export const Disabled = Template.bind({});
Disabled.args = {
	_id: 'setting_id',
	label: 'Label',
	placeholder: 'Placeholder',
	values: [
		{ key: '1', i18nLabel: '1' },
		{ key: '2', i18nLabel: '2' },
		{ key: '3', i18nLabel: '3' },
	],
	disabled: true,
};

export const WithValue = Template.bind({});
WithValue.args = {
	_id: 'setting_id',
	label: 'Label',
	placeholder: 'Placeholder',
	value: '2',
	values: [
		{ key: '1', i18nLabel: '1' },
		{ key: '2', i18nLabel: '2' },
		{ key: '3', i18nLabel: '3' },
	],
};

export const WithResetButton = Template.bind({});
WithResetButton.args = {
	_id: 'setting_id',
	label: 'Label',
	placeholder: 'Placeholder',
	values: [
		{ key: '1', i18nLabel: '1' },
		{ key: '2', i18nLabel: '2' },
		{ key: '3', i18nLabel: '3' },
	],
	hasResetButton: true,
};
