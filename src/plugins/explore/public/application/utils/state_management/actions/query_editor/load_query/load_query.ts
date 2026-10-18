/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppDispatch } from '../../../store';
import { runQueryActionCreator } from '../run_query';
import { ExploreServices } from '../../../../../../types';
import { useSetEditorTextWithQuery } from '../../../../../hooks';
import { clearLastExecutedData } from '../../../slices';
import type { RootState } from '../../../store';
import { datasetRequiresExplicitRun } from '../../../../requires_explicit_run';

/**
 * This is called when you need to load a query, it runs the loaded query. A dataset type that
 * requires an explicit Run (meta.requiresExplicitRun) only gets the query in the editor.
 */
export const loadQueryActionCreator =
  (
    services: ExploreServices,
    setEditorTextWithQuery: ReturnType<typeof useSetEditorTextWithQuery>,
    query: string
  ) =>
  async (dispatch: AppDispatch, getState?: () => RootState) => {
    dispatch(clearLastExecutedData());
    setEditorTextWithQuery(query);
    const queryString = services.data?.query?.queryString;
    const dataset = getState?.()?.query?.dataset ?? queryString?.getQuery?.()?.dataset;
    if (datasetRequiresExplicitRun(queryString, dataset)) return;
    await (dispatch(runQueryActionCreator(services, query)) as unknown as Promise<void>);
  };
