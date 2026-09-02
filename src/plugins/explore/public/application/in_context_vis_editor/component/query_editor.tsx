/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { QueryPanelEditor as InnerQueryEditor } from '../../../components/query_panel/';
import { useQueryPanelEditorProps } from '../hooks/use_query_panel_editor_props';
import { getQueryLabel } from '../../../../../data/common';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../types';
import {
  useMetricsQuerySettings,
  useExecutedStepResolution,
} from '../hooks/use_metrics_query_options';
import { useQueryBuilderState } from '../hooks/use_query_builder_state';
import {
  MetricsQueryOptions,
  RowQueryOptions,
  formatStepSeconds,
} from '../../pages/metrics/query_panel/metrics_query_options';
import type { RowStepReadout } from '../../pages/metrics/query_panel/metrics_query_options';
import type { PerQueryOptions } from '../../../../../query_enhancements/common';

export const QueryPanelEditor = () => {
  const props = useQueryPanelEditorProps();

  return <InnerQueryEditor {...props} />;
};

export const MetricQueryPanelEditor = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const props = useQueryPanelEditorProps();

  const { queryState, queryBuilder } = useQueryBuilderState();

  // currently, only support singleQuery
  const rowOptions: PerQueryOptions = {
    minStep: queryState.queryOptions?.perQueryOptions?.[0]?.minStep,
    legendFormat: queryState.queryOptions?.perQueryOptions?.[0]?.legendFormat,
  };

  const onOptionsChange = useCallback(
    (options: PerQueryOptions) => {
      queryBuilder.updateQueryOptions({ perQueryOptions: [options] });
      queryBuilder.updateQueryEditorState({ isQueryEditorDirty: true });
    },
    [queryBuilder]
  );

  const { maxDataPoints, onMaxDataPointsChange, getResolvedStep } =
    useMetricsQuerySettings(services);

  const executedSteps = useExecutedStepResolution();

  const label = getQueryLabel(0);
  const candidate =
    !!executedSteps && executedSteps.query === queryState.query
      ? executedSteps.byLabel[label]
      : undefined;

  // The server resolved these steps against the min step in effect at run
  // time, so a since-edited min step must fall back to a fresh estimate.
  const executed =
    candidate && (candidate.minStep ?? undefined) === (rowOptions.minStep ?? undefined)
      ? candidate
      : undefined;

  const resolved = executed ?? getResolvedStep(rowOptions.minStep);
  const stepReadout: RowStepReadout = {
    stepLabel: formatStepSeconds(resolved?.stepSec),
    rateIntervalLabel: formatStepSeconds(resolved?.rateIntervalSec),
    isFromLastRun: !!executed,
  };

  return (
    <EuiFlexGroup gutterSize="s" responsive={false} direction="column">
      <EuiFlexItem grow={true}>
        <EuiFlexGroup
          gutterSize="s"
          alignItems="center"
          responsive={false}
          justifyContent="flexStart"
        >
          <EuiFlexItem>
            <InnerQueryEditor {...props} />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <RowQueryOptions
              minStep={rowOptions.minStep}
              legendFormat={rowOptions.legendFormat}
              onChange={onOptionsChange}
              {...stepReadout}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <MetricsQueryOptions
          maxDataPoints={maxDataPoints}
          onMaxDataPointsChange={onMaxDataPointsChange}
          resolvedMaxDataPoints={executedSteps?.maxDataPoints}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
