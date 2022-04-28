import { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import VerticalBar from '../../../../components/VerticalBar';
import OTR from './OTR';

export default {
	title: 'Room/Contextual Bar/OTR',
	component: OTR,
	parameters: {
		layout: 'fullscreen',
		actions: { argTypesRegex: '^on.*' },
	},
	decorators: [(fn) => <VerticalBar height='100vh'>{fn()}</VerticalBar>],
} as ComponentMeta<typeof OTR>;

const Template: ComponentStory<typeof OTR> = (args) => <OTR {...args} />;

export const Default = Template.bind({});
Default.args = {
	isOnline: true,
};

export const Establishing = Template.bind({});
Establishing.args = {
	isOnline: true,
	isEstablishing: true,
};

export const Established = Template.bind({});
Established.args = {
	isOnline: true,
	isEstablished: true,
};

export const Unavailable = Template.bind({});
Unavailable.args = {
	isOnline: false,
};
