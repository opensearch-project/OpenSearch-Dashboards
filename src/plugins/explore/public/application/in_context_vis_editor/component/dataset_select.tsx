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

/**
 * Whether the query names the dataset it runs on, whatever that dataset's title: a PPL source clause
 * before the first pipe, or a SQL FROM. Such a query keeps running on what it names, so it can't
 * move to another dataset (`source = logs-2026.01 | …` names its index even on `logs-*`).
 */
const namesItsDataset = (query: string, language: string | undefined): boolean =>
  language === 'PPL'
    ? /^[^|]*\bsource\s*=/i.test(query)
    : language === 'SQL'
      ? /\bfrom\b/i.test(query)
      : false;

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

  // The languages the dataset's type can run, or undefined when its type isn't known.
  const getTypeLanguages = useCallback(
    (dataset: Dataset): string[] | undefined => {
      try {
        return queryString
          .getDatasetService?.()
          ?.getType(dataset.type)
          ?.supportedLanguages(dataset);
      } catch {
        return undefined;
      }
    },
    [queryString]
  );

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

        // A dataset that runs the current language (e.g. other log groups of the same source) keeps
        // the query, so the chart keeps the columns it is built on, and the editor keeps its text.
        // A query that names the previous dataset (a PPL source or SQL FROM) is for that dataset
        // only, and another language can't run it: those start from an empty query.
        const currentQuery = queryState?.query ?? '';
        const currentLanguage = queryState?.language;
        const previousTitle = queryState?.dataset?.title;
        const typeLanguages = getTypeLanguages(dataset);
        const runsCurrentLanguage =
          !!currentLanguage &&
          (typeLanguages
            ? typeLanguages.includes(currentLanguage)
            : initialQuery.language === currentLanguage);
        const namesPreviousDataset =
          namesItsDataset(currentQuery, currentLanguage) ||
          (!!previousTitle && currentQuery.includes(previousTitle));
        if (runsCurrentLanguage && !namesPreviousDataset) {
          queryBuilder.updateQueryState({ dataset });
          queryBuilder.updateQueryEditorState({ isQueryEditorDirty: true });
          return;
        }

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
    [
      queryString,
      clearEditor,
      queryBuilder,
      queryState,
      getTypeLanguages,
      services.notifications?.toasts,
    ]
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
