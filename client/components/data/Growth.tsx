import { Box } from '@rocket.chat/fuselage';
import React, { ComponentProps, ReactElement } from 'react';

import NegativeGrowthSymbol from './NegativeGrowthSymbol';
import PositiveGrowthSymbol from './PositiveGrowthSymbol';

type GrowthProps = ComponentProps<typeof Box> & {
	children: number;
};

const Growth = ({ children, ...props }: GrowthProps): ReactElement | null => {
	if (children === 0) {
		return null;
	}

	return (
		<Box is='span' color={children < 0 ? 'danger' : 'success'} {...props}>
			{children < 0 ? <NegativeGrowthSymbol /> : <PositiveGrowthSymbol />}
			{String(Math.abs(children))}
		</Box>
	);
};

export default Growth;
