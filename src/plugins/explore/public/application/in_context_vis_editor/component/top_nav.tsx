/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppMountParameters } from 'opensearch-dashboards/public';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { TopNavMenuItemRenderType } from '../../../../../navigation/public';
import { QueryExecutionButton } from './query_execution_button';
import { Query, TimeRange } from '../../../../../data/common';
import { EditorMode } from '../../../application/utils/state_management/types';
import { useEditorOperations } from '../hooks/use_editor_operations';
import { useQueryBuilderState } from '../hooks/use_query_builder_state';
import { ExploreServices } from '../../../types';
import { SavedExplore } from '../../../saved_explore';
import { SupportLanguageType } from '../query_builder/query_builder';

export interface TopNavProps {
  savedExplore?: SavedExplore;
  setHeaderActionMenu?: AppMountParameters['setHeaderActionMenu'];
}

export const TopNav = ({ setHeaderActionMenu = () => {}, savedExplore }: TopNavProps) => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { queryBuilder, container, datasetView, queryEditorState, hasTimeBasedRow, queryState } =
    useQueryBuilderState();
  const { getEditorRef } = useEditorOperations();

  const {
    navigation: {
      ui: { TopNavMenu },
    },
    data,
  } = services;

  const queryStatus = queryEditorState.queryStatus;
  const dataset = datasetView.dataView;

  const [screenTitle, setScreenTitle] = useState<string>('');

  useEffect(() => {
    setScreenTitle(savedExplore?.id ? `Edit ${savedExplore?.title}` : 'Create');
  }, [savedExplore?.id, savedExplore?.title]);

  const showDatePicker = hasTimeBasedRow;

  // Custom onChange handler to track date range changes in query builder
  const handleQueryChange = useCallback(
    (options: { dateRange: { from: string; to: string }; query?: Query }) => {
      if (options.dateRange) {
        container.updateMultiQueryEditorState({ dateRange: options.dateRange });
      }
    },
    [container]
  );

  const handleQuerySubmit = useCallback(
    async (payload?: { dateRange?: TimeRange; query?: Query }) => {
      // Update date range if provided
      if (payload?.dateRange) {
        container.updateMultiQueryEditorState({ dateRange: payload.dateRange });
      }

      const editor = getEditorRef();

      // update current query text only if not in Prompt/builder mode and not using promQL
      if (
        queryEditorState.editorMode !== EditorMode.Prompt &&
        queryState.language !== SupportLanguageType.promQL &&
        editor
      ) {
        queryBuilder.updateQueryState({ query: editor.getValue() });
      }

      await container.executeAll();
    },
    [queryBuilder, container, queryEditorState.editorMode, getEditorRef, queryState.language]
  );

  const handleQueryCancel = useCallback(() => {
    container.cancelAll();
  }, [container]);

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
      groupedActionsBeforeDatePicker={true}
    />
  );
};
