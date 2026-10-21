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
import type { Dataset } from '../../../../../../../../data/common';

/**
 * This is called when you need to load a query, it runs the loaded query. A dataset type that
 * requires an explicit Run (meta.requiresExplicitRun) only gets the query in the editor.
 *
 * @param dataset the dataset of the query being loaded, when the caller knows it (a saved query).
 * The query runs against the current dataset, so it waits for the user when either that dataset or
 * the loaded query's own dataset requires an explicit Run.
 */
export const loadQueryActionCreator =
  (
    services: ExploreServices,
    setEditorTextWithQuery: ReturnType<typeof useSetEditorTextWithQuery>,
    query: string,
    dataset?: Pick<Dataset, 'type'>
  ) =>
  async (dispatch: AppDispatch, getState?: () => RootState) => {
    dispatch(clearLastExecutedData());
    setEditorTextWithQuery(query);
    const queryString = services.data?.query?.queryString;
    const currentDataset = getState?.()?.query?.dataset ?? queryString?.getQuery?.()?.dataset;
    if (
      datasetRequiresExplicitRun(queryString, currentDataset) ||
      datasetRequiresExplicitRun(queryString, dataset)
    ) {
      return;
    }
    await (dispatch(runQueryActionCreator(services, query)) as unknown as Promise<void>);
  };
