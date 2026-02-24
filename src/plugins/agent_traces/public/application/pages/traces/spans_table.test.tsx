/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { SpansTable } from './spans_table';

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
  getSpanCategory: jest.fn(() => 'LLM'),
  getCategoryBadgeStyle: jest.fn(() => ({ backgroundColor: '#eee', color: '#333' })),
}));

const mockOpenFlyout = jest.fn();
const mockUpdateFlyoutFullTree = jest.fn();
jest.mock('./flyout/trace_flyout_context', () => ({
  useTraceFlyout: () => ({
    openFlyout: mockOpenFlyout,
    updateFlyoutFullTree: mockUpdateFlyoutFullTree,
  }),
}));

const mockSpans = [
  {
    id: 'span-1',
    spanId: 'span-1',
    traceId: 'tid-1',
    parentSpanId: null,
    status: 'success',
    kind: 'llm',
    name: 'LLM Call',
    input: 'prompt text',
    output: 'response text',
    startTime: '01/01/2025',
    endTime: '',
    latency: '200ms',
    totalTokens: 50,
    totalCost: '—',
  },
];

const mockUseAgentSpans = jest.fn(() => ({
  spans: mockSpans,
  loading: false,
  error: null,
  refresh: jest.fn(),
  expandSpan: jest.fn(),
  spanSpansCache: new Map(),
  spanLoadingState: new Map(),
}));

jest.mock('./hooks/use_agent_spans', () => ({
  useAgentSpans: (...args: any[]) => mockUseAgentSpans(...args),
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

describe('SpansTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAgentSpans.mockReturnValue({
      spans: mockSpans,
      loading: false,
      error: null,
      refresh: jest.fn(),
      expandSpan: jest.fn(),
      spanSpansCache: new Map(),
      spanLoadingState: new Map(),
    });
  });

  it('renders loading state', () => {
    mockUseAgentSpans.mockReturnValue({
      spans: [],
      loading: true,
      error: null,
      refresh: jest.fn(),
      expandSpan: jest.fn(),
      spanSpansCache: new Map(),
      spanLoadingState: new Map(),
    });
    render(<SpansTable />);
    expect(screen.getByText('Loading agent spans...')).toBeInTheDocument();
  });

  it('renders error state', () => {
    mockUseAgentSpans.mockReturnValue({
      spans: [],
      loading: false,
      error: 'Network error',
      refresh: jest.fn(),
      expandSpan: jest.fn(),
      spanSpansCache: new Map(),
      spanLoadingState: new Map(),
    });
    const { container } = render(<SpansTable />);
    expect(container.firstChild).toBeNull();
  });

  it('renders empty state', () => {
    mockUseAgentSpans.mockReturnValue({
      spans: [],
      loading: false,
      error: null,
      refresh: jest.fn(),
      expandSpan: jest.fn(),
      spanSpansCache: new Map(),
      spanLoadingState: new Map(),
    });
    render(<SpansTable />);
    expect(screen.getByText('No agent spans found')).toBeInTheDocument();
  });

  it('renders table with spans', () => {
    render(<SpansTable />);
    expect(screen.getByText('LLM Call')).toBeInTheDocument();
    expect(screen.getByText('200ms')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('renders column headers', () => {
    render(<SpansTable />);
    const headers = document.querySelectorAll('th');
    const headerTexts = Array.from(headers).map((h) => h.textContent);
    expect(headerTexts).toContain('Time');
    expect(headerTexts).toContain('Kind');
    expect(headerTexts).toContain('Name');
    expect(headerTexts).toContain('Status');
    expect(headerTexts).toContain('Latency');
    expect(headerTexts).toContain('Tokens');
    expect(headerTexts).toContain('Input');
    expect(headerTexts).toContain('Output');
  });
});
