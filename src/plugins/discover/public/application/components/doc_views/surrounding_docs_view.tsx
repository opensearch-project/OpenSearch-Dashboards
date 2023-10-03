/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Fragment, useEffect, useRef, useCallback, useMemo } from 'react';
import { EuiPageContent, EuiPage } from '@elastic/eui';
import { cloneDeep } from 'lodash';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { DiscoverServices } from '../../../build_services';
import { IndexPatternField, opensearchFilters } from '../../../../../data/public';
import { AppState, isEqualFilters } from './context/utils/context_state';
import { useContextState } from './context/utils/use_context_state';
import { useQueryActions } from './context/utils/use_query_actions';
import { ContextApp } from './context_app';
import { LOADING_STATUS } from './context/utils/context_query_state';
import { IndexPattern } from '../../../opensearch_dashboards_services';
import { SurrDocType } from './context/api/context';
import { DocViewFilterFn } from '../../doc_views/doc_views_types';

export interface SurroundingDocsViewParams {
  id: string;
  indexPattern: IndexPattern;
}

export const SurroundingDocsView = ({ id, indexPattern }: SurroundingDocsViewParams) => {
  const { services } = useOpenSearchDashboards<DiscoverServices>();
  const {
    navigation: {
      ui: { TopNavMenu },
    },
    data: {
      query: { filterManager },
    },
  } = services;

  const { contextAppState, setContextAppState } = useContextState({ services, indexPattern });
  const currentAppState = useRef<AppState>();

  const {
    contextQueryState,
    fetchContextRows,
    fetchAllRows,
    fetchSurroundingRows,
    resetContextQueryState,
  } = useQueryActions(id, indexPattern);

  // derive loading state
  const isLoading = [
    contextQueryState.anchorStatus.value,
    contextQueryState.predecessorsStatus.value,
    contextQueryState.successorsStatus.value,
  ].some((status) => status === LOADING_STATUS.LOADING || status === LOADING_STATUS.UNINITIALIZED);

  // derive rows
  const rows = useMemo(
    () => [
      ...(contextQueryState.predecessors || []),
      ...(contextQueryState.anchor ? [contextQueryState.anchor] : []),
      ...(contextQueryState.successors || []),
    ],
    [contextQueryState.predecessors, contextQueryState.anchor, contextQueryState.successors]
  );

  // data fetch logic
  useEffect(() => {
    if (currentAppState.current) {
      currentAppState.current = undefined;
      resetContextQueryState();
    }
  }, [id, resetContextQueryState]);

  useEffect(() => {
    const { predecessorCount, successorCount, filters } = contextAppState;
    if (!currentAppState.current) {
      fetchAllRows(predecessorCount, successorCount, filters);
    } else if (currentAppState.current.predecessorCount !== predecessorCount) {
      fetchSurroundingRows(SurrDocType.PREDECESSORS, predecessorCount, filters);
    } else if (currentAppState.current.successorCount !== successorCount) {
      fetchSurroundingRows(SurrDocType.SUCCESSORS, successorCount, filters);
    } else if (!isEqualFilters(currentAppState.current.filters, filters)) {
      fetchContextRows(contextAppState.predecessorCount, successorCount, filters);
    }

    currentAppState.current = cloneDeep(contextAppState);
  }, [contextAppState, id, fetchContextRows, fetchAllRows, fetchSurroundingRows]);

  // add filter logic
  const onAddFilter = useCallback(
    (field: IndexPatternField, values: string, operation: '+' | '-') => {
      const newFilters = opensearchFilters.generateFilters(
        filterManager,
        field,
        values,
        operation,
        indexPattern.id || ''
      );
      return filterManager.addFilters(newFilters);
    },
    [filterManager, indexPattern]
  );

  // memoize context app
  const contextAppMemoized = useMemo(
    () => (
      <ContextApp
        onAddFilter={onAddFilter as DocViewFilterFn}
        rows={rows}
        indexPattern={indexPattern}
        setAppState={setContextAppState}
        contextQueryState={contextQueryState}
        appState={contextAppState}
      />
    ),
    [onAddFilter, rows, indexPattern, setContextAppState, contextQueryState, contextAppState]
  );

  if (isLoading) {
    return null;
  }

  return (
    <Fragment>
      <TopNavMenu
        appName={'discover.context.surroundingDocs.topNavMenu'}
        showSearchBar={true}
        showQueryBar={false}
        showDatePicker={false}
        indexPatterns={[indexPattern]}
        useDefaultBehaviors={true}
      />
      <EuiPage className="discover.context.appPage">
        <EuiPageContent paddingSize="s" className="dscDocsContent">
          {contextAppMemoized}
        </EuiPageContent>
      </EuiPage>
    </Fragment>
  );
};
