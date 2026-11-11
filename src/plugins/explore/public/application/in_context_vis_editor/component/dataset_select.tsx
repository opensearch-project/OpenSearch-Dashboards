/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useMemo, useRef } from 'react';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { Dataset, DEFAULT_DATA, EMPTY_QUERY } from '../../../../../data/common';
import { ExploreServices } from '../../../types';
import { EXPLORE_DEFAULT_LANGUAGE, ExploreFlavor } from '../../../../common';
import {
  getSourceTypeRegistry,
  OPENSEARCH_SOURCE_TYPE_ID,
} from '../../../services/source_type_registry';

import { useQueryBuilderState } from '../hooks/use_query_builder_state';
import { useEditorOperations } from '../hooks/use_editor_operations';
import { SupportLanguageType } from '../query_builder/query_builder';
import { getRequiredSignalType } from '../query_builder/utils';
import '../visualization_editor.scss';

export const DatasetSelectWidget = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();

  const { queryEditorState, queryBuilder, queryState } = useQueryBuilderState();

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

  // The active dataset's source type decides the picker, as in Explore's main query panel: its own
  // datasetSelector if it has one, else the generic picker limited to its dataset types.
  const activeDataset = queryState?.dataset;
  const activeSourceType = getSourceTypeRegistry().getForDataset(activeDataset);
  const isRegisteredSource = activeSourceType.id !== OPENSEARCH_SOURCE_TYPE_ID;

  const supportedTypes = useMemo(() => {
    if (isRegisteredSource) return activeSourceType.datasetTypes;

    if (queryEditorState.languageType === SupportLanguageType.promQL) return ['PROMETHEUS'];

    return (
      services.supportedTypes || [
        DEFAULT_DATA.SET_TYPES.INDEX,
        DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
      ]
    );
  }, [
    services.supportedTypes,
    queryEditorState.languageType,
    isRegisteredSource,
    activeSourceType,
  ]);

  const signalTypes = useMemo(
    () => getRequiredSignalType(queryEditorState.languageType),
    [queryEditorState.languageType]
  );

  // Its choice still goes through handleDatasetSelect, so the initial query applies.
  const { datasetSelector: SourceDatasetSelector } = activeSourceType;
  if (SourceDatasetSelector) {
    return (
      <div ref={containerRef} className="exploreDatasetSelectWrapper">
        <SourceDatasetSelector
          dataset={activeDataset}
          onSelect={handleDatasetSelect}
          data={services.data}
          flavor={
            getSourceTypeRegistry().isMetricsLanguage(queryEditorState.languageType)
              ? ExploreFlavor.Metrics
              : null
          }
        />
      </div>
    );
  }

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
