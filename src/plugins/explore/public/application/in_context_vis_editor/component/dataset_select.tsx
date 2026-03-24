/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo, useRef } from 'react';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { Dataset, DEFAULT_DATA, EMPTY_QUERY } from '../../../../../data/common';
import { ExploreServices } from '../../../types';
import { EXPLORE_DEFAULT_LANGUAGE } from '../../../../common';

import { useQueryBuilderState } from '../hooks/use_query_builder_state';
import { useEditorOperations } from '../hooks/use_editor_operations';
import { SupportLanguageType } from '../query_builder/query_builder';
import { getRequiredSignalType } from '../query_builder/utils';
import '../in_context_editor.scss';

export const DatasetSelectWidget = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();

  const { queryEditorState, queryBuilder } = useQueryBuilderState();

  const { clearEditor } = useEditorOperations();

  const {
    data: {
      ui: { DatasetSelect },
      query: { queryString },
    },
  } = services;

  const containerRef = useRef<HTMLDivElement>(null);

  const handleDatasetSelect = useCallback(
    async (dataset: Dataset | undefined) => {
      try {
        if (!dataset) {
          // Clear dataset - reset to empty query state with explore default language
          queryBuilder.updateQueryState({
            query: EMPTY_QUERY.QUERY,
            language: EXPLORE_DEFAULT_LANGUAGE,
            dataset: undefined,
          });

          queryBuilder.updateQueryEditorState({ isQueryEditorDirty: true });

          clearEditor();
          return;
        }

        const initialQuery = queryString.getInitialQueryByDataset(dataset);
        queryBuilder.updateQueryState({
          ...initialQuery,
          query: EMPTY_QUERY.QUERY,
          dataset,
        });
        queryBuilder.updateQueryEditorState({ isQueryEditorDirty: true });

        clearEditor();
      } catch (error) {
        services.notifications?.toasts.addError(error, {
          title: 'Error selecting dataset',
        });
      }
    },
    [queryString, clearEditor, queryBuilder, services.notifications?.toasts]
  );

  const supportedTypes = useMemo(() => {
    if (queryEditorState.languageType === SupportLanguageType.promQL) return ['PROMETHEUS'];

    return (
      services.supportedTypes || [
        DEFAULT_DATA.SET_TYPES.INDEX,
        DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
      ]
    );
  }, [services.supportedTypes, queryEditorState.languageType]);

  const signalTypes = useMemo(() => getRequiredSignalType(queryEditorState.languageType), [
    queryEditorState.languageType,
  ]);

  return (
    <div ref={containerRef} className="exploreDatasetSelectWrapper">
      <DatasetSelect
        onSelect={handleDatasetSelect}
        appName="explore"
        supportedTypes={supportedTypes}
        signalType={signalTypes}
        showNonTimeFieldDatasets={false}
      />
    </div>
  );
};
