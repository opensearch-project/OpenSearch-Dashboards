/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { useSavedExplore } from '../../../application/utils/hooks/use_saved_explore';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { Dataset } from '../../../../../data/common';
import { ExploreServices } from '../../../types';

import { EditorMode } from '../../../application/utils/state_management/types';
import { getVisualizationBuilder } from '../../../components/visualizations/visualization_builder';

import { useInContextEditor } from '../../context';
import { resolveDatasetByLanguage, getPreloadedQueryState } from '../query_builder/utils';
import { useEditorOperations } from '../hooks/use_editor_operations';
import { useQueryBuilderState } from './use_query_builder_state';
import { QueryEditorState, SupportLanguageType, QueryState } from '../query_builder/query_builder';

export const useInitialSaveExplore = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const exploreId = useInContextEditor().exploreId;
  const { savedExplore, error } = useSavedExplore(exploreId);
  const { setEditorText } = useEditorOperations();

  const visualizationBuilder = getVisualizationBuilder();
  const { queryBuilder, queryEditorState } = useQueryBuilderState();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      // Load language type from URL
      const queryEditorStateFromUrl = services.osdUrlStateStorage?.get(
        '_e'
      ) as QueryEditorState | null;

      const languageType = queryEditorStateFromUrl?.languageType ?? SupportLanguageType.ppl;

      // Load from saved explore
      let baseQueryState;
      if (savedExplore && !error) {
        baseQueryState = await getPreloadedQueryState(services, languageType);

        if (savedExplore.id) {
          // Get query from saved search source
          const searchSourceFields = savedExplore.kibanaSavedObjectMeta;
          if (searchSourceFields?.searchSourceJSON) {
            const searchSource = JSON.parse(searchSourceFields.searchSourceJSON);
            const savedQuery = searchSource.query;

            baseQueryState = {
              ...baseQueryState,
              ...savedQuery,
            };
          }

          // Load visualization config
          const visualization = savedExplore.visualization;
          if (visualization) {
            const { chartType, params, axesMapping } = JSON.parse(visualization);
            visualizationBuilder.setVisConfig({ type: chartType, styles: params, axesMapping });
          }
        }

        //  Check URL query state and override if present
        const queryStateFromUrl = services.osdUrlStateStorage?.get('_eq') as QueryState | null;

        if (queryStateFromUrl) {
          // Extract and validate URL dataset
          let urlDataset: Dataset | undefined;
          if (queryStateFromUrl.dataset) {
            urlDataset = {
              id: queryStateFromUrl.dataset.id,
              title: queryStateFromUrl.dataset.title,
              type: queryStateFromUrl.dataset.type,
              language: queryStateFromUrl.dataset.language,
              timeFieldName: queryStateFromUrl.dataset.timeFieldName,
              dataSource: queryStateFromUrl.dataset.dataSource,
              signalType: queryStateFromUrl.dataset.signalType,
            };
          }

          const resolvedDataset = await resolveDatasetByLanguage(
            services,
            languageType,
            urlDataset
          );

          // Check if dataset changed (incompatible with language type)
          const datasetChanged =
            !urlDataset ||
            urlDataset.id !== resolvedDataset?.id ||
            urlDataset.type !== resolvedDataset?.type;

          // Use the resolved dataset but preserve other query state from URL if available
          // When the dataset changes (due to signal type filtering), also update the language
          baseQueryState = {
            ...baseQueryState,
            dataset: resolvedDataset,
            language: datasetChanged ? resolvedDataset?.language : queryStateFromUrl?.language,
            query: datasetChanged ? '' : queryStateFromUrl?.query,
          };
        }
      }

      if (baseQueryState) {
        queryBuilder.updateQueryState(baseQueryState);
        if (queryEditorStateFromUrl) {
          queryBuilder.updateQueryEditorState(queryEditorStateFromUrl);
        }
        queryBuilder.init();
        visualizationBuilder.init();
        queryBuilder.clearResultState();
        queryBuilder.updateQueryEditorState({ editorMode: EditorMode.Query });
        setEditorText(baseQueryState.query.query);
        await queryBuilder.waitForDatasetReady();
        if (savedExplore?.id) {
          // for existing saved explore, should execute query on page load
          // for in-context editor, here isn't tabs, user need to implict input query
          await queryBuilder.executeQuery();
        }
        setIsInitialized(true);
      }
    };
    initialize();
    return () => {
      queryBuilder.reset();
      visualizationBuilder.reset();
    };
  }, [
    savedExplore,
    error,
    services,
    queryBuilder,
    setEditorText,
    queryEditorState.languageType,
    visualizationBuilder,
  ]);

  return {
    savedExplore,
    isInitialized,
  };
};
