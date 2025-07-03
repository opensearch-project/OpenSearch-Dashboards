/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppDispatch, RootState } from '../../../store';
import { clearResults, setQueryStringWithHistory } from '../../../slices';
import { executeQueries } from '../../query_actions';
import { ExploreServices } from '../../../../../../types';

/**
 * This is called when you want to
 * @param services
 */
export const runQueryActionCreator = (services: ExploreServices) => (
  dispatch: AppDispatch,
  getState: () => RootState
) => {
  const {
    queryEditor: { bottomEditorRef, topEditorRef },
  } = getState();

  // use bottomQuery first over topQuery
  const query = bottomEditorRef.current?.getValue() || topEditorRef.current?.getValue() || '';
  dispatch(setQueryStringWithHistory(query));
  dispatch(clearResults());
  dispatch(executeQueries({ services }));
};
