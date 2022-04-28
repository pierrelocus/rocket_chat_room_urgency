import React, { FC } from 'react';

import { useRouteParameter } from '../../../contexts/RouterContext';
import CallsContextualBarDirectory from './CallsContextualBarDirectory';
import ChatsContextualBar from './ChatsContextualBar';
import ContactContextualBar from './ContactContextualBar';

type ContextualBarProps = {
	contactReload?: () => void;
	chatReload?: () => void;
};

const ContextualBar: FC<ContextualBarProps> = ({ contactReload, chatReload }) => {
	const page = useRouteParameter('page');
	const bar = useRouteParameter('bar');

	if (!bar) {
		return null;
	}

	switch (page) {
		case 'contacts':
			return <ContactContextualBar contactReload={contactReload} />;
		case 'chats':
			return <ChatsContextualBar chatReload={chatReload} />;
		case 'calls':
			return <CallsContextualBarDirectory />;
		default:
			return null;
	}
};

export default ContextualBar;
