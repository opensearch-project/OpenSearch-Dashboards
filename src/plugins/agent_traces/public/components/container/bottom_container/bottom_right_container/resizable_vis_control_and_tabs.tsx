/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AgentTracesTabs } from '../../../tabs/tabs';
import {
  useTraceMetrics,
  TraceMetricsContext,
} from '../../../../application/pages/traces/hooks/use_trace_metrics';
import { useErrorFilterClick } from '../../../../application/pages/traces/hooks/use_error_filter_click';
import { TraceMetricsBar } from '../../../../application/pages/traces/trace_metrics_bar';
import { TraceFlyoutProvider } from '../../../../application/pages/traces/flyout/trace_flyout_context';

export const ResizableVisControlAndTabs = () => {
  const metricsResult = useTraceMetrics(true);
  const handleErrorClick = useErrorFilterClick();

  return (
    <TraceMetricsContext.Provider value={metricsResult}>
      <TraceFlyoutProvider>
        <TraceMetricsBar metrics={metricsResult.metrics} onErrorClick={handleErrorClick} />
        <AgentTracesTabs />
      </TraceFlyoutProvider>
    </TraceMetricsContext.Provider>
  );
};
