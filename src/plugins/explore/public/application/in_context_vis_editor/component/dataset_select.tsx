/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useMemo, useRef } from 'react';
import { uniq } from 'lodash';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { CORE_SIGNAL_TYPES, Dataset, DEFAULT_DATA, EMPTY_QUERY } from '../../../../../data/common';
import { ExploreServices } from '../../../types';
import { EXPLORE_DEFAULT_LANGUAGE, ExploreFlavor } from '../../../../common';
import {
  getSourceTypeRegistry,
  OPENSEARCH_SOURCE_TYPE_ID,
} from '../../../services/source_type_registry';

import { useQueryBuilderState } from '../hooks/use_query_builder_state';
import { useEditorOperations } from '../hooks/use_editor_operations';

import { resolveDatasetLanguage, getInitialQueryString } from '../query_builder/utils';
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
const PROMETHEUS_DATASET_TYPE = 'PROMETHEUS';

export const DatasetSelectWidget = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { queryBuilder, queryState, container } = useQueryBuilderState();
  const { clearEditor, setEditorText, resetEditorMode } = useEditorOperations();

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
            queryOptions: undefined,
          });
          container.markStale();

          clearEditor();
          return;
        }

        const currentQuery = queryState.query ?? '';
        const currentLanguage = queryState.language;
        const previousTitle = queryState.dataset?.title;
        // The current language if the dataset can run it, else the dataset's own.
        const language =
          resolveDatasetLanguage(services, dataset, currentLanguage) ?? EXPLORE_DEFAULT_LANGUAGE;

        // A dataset that runs the current language keeps the query (and the editor its text), so the
        // chart keeps its columns. A query that names the previous dataset (PPL source / SQL FROM) is
        // for that dataset only: it starts from the new dataset's initial query.
        const runsCurrentLanguage = !!currentLanguage && language === currentLanguage;
        const namesPreviousDataset =
          namesItsDataset(currentQuery, currentLanguage) ||
          (!!previousTitle && currentQuery.includes(previousTitle));
        const hasQueryToKeep = !!currentQuery.trim();
        if (hasQueryToKeep && runsCurrentLanguage && !namesPreviousDataset) {
          queryBuilder.updateQueryState({ dataset });
          container.markStale();
          return;
        }

        const query = getInitialQueryString(queryString, dataset, language);

        queryBuilder.updateQueryState({
          language,
          dataset,
          query,
          queryOptions: undefined,
        });
        container.markStale();

        setEditorText(query);
        // reset to query mode
        resetEditorMode();
      } catch (error) {
        services.notifications?.toasts.addError(error, {
          title: 'Error selecting dataset',
        });
      }
    },
    [
      queryString,
      clearEditor,
      setEditorText,
      resetEditorMode,
      queryBuilder,
      container,
      services,
      queryState,
    ]
  );

  // The active dataset's source type decides the picker, as in Explore's main query panel: its own
  // datasetSelector if it has one, else the generic picker limited to its dataset types.
  const activeDataset = queryState.dataset;
  const activeSourceType = getSourceTypeRegistry().getForDataset(activeDataset);
  const isRegisteredSource = activeSourceType.id !== OPENSEARCH_SOURCE_TYPE_ID;

  const supportedTypes = useMemo(() => {
    if (isRegisteredSource) return activeSourceType.datasetTypes;

    const datasetService = queryString.getDatasetService();

    const metricsTypes = [
      // built-in Prometheus type from OpenSearch source
      ...(datasetService.getType(PROMETHEUS_DATASET_TYPE) ? [PROMETHEUS_DATASET_TYPE] : []),
    ];

    return uniq([
      ...(services.supportedTypes || [
        DEFAULT_DATA.SET_TYPES.INDEX,
        DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
      ]),
      ...metricsTypes,
    ]);
  }, [queryString, services.supportedTypes, isRegisteredSource, activeSourceType]);

  const signalTypes = useMemo(
    () => [CORE_SIGNAL_TYPES.LOGS, CORE_SIGNAL_TYPES.TRACES, CORE_SIGNAL_TYPES.METRICS],
    []
  );

  // Its choice goes through handleDatasetSelect, so the language, initial query and stale mark apply.
  const { datasetSelector: SourceDatasetSelector } = activeSourceType;
  if (SourceDatasetSelector) {
    return (
      <div ref={containerRef} className="exploreDatasetSelectWrapper">
        <SourceDatasetSelector
          dataset={activeDataset}
          onSelect={handleDatasetSelect}
          data={services.data}
          flavor={
            getSourceTypeRegistry().isMetricsLanguage(queryState.language)
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
        controlledSelectedDataset={queryState.dataset}
        isControlled={true}
        // A row without a dataset stays empty until the user picks one; a fresh editor's first
        // row already gets the default dataset from loadContainerState.
        autoSelectDefault={false}
      />
    </div>
  );
};
