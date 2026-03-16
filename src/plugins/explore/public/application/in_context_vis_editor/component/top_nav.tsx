/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AppMountParameters } from 'opensearch-dashboards/public';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { TopNavMenuItemRenderType } from '../../../../../navigation/public';
import { QueryExecutionButton } from './query_execution_button';
import { Query, TimeRange } from '../../../../../data/common';
import {
  EditorMode,
  QueryExecutionStatus,
} from '../../../application/utils/state_management/types';
import { useEditorOperations } from '../hooks/use_editor_operations';
import { useQueryBuilderState } from '../hooks/use_query_builder_state';
import { ExploreServices } from '../../../types';
import { SavedExplore } from '../../../saved_explore';
import { abortAllActiveQueries } from '../query_builder/query_builder';

export interface TopNavProps {
  savedExplore?: SavedExplore;
  setHeaderActionMenu?: AppMountParameters['setHeaderActionMenu'];
}

export const TopNav = ({ setHeaderActionMenu = () => {}, savedExplore }: TopNavProps) => {
  const { services } = useOpenSearchDashboards<ExploreServices>();

  const { queryBuilder, datasetView, queryEditorState } = useQueryBuilderState();
  const { getEditorText } = useEditorOperations();

  const {
    navigation: {
      ui: { TopNavMenu },
    },
    data,
  } = services;

  const queryStatus = queryEditorState.queryStatus;
  const isQueryRunning = queryEditorState.queryStatus.status === QueryExecutionStatus.LOADING;
  const dataset = datasetView.dataView;

  const shouldShowCancelButton =
    queryEditorState.userInitiatedQuery &&
    queryEditorState.queryStatus.status === QueryExecutionStatus.LOADING;

  const [screenTitle, setScreenTitle] = useState<string>('');

  useEffect(() => {
    setScreenTitle(savedExplore?.title ? `${savedExplore?.title}` : '');
  }, [savedExplore?.title]);

  const showDatePicker = useMemo(() => {
    return dataset?.isTimeBased() ?? false;
  }, [dataset]);

  // Custom onChange handler to track date range changes in query builder
  const handleQueryChange = useCallback(
    (queryAndDateRange: { dateRange: any; query?: Query }) => {
      if (queryAndDateRange.dateRange) {
        queryBuilder.updateQueryEditorState({ dateRange: queryAndDateRange.dateRange });
      }
    },
    [queryBuilder]
  );

  const handleQuerySubmit = useCallback(
    async (payload?: { dateRange?: TimeRange; query?: Query }) => {
      // Update date range if provided
      if (payload?.dateRange) {
        queryBuilder.updateQueryEditorState({ dateRange: payload.dateRange });
      }
      // update current query text
      if (queryEditorState.editorMode !== EditorMode.Prompt) {
        queryBuilder.updateQueryState({ query: getEditorText() });
      }

      await queryBuilder.onEditorRunActionCreator();
    },
    [queryBuilder, queryEditorState.editorMode, getEditorText]
  );

  const handleQueryCancel = useCallback(() => {
    // Abort all active queries
    abortAllActiveQueries();
    queryBuilder.clearResultState();

    // Reset query status to UNINITIALIZED to stop spinner immediately
    queryBuilder.updateQueryEditorState({
      queryStatus: {
        status: QueryExecutionStatus.UNINITIALIZED,
        startTime: undefined,
        elapsedMs: undefined,
        error: undefined,
      },
      userInitiatedQuery: false,
    });
  }, [queryBuilder]);

  const handleCustomButtonClick = useCallback(() => {
    handleQuerySubmit();
  }, [handleQuerySubmit]);

  const customSubmitButton = useMemo(() => {
    return <QueryExecutionButton onClick={handleCustomButtonClick} onCancel={handleQueryCancel} />;
  }, [handleCustomButtonClick, handleQueryCancel]);

  return (
    <TopNavMenu
      appName={'explore'}
      data={data}
      showSearchBar={TopNavMenuItemRenderType.IN_PLACE}
      showDatePicker={showDatePicker && TopNavMenuItemRenderType.IN_PORTAL}
      showSaveQuery={false}
      useDefaultBehaviors={false}
      setMenuMountPoint={setHeaderActionMenu}
      indexPatterns={dataset ? [dataset] : undefined}
      savedQueryId={undefined}
      onSavedQueryIdChange={() => {}}
      onQuerySubmit={handleQuerySubmit}
      onQueryChange={handleQueryChange}
      customSubmitButton={customSubmitButton}
      groupActions={true}
      screenTitle={screenTitle}
      queryStatus={queryStatus}
      showQueryBar={true}
      showQueryInput={false}
      showFilterBar={false}
      showCancelButton={shouldShowCancelButton}
      onQueryCancel={handleQueryCancel}
      isQueryRunning={isQueryRunning}
    />
  );
};
