/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { useObservable } from 'react-use';
import { getQueryBuilder } from '../query_builder/query_builder';

export const useQueryBuilderState = () => {
  const queryBuilder = getQueryBuilder();
  const queryState = useObservable(queryBuilder.queryState$, queryBuilder.queryState$.getValue());

  const queryEditorState = useObservable(
    queryBuilder.queryEditorState$,
    queryBuilder.queryEditorState$.getValue()
  );

  const resultState = useObservable(
    queryBuilder.resultState$,
    queryBuilder.resultState$.getValue()
  );

  const datasetView = useObservable(
    queryBuilder.datasetView$,
    queryBuilder.datasetView$.getValue()
  );

  return useMemo(
    () => ({
      queryState,
      queryEditorState,
      resultState,
      datasetView,
      queryBuilder,
    }),
    [queryState, queryEditorState, resultState, datasetView, queryBuilder]
  );
};
