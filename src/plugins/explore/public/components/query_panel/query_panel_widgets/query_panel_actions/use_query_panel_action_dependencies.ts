/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useContext, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { QueryPanelActionDependencies } from '../../../../services/query_panel_actions_registry';
import {
  selectQuery,
  selectOverallQueryStatus,
} from '../../../../application/utils/state_management/selectors';
import { getQueryWithSource } from '../../../../application/utils/languages';
import { EditorContext } from '../../../../application/context/editor_context';
import { useDatasetContext } from '../../../../application/context/dataset_context';
import { RootState } from '../../../../application/utils/state_management/store';

/**
 * Hook to gather all dependencies for query panel actions
 * Provides rich context including queries, results, dataset, and selections
 *
 * @returns Complete QueryPanelActionDependencies object
 */
export const useQueryPanelActionDependencies = (): QueryPanelActionDependencies => {
  // Get editor ref from context
  const editorRef = useContext(EditorContext);

  // Get dataset from context
  const { dataset } = useDatasetContext();

  // Get query state from Redux
  const executedQueryState = useSelector(selectQuery);
  const resultStatus = useSelector(selectOverallQueryStatus);

  // Get time range from data plugin's timefilter (global time range)
  // Note: timeRange is not stored in Redux query state, it's managed globally
  // Actions can access it via services.data.query.timefilter.getTime() if needed
  const timeRange = undefined; // Not in Redux state

  // Get selected records from Redux (if available)
  // Note: Selection state would need to be added to Redux store
  // This is a placeholder - actual implementation depends on store structure
  const selectedRecords = useSelector((state: RootState) => {
    // Check if there's a selection state in the store
    // This is a placeholder - implementation TBD
    return (state as any).results?.selectedRecords || [];
  });

  // Get current editor query (may differ from executed query)
  const editorQuery = useMemo(() => {
    if (editorRef?.current) {
      try {
        return editorRef.current.getValue() || '';
      } catch (error) {
        // If editor is not ready or accessible, fallback to executed query
        return executedQueryState.query || '';
      }
    }
    // Fallback to executed query if no editor ref
    return executedQueryState.query || '';
  }, [editorRef, executedQueryState.query]);

  // Determine dataset type from dataset
  const datasetType = useMemo(() => {
    if (!dataset) return undefined;
    return dataset.signalType;
  }, [dataset]);

  return useMemo<QueryPanelActionDependencies>(
    () => ({
      // Query context
      executedQuery: getQueryWithSource(executedQueryState),
      editorQuery,
      language: executedQueryState.language || 'PPL',

      // Result context
      resultStatus,
      // Note: results removed as they're accessible via services if needed

      // Dataset context
      dataset: dataset as any, // Cast to any to match QueryPanelActionDependencies type
      datasetType,

      // Selection context
      selectedRecords,

      // Metadata
      timeRange, // Currently undefined, can be accessed via services.data.query.timefilter
    }),
    [
      executedQueryState,
      editorQuery,
      resultStatus,
      dataset,
      datasetType,
      selectedRecords,
      timeRange,
    ]
  );
};
