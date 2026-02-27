/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

import { ResizableVisControlAndTabs } from './resizable_vis_control_and_tabs';

jest.mock('../../../tabs/tabs', () => ({
  AgentTracesTabs: () => <div data-test-subj="agentTraces-tabs">Agent Traces Tabs</div>,
}));

jest.mock('../../../../application/pages/traces/hooks/use_trace_metrics', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createContext } = require('react');
  return {
    useTraceMetrics: () => ({ metrics: null, loading: false, error: null, refresh: jest.fn() }),
    TraceMetricsContext: createContext({
      metrics: null,
      loading: false,
      error: null,
      refresh: () => {},
    }),
  };
});

jest.mock('../../../../application/pages/traces/trace_metrics_bar', () => ({
  TraceMetricsBar: () => <div data-test-subj="traceMetricsBar">Metrics Bar</div>,
}));

jest.mock('../../../../application/pages/traces/flyout/trace_flyout_context', () => ({
  TraceFlyoutProvider: ({ children }: any) => <>{children}</>,
}));

describe('<ResizableVisControlAndTabs />', () => {
  test('it should render AgentTracesTabs', () => {
    render(<ResizableVisControlAndTabs />);
    expect(screen.getByTestId('agentTraces-tabs')).toBeInTheDocument();
  });
});
