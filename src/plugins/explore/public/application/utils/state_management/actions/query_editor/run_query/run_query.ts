/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppDispatch } from '../../../store';
import { clearResults, setQueryStringWithHistory } from '../../../slices';
import { executeQueries } from '../../query_actions';
import { ExploreServices } from '../../../../../../types';

/**
 * This is called when you want to run the query
 */
export const runQueryActionCreator = (services: ExploreServices, query?: string) => (
  dispatch: AppDispatch
) => {
  if (typeof query === 'string') {
    dispatch(setQueryStringWithHistory(query));
  }

  dispatch(clearResults());
  dispatch(executeQueries({ services }));
};
