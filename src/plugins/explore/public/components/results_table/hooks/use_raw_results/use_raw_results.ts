/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectQuery } from '../../../../application/utils/state_management/selectors';
import { defaultPrepareQueryString } from '../../../../application/utils/state_management/actions/query_actions';
import { RootState } from '../../../../application/utils/state_management/store';

export const useRawResults = () => {
  const query = useSelector(selectQuery);
  const cacheKey = useMemo(() => defaultPrepareQueryString(query), [query]);
  const resultsState = useSelector((state: RootState) => state.results);
  return resultsState[cacheKey];
};
