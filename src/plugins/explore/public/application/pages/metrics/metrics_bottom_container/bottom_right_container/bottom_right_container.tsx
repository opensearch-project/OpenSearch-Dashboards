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
    return (
      <CanvasPanel>
        <MetricsEmptyState
          title={i18n.translate('explore.metricsQuery.emptyTitle', {
            defaultMessage: 'Write a PromQL query to visualize metrics',
          })}
          body={i18n.translate('explore.metricsQuery.emptyBody', {
            defaultMessage:
              'Build a query with the builder, switch to code mode, or reference the samples below to get started.',
          })}
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
