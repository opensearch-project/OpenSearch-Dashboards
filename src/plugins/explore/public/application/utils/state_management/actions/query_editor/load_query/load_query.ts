/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppDispatch, RootState } from '../../../store';
import { runQueryActionCreator } from '../run_query';
import { ExploreServices } from '../../../../../../types';
import { useSetEditorTextWithQuery } from '../../../../../hooks';
import { clearLastExecutedData } from '../../../slices';
import { QueryResultStatus } from '../../../types';

/**
 * This is called when you need to load a query, it runs the loaded query.
 * Returns the overallQueryStatus after execution so callers can inspect
 * success/failure directly via `await dispatch(loadQueryActionCreator(...))`.
 * Query errors are stored in Redux state by createAsyncThunk and never thrown,
 * so the returned promise always resolves for query-level errors.
 */
export const loadQueryActionCreator = (
  services: ExploreServices,
  setEditorTextWithQuery: ReturnType<typeof useSetEditorTextWithQuery>,
  query: string
) => async (dispatch: AppDispatch, getState: () => RootState): Promise<QueryResultStatus> => {
  dispatch(clearLastExecutedData());
  setEditorTextWithQuery(query);
  await ((dispatch(runQueryActionCreator(services, query)) as unknown) as Promise<void>);
  return getState().queryEditor.overallQueryStatus;
};
