/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { i18n } from '@osd/i18n';

import { useSelector } from 'react-redux';
import { CanvasPanel } from '../../../../../components/panel/canvas_panel';
import { useDatasetContext } from '../../../../context';
import { LoadingSpinner } from '../../../../legacy/discover/application/components/loading_spinner/loading_spinner';
import {
  defaultPrepareQueryString,
  shouldSkipQueryExecution,
} from '../../../../utils/state_management/actions/query_actions';
import { selectQueryStatusMapByKey } from '../../../../utils/state_management/selectors';
import { RootState } from '../../../../utils/state_management/store';
import { QueryExecutionStatus } from '../../../../utils/state_management/types';
import { ResizableVisControlAndTabs } from './resizable_vis_control_and_tabs';
import { MetricsEmptyState } from '../../explore/components/metrics_empty_state';
import { getServices } from '../../../../../services/services';
import { getSourceTypeRegistry } from '../../../../../services/source_type_registry';

export const BottomRightContainer = () => {
  const { dataset } = useDatasetContext();

  const query = useSelector((state: RootState) => state.query);
  const status = useSelector((state: RootState) => {
    return state.queryEditor.overallQueryStatus.status || QueryExecutionStatus.UNINITIALIZED;
  });
  const dataTableStatus = useSelector((state: RootState) => {
    return selectQueryStatusMapByKey(state, defaultPrepareQueryString(query))?.status;
  });

  if (dataset == null) {
    return (
      <CanvasPanel>
        <MetricsEmptyState
          iconType="database"
          title={i18n.translate('explore.metricsQuery.noDatasourceTitle', {
            defaultMessage: 'Select a Prometheus data source',
          })}
          body={i18n.translate('explore.metricsQuery.noDatasourceBody', {
            defaultMessage:
              'Choose a Prometheus data source from the selector above to start running PromQL queries.',
          })}
        />
      </CanvasPanel>
    );
  }

  if (shouldSkipQueryExecution(query)) {
    // Introduce the active language as this source runs it, so PromQL on Prometheus reads
    // differently from PromQL on another store, and SQL from OpenSearch SQL.
    const languageId = query.language;
    const registry = getSourceTypeRegistry();
    const languageTitle = registry.getLanguageLabel(
      languageId,
      dataset,
      getServices().data.query.queryString.getLanguageService().getLanguage(languageId)?.title
    );
    const guide = registry.getLanguageGuide(languageId, dataset);
    const sampleQueries = guide.sampleQueries ?? [];
    return (
      <CanvasPanel>
        <MetricsEmptyState
          title={i18n.translate('explore.metricsQuery.emptyTitle', {
            defaultMessage: 'Write a {language} query to visualize metrics',
            values: { language: languageTitle },
          })}
          description={guide.description}
          body={
            sampleQueries.length
              ? i18n.translate('explore.metricsQuery.emptyBody', {
                  defaultMessage:
                    'Build a query with the builder, switch to code mode, or adapt the samples below by replacing their metric and label names with your own.',
                })
              : i18n.translate('explore.metricsQuery.emptyBodyNoSamples', {
                  defaultMessage: 'Build a query with the builder, or switch to code mode.',
                })
          }
          sampleQueries={sampleQueries}
          sampleQueriesTitle={i18n.translate('explore.metricsQuery.sampleQueriesTitle', {
            defaultMessage: 'Sample {language} queries',
            values: { language: languageTitle },
          })}
          codeLanguage={languageId === 'PROMQL' ? 'promql' : 'sql'}
        />
      </CanvasPanel>
    );
  }

  if (status === QueryExecutionStatus.NO_RESULTS || status === QueryExecutionStatus.UNINITIALIZED) {
    return (
      <CanvasPanel>
        <ResizableVisControlAndTabs />
      </CanvasPanel>
    );
  }

  if (status === QueryExecutionStatus.LOADING && dataTableStatus === QueryExecutionStatus.LOADING) {
    return (
      <CanvasPanel>
        <LoadingSpinner />
      </CanvasPanel>
    );
  }

  if (
    dataTableStatus === QueryExecutionStatus.READY ||
    dataTableStatus === QueryExecutionStatus.ERROR ||
    status === QueryExecutionStatus.READY ||
    status === QueryExecutionStatus.ERROR
  ) {
    return (
      <>
        <CanvasPanel>
          <ResizableVisControlAndTabs />
        </CanvasPanel>
      </>
    );
  }

  return null;
};
