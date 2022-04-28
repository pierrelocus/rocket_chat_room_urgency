import { Select } from '@rocket.chat/fuselage';
import React, { ReactElement, useMemo, useState } from 'react';

import { useTranslation } from '../../../../../../client/contexts/TranslationContext';
import Section from '../Section';
import ContentForDays from './ContentForDays';
import ContentForHours from './ContentForHours';

type TimeUnit = 'hours' | 'days';

type BusiestChatTimesSectionProps = {
	timezone: 'utc' | 'local';
};

const BusiestChatTimesSection = ({ timezone }: BusiestChatTimesSectionProps): ReactElement => {
	const t = useTranslation();

	const [timeUnit, setTimeUnit] = useState<TimeUnit>('hours');
	const timeUnitOptions = useMemo<[timeUnit: TimeUnit, label: string][]>(
		() => [
			['hours', t('Hours')],
			['days', t('Days')],
		],
		[t],
	);

	const [displacement, setDisplacement] = useState(0);

	const handleTimeUnitChange = (timeUnit: string): void => {
		setTimeUnit(timeUnit as TimeUnit);
		setDisplacement(0);
	};

	const handlePreviousDateClick = (): void => setDisplacement((displacement) => displacement + 1);
	const handleNextDateClick = (): void => setDisplacement((displacement) => displacement - 1);

	const Content = (
		{
			hours: ContentForHours,
			days: ContentForDays,
		} as const
	)[timeUnit];

	return (
		<Section
			title={t('When_is_the_chat_busier?')}
			filter={<Select options={timeUnitOptions} value={timeUnit} onChange={handleTimeUnitChange} />}
		>
			<Content
				displacement={displacement}
				onPreviousDateClick={handlePreviousDateClick}
				onNextDateClick={handleNextDateClick}
				timezone={timezone}
			/>
		</Section>
	);
};

export default BusiestChatTimesSection;
