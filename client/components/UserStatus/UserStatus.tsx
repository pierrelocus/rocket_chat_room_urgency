import { StatusBullet } from '@rocket.chat/fuselage';
import React, { memo, ComponentProps, ReactElement } from 'react';

import { useTranslation } from '../../contexts/TranslationContext';

export type UserStatusProps = {
	small?: boolean;
	statusText?: string;
} & ComponentProps<typeof StatusBullet>;

const UserStatus = ({ small, status, statusText, ...props }: UserStatusProps): ReactElement => {
	const size = small ? 'small' : 'large';
	const t = useTranslation();
	switch (status) {
		case 'online':
			return <StatusBullet size={size} status={status} title={statusText || t('Online')} {...props} />;
		case 'busy':
			return <StatusBullet size={size} status={status} title={statusText || t('Busy')} {...props} />;
		case 'away':
			return <StatusBullet size={size} status={status} title={statusText || t('Away')} {...props} />;
		case 'offline':
			return <StatusBullet size={size} status={status} title={statusText || t('Offline')} {...props} />;
		default:
			return <StatusBullet size={size} title={t('Loading')} {...props} />;
	}
};

export default memo(UserStatus);
