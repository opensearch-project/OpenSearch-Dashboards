/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ComponentType, useCallback, useMemo } from 'react';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../types';
import {
  getSourceTypeRegistry,
  SourceTypeQueryEditorProps,
} from '../../../services/source_type_registry';
import { QueryExecutionStatus } from '../../utils/state_management/types';
import { SourceQueryEditor } from '../../pages/metrics/query_panel';
import { useQueryBuilderState } from '../hooks/use_query_builder_state';

/**
 * The in-context visualization editor's counterpart of the Metrics page's source editor: a
 * registered source's own editor for its language (`metricsQueryEditor`), driven by the
 * visualization's query builder instead of Redux.
 */
export const SourceQueryPanelEditor: React.FC<{
  editor: ComponentType<SourceTypeQueryEditorProps>;
}> = ({ editor }) => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { queryState, queryEditorState, queryBuilder } = useQueryBuilderState();
  const { language, dataset } = queryState;

  const languageTitle = useMemo(
    () => getSourceTypeRegistry().getLanguageLabel(language, dataset),
    [language, dataset]
  );

  const onQueryChange = useCallback(
    (query: string) => {
      queryBuilder.updateQueryState({ query });
      queryBuilder.updateQueryEditorState({ isQueryEditorDirty: true });
    },
    [queryBuilder]
  );

  const onRun = useCallback(
    (query?: string) => {
      if (query !== undefined) queryBuilder.updateQueryState({ query });
      queryBuilder.onQueryExecutionSubmit().catch((error) => {
        services.notifications?.toasts.addError(error, {
          title: 'Query execution failed',
          toastLifeTimeMs: 2000,
        });
      });
    },
    [queryBuilder, services.notifications]
  );

  const onQueryOptionsChange = useCallback(
    (options: Record<string, unknown>) => queryBuilder.updateQueryOptions(options),
    [queryBuilder]
  );

  const { queryStatus } = queryEditorState;
  const status = useMemo(
    () => ({
      isRunning: queryStatus.status === QueryExecutionStatus.LOADING,
      error:
        queryStatus.status === QueryExecutionStatus.ERROR
          ? queryStatus.error?.message?.details ||
            queryStatus.error?.message?.reason ||
            queryStatus.error?.error
          : undefined,
    }),
    [queryStatus]
  );

  return (
    <SourceQueryEditor
      editor={editor}
      reduxQuery={String(queryState.query ?? '')}
      isDirty={queryEditorState.isQueryEditorDirty}
      onQueryChange={onQueryChange}
      onRun={onRun}
      languageId={language}
      languageTitle={languageTitle}
      dataset={dataset}
      data={services.data}
      queryOptions={queryState.queryOptions as Record<string, unknown> | undefined}
      onQueryOptionsChange={onQueryOptionsChange}
      status={status}
    />
  );
};
