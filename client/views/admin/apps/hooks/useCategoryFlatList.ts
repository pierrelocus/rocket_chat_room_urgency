import { useMemo } from 'react';

import { CategoryDropdownItem, CategoryDropDownListProps } from '../definitions/CategoryDropdownDefinitions';

export const useCategoryFlatList = (data: CategoryDropDownListProps['groups']): CategoryDropdownItem[] =>
	useMemo(() => data.flatMap((group) => group.items).filter(({ id }) => id !== 'all'), [data]);
