/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { TracesTable } from './traces_table';

jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: (_key: string, opts: { defaultMessage: string }) => opts.defaultMessage,
  },
}));

jest.mock('@osd/i18n/react', () => ({
  FormattedMessage: ({ defaultMessage, values }: any) => {
    let msg = defaultMessage;
    if (values) {
      Object.entries(values).forEach(([k, v]: [string, any]) => {
        msg = msg.replace(`{${k}}`, typeof v === 'object' ? k : v);
      });
    }
    return <>{msg}</>;
  },
}));

jest.mock('react-redux', () => ({
  useSelector: jest.fn(() => 'mock-query'),
}));

jest.mock('../../../services/span_categorization', () => ({
  getSpanCategory: jest.fn(() => 'AGENT'),
  getCategoryMeta: jest.fn(() => ({
    color: '#54B399',
    bgColor: '#54B399',
    icon: 'Bot',
    label: 'Agent',
  })),
}));

const mockOpenFlyout = jest.fn();
const mockUpdateFlyoutFullTree = jest.fn();
jest.mock('./flyout/trace_flyout_context', () => ({
  useTraceFlyout: () => ({
    openFlyout: mockOpenFlyout,
    updateFlyoutFullTree: mockUpdateFlyoutFullTree,
  }),
}));

const mockTraces = [
  {
    id: 'trace-1',
    spanId: 'span-1',
    traceId: 'tid-1',
    parentSpanId: null,
    status: 'success',
    kind: 'chat',
    name: 'Agent Run',
    input: 'hello',
    output: 'world',
    startTime: '01/01/2025',
    endTime: '',
    latency: '500ms',
    totalTokens: 100,
    totalCost: '—',
    isExpandable: false,
    level: 0,
  },
];

const mockUseAgentTraces = jest.fn(() => ({
  traces: mockTraces,
  loading: false,
  error: null,
  refresh: jest.fn(),
  expandTrace: jest.fn(),
  traceSpansCache: new Map(),
  traceLoadingState: new Map(),
}));

jest.mock('./hooks/use_agent_traces', () => ({
  useAgentTraces: (...args: any[]) => mockUseAgentTraces(...args),
  getChildrenFromFullTree: jest.fn(),
}));

jest.mock('./hooks/use_trace_metrics', () => ({
  useTraceMetrics: () => ({ metrics: null, loading: false }),
  useTraceMetricsContext: () => ({
    metrics: null,
    loading: false,
    error: null,
    refresh: jest.fn(),
  }),
}));

describe('TracesTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAgentTraces.mockReturnValue({
      traces: mockTraces,
      loading: false,
      error: null,
      refresh: jest.fn(),
      expandTrace: jest.fn(),
      traceSpansCache: new Map(),
      traceLoadingState: new Map(),
    });
  });

  it('renders loading state', () => {
    mockUseAgentTraces.mockReturnValue({
      traces: [],
      loading: true,
      error: null,
      refresh: jest.fn(),
      expandTrace: jest.fn(),
      traceSpansCache: new Map(),
      traceLoadingState: new Map(),
    });
    render(<TracesTable />);
    expect(screen.getByText('Loading agent traces...')).toBeInTheDocument();
  });

  it('renders error state', () => {
    mockUseAgentTraces.mockReturnValue({
      traces: [],
      loading: false,
      error: 'Something went wrong',
      refresh: jest.fn(),
      expandTrace: jest.fn(),
      traceSpansCache: new Map(),
      traceLoadingState: new Map(),
    });
    const { container } = render(<TracesTable />);
    expect(container.firstChild).toBeNull();
  });

  it('renders empty state', () => {
    mockUseAgentTraces.mockReturnValue({
      traces: [],
      loading: false,
      error: null,
      refresh: jest.fn(),
      expandTrace: jest.fn(),
      traceSpansCache: new Map(),
      traceLoadingState: new Map(),
    });
    render(<TracesTable />);
    expect(screen.getByText('No agent traces found')).toBeInTheDocument();
  });

  it('renders table with traces', () => {
    render(<TracesTable />);
    expect(screen.getByText('Agent Run')).toBeInTheDocument();
    expect(screen.getByText('500ms')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('renders column headers', () => {
    render(<TracesTable />);
    const headers = document.querySelectorAll('th');
    const headerTexts = Array.from(headers).map((h) => h.textContent);
    expect(headerTexts).toContain('Time');
    expect(headerTexts).toContain('Kind');
    expect(headerTexts).toContain('Name');
    expect(headerTexts).toContain('Status');
    expect(headerTexts).toContain('Latency');
  });
});
