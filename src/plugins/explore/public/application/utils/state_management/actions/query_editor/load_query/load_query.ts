/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppDispatch } from '../../../store';
import { runQueryActionCreator } from '../run_query';
import { ExploreServices } from '../../../../../../types';
import { useSetEditorTextWithQuery } from '../../../../../hooks';
import { clearLastExecutedData } from '../../../slices';

/**
 * This is called when you need to load a query, it runs the loaded query
 */
export const loadQueryActionCreator = (
  services: ExploreServices,
  setEditorTextWithQuery: ReturnType<typeof useSetEditorTextWithQuery>,
  query: string
) => (dispatch: AppDispatch) => {
  dispatch(clearLastExecutedData());
  setEditorTextWithQuery(query);
  dispatch(runQueryActionCreator(services, query));
};
