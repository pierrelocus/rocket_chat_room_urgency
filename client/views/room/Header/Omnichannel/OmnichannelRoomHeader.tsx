import React, { FC, useMemo } from 'react';

import BurgerMenu from '../../../../components/BurgerMenu';
import TemplateHeader from '../../../../components/Header';
import { useLayout } from '../../../../contexts/LayoutContext';
import { useCurrentRoute } from '../../../../contexts/RouterContext';
import { useOmnichannelRoom } from '../../contexts/RoomContext';
import { ToolboxActionConfig } from '../../lib/Toolbox';
import { ToolboxContext, useToolboxContext } from '../../lib/Toolbox/ToolboxContext';
import RoomHeader from '../RoomHeader';
import { BackButton } from './BackButton';
import QuickActions from './QuickActions';
import { useQuickActions } from './QuickActions/hooks/useQuickActions';

type OmnichannelRoomHeaderProps = {
	slots: {
		start?: unknown;
		preContent?: unknown;
		insideContent?: unknown;
		posContent?: unknown;
		end?: unknown;
		toolbox?: {
			pre?: unknown;
			content?: unknown;
			pos?: unknown;
		};
	};
};

const OmnichannelRoomHeader: FC<OmnichannelRoomHeaderProps> = ({ slots: parentSlot }) => {
	const [name] = useCurrentRoute();
	const { isMobile } = useLayout();
	const room = useOmnichannelRoom();
	const { visibleActions, getAction } = useQuickActions(room);
	const context = useToolboxContext();

	const slots = useMemo(
		() => ({
			...parentSlot,
			start: (!!isMobile || name === 'omnichannel-directory' || name === 'omnichannel-current-chats') && (
				<TemplateHeader.ToolBox>
					{isMobile && <BurgerMenu />}
					{<BackButton routeName={name} />}
				</TemplateHeader.ToolBox>
			),
			...(!isMobile && { insideContent: <QuickActions room={room} /> }),
		}),
		[isMobile, name, parentSlot, room],
	);
	return (
		<ToolboxContext.Provider
			value={useMemo(
				() => ({
					...context,
					actions: new Map([
						...(isMobile
							? (visibleActions.map((action) => [
									action.id,
									{
										...action,
										action: (): unknown => getAction(action.id),
										order: (action.order || 0) - 10,
									},
							  ]) as [string, ToolboxActionConfig][])
							: []),
						...(Array.from(context.actions.entries()) as [string, ToolboxActionConfig][]),
					]),
				}),
				[context, isMobile, visibleActions, getAction],
			)}
		>
			<RoomHeader slots={slots} room={room} />
		</ToolboxContext.Provider>
	);
};

export default OmnichannelRoomHeader;
