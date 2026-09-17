/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { SessionsTab } from './sessions_tab';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { useDatasetContext } from '../../context/dataset_context/dataset_context';
import { useTabResults } from '../../utils/hooks/use_tab_results';
import { QueryExecutionStatus } from '../../utils/state_management/types';
import { executePPLQuery } from './trace_details/data_fetching/ppl_request_helpers';
import { transformPPLDataToTraceHits } from './trace_details/traces/ppl_to_trace_hits';

jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: (_key: string, opts: { defaultMessage: string; values?: Record<string, any> }) => {
      let msg = opts.defaultMessage;
      if (opts.values) {
        Object.entries(opts.values).forEach(([k, v]) => {
          msg = msg.replace(`{${k}}`, String(v));
        });
      }
      return msg;
    },
  },
}));

jest.mock('../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn(),
  // `data/public` (pulled in transitively via state_management/types) wraps its
  // query-string input in `withOpenSearchDashboards`; without this the module
  // throws "is not a function" at import time and the whole suite fails to load.
  withOpenSearchDashboards: jest.fn((component: any) => component),
}));

// `table_shared` transitively imports `use_trace_metrics` -> `PPLService`, a
// data-plugin service class that resolves to `undefined` under jest and throws
// "Class extends value undefined" at import time. The tab only uses the two
// presentational states below, so stub them to their rendered message/title.
jest.mock('./table_shared', () => ({
  TableLoadingState: ({ message }: { message?: string }) => <div>{message}</div>,
  TableEmptyState: ({ title }: { title?: string }) => <div>{title}</div>,
}));

jest.mock('../../context/dataset_context/dataset_context', () => ({
  useDatasetContext: jest.fn(),
}));

jest.mock('../../utils/hooks/use_tab_results', () => ({
  useTabResults: jest.fn(),
}));

// Keep the request builders as no-op seams; the response transform is the seam
// we drive to control the folded turns.
jest.mock('./trace_details/data_fetching/ppl_request_helpers', () => ({
  buildPPLQueryRequest: jest.fn((_dataset: any, query: string) => ({ query })),
  escapePPLValue: jest.fn((v: any) => `"${v}"`),
  executePPLQuery: jest.fn(),
}));

jest.mock('./trace_details/traces/ppl_to_trace_hits', () => ({
  transformPPLDataToTraceHits: jest.fn(),
}));

const mockUseOpenSearchDashboards = useOpenSearchDashboards as jest.Mock;
const mockUseDatasetContext = useDatasetContext as jest.Mock;
const mockUseTabResults = useTabResults as jest.Mock;
const mockExecutePPLQuery = executePPLQuery as jest.Mock;
const mockTransform = transformPPLDataToTraceHits as jest.Mock;

const DATASET = { id: 'idx-id', title: 'otel-v1-apm-span-*', type: 'INDEX_PATTERN' };

/** Builds a `results`-shaped object with one aggregated session row per input. */
const resultsWith = (rows: Array<Record<string, any>>) => ({
  hits: { hits: rows.map((_source) => ({ _source })) },
});

const SESSION_SOURCE = {
  'attributes.gen_ai.conversation.id': 'conv-1',
  session_start: '2026-09-16T10:00:00.000Z',
  session_end: '2026-09-16T10:00:30.000Z',
  p50_latency: 1_500_000, // 1.5 ms in ns
  p99_latency: 12_000_000, // 12 ms in ns
  first_input: 'what is the weather?',
  first_output: 'it is sunny',
  span_count: 12,
  trace_count: 3,
  turn_count: 2,
  error_count: 1,
  input_tokens: 100,
  output_tokens: 250,
  agent_id: 'agent-abc',
  agent_name: 'Weather Agent',
  request_model: 'claude-req',
  response_model: 'claude-res',
  provider_name: 'anthropic',
};

const setServices = () => {
  const generator = { createUrl: jest.fn().mockResolvedValue('/app/agent_traces#/x') };
  mockUseOpenSearchDashboards.mockReturnValue({
    services: {
      data: {},
      share: { urlGenerators: { getUrlGenerator: jest.fn().mockReturnValue(generator) } },
      timefilter: { getTime: jest.fn().mockReturnValue({ from: 'now-1h', to: 'now' }) },
    },
  });
  return generator;
};

describe('SessionsTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setServices();
    mockUseDatasetContext.mockReturnValue({ dataset: DATASET });
  });

  it('shows the loading state before the first query resolves', () => {
    mockUseTabResults.mockReturnValue({
      results: null,
      status: { status: QueryExecutionStatus.LOADING },
    });
    render(<SessionsTab />);
    expect(screen.getByText('Loading sessions…')).toBeInTheDocument();
  });

  it('shows the empty state when the query is ready with no sessions', () => {
    mockUseTabResults.mockReturnValue({
      results: resultsWith([]),
      status: { status: QueryExecutionStatus.READY },
    });
    render(<SessionsTab />);
    expect(screen.getByText('No sessions found')).toBeInTheDocument();
  });

  it('filters out rows without a conversation id', () => {
    mockUseTabResults.mockReturnValue({
      results: resultsWith([SESSION_SOURCE, { session_start: '2026-09-16T09:00:00.000Z' }]),
      status: { status: QueryExecutionStatus.READY },
    });
    render(<SessionsTab />);
    // Only the row carrying a conversation id renders a session link.
    expect(screen.getAllByTestId('agentTracesSessionIdLink')).toHaveLength(1);
  });

  it('reduces KPI totals across sessions', () => {
    const second = {
      ...SESSION_SOURCE,
      'attributes.gen_ai.conversation.id': 'conv-2',
      error_count: 0,
      input_tokens: 50,
      output_tokens: 50,
    };
    mockUseTabResults.mockReturnValue({
      results: resultsWith([SESSION_SOURCE, second]),
      status: { status: QueryExecutionStatus.READY },
    });
    render(<SessionsTab />);
    // 2 sessions; total tokens = (100+250)+(50+50) = 450; total traces = 3+3 = 6.
    // Scope KPI assertions to the KPI strip: "Total traces" also appears as a
    // table column header, so an unscoped getByText would match >1 node and throw.
    const kpiStrip = screen.getByTestId('agentTracesSessionsKpiStrip');
    expect(within(kpiStrip).getByText('Sessions')).toBeInTheDocument();
    expect(within(kpiStrip).getByText('450')).toBeInTheDocument();
    expect(within(kpiStrip).getByText('Total traces')).toBeInTheDocument();
    expect(within(kpiStrip).getByText('Latency P50')).toBeInTheDocument();
  });

  it('renders the message-forward columns and an error dot for failed sessions', () => {
    mockUseTabResults.mockReturnValue({
      results: resultsWith([SESSION_SOURCE]),
      status: { status: QueryExecutionStatus.READY },
    });
    render(<SessionsTab />);
    // First input / first response lead the message-forward list.
    expect(screen.getByText('what is the weather?')).toBeInTheDocument();
    expect(screen.getByText('it is sunny')).toBeInTheDocument();
    // Agent · model fold into the Session-ID sub-line.
    expect(screen.getByText('Weather Agent · claude-req')).toBeInTheDocument();
    // error_count > 0 surfaces a red dot.
    expect(screen.getByTestId('agentTracesSessionErrorDot')).toBeInTheDocument();
  });

  it('projects object-shaped message attributes to readable text', () => {
    const objectMsg = {
      ...SESSION_SOURCE,
      'attributes.gen_ai.conversation.id': 'conv-obj',
      first_input: '[{"role":"user","content":"hello there"}]',
      first_output: { role: 'assistant', content: 'general kenobi' },
    };
    mockUseTabResults.mockReturnValue({
      results: resultsWith([objectMsg]),
      status: { status: QueryExecutionStatus.READY },
    });
    render(<SessionsTab />);
    expect(screen.getByText('hello there')).toBeInTheDocument();
    expect(screen.getByText('general kenobi')).toBeInTheDocument();
  });

  describe('conversation flyout', () => {
    const openFlyout = () => {
      mockUseTabResults.mockReturnValue({
        results: resultsWith([SESSION_SOURCE]),
        status: { status: QueryExecutionStatus.READY },
      });
      render(<SessionsTab />);
      fireEvent.click(screen.getByTestId('agentTracesSessionIdLink'));
    };

    it('folds spans into user and assistant turns', async () => {
      mockExecutePPLQuery.mockResolvedValue({});
      mockTransform.mockReturnValue([
        {
          traceId: 'trace-1',
          startTime: '2026-09-16T10:00:00.000Z',
          endTime: '2026-09-16T10:00:01.000Z',
          attributes: {
            'gen_ai.input.messages': 'what is the weather?',
            'gen_ai.output.messages': 'it is sunny',
            'gen_ai.response.model': 'claude-res',
            'gen_ai.usage.input_tokens': 10,
            'gen_ai.usage.output_tokens': 20,
            'gen_ai.tool.name': 'get_weather',
          },
        },
      ]);
      openFlyout();
      expect(await screen.findByTestId('agentTracesSessionFlyout')).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByTestId('agentTracesTurn-user')).toBeInTheDocument();
        expect(screen.getByTestId('agentTracesTurn-assistant')).toBeInTheDocument();
      });
      // Bubbles are labelled HUMAN / AI (Phoenix parity).
      expect(screen.getByText('HUMAN')).toBeInTheDocument();
      expect(screen.getByText('AI')).toBeInTheDocument();
    });

    it('shows an error state when the fetch rejects', async () => {
      mockExecutePPLQuery.mockRejectedValue(new Error('boom'));
      openFlyout();
      expect(await screen.findByText('Could not load conversation')).toBeInTheDocument();
      expect(screen.getByText('boom')).toBeInTheDocument();
    });

    it('shows the empty conversation state when no turns are produced', async () => {
      mockExecutePPLQuery.mockResolvedValue({});
      mockTransform.mockReturnValue([]);
      openFlyout();
      expect(await screen.findByText('No conversation content')).toBeInTheDocument();
    });

    it('surfaces a truncation notice when the span cap is hit', async () => {
      mockExecutePPLQuery.mockResolvedValue({});
      mockTransform.mockReturnValue(
        Array.from({ length: 1000 }, (_, i) => ({
          traceId: `trace-${i}`,
          startTime: '2026-09-16T10:00:00.000Z',
          endTime: '2026-09-16T10:00:01.000Z',
          attributes: { 'gen_ai.input.messages': `msg ${i}` },
        }))
      );
      openFlyout();
      expect(
        await screen.findByText(
          'Showing the first 1000 spans of this conversation. Later spans are not displayed.'
        )
      ).toBeInTheDocument();
    });

    it('builds a deep link and opens the trace when "View trace" is clicked', async () => {
      const generator = setServices();
      const windowOpen = jest.spyOn(window, 'open').mockImplementation(() => null);
      mockExecutePPLQuery.mockResolvedValue({});
      mockTransform.mockReturnValue([
        {
          traceId: 'trace-1',
          startTime: '2026-09-16T10:00:00.000Z',
          endTime: '2026-09-16T10:00:01.000Z',
          attributes: { 'gen_ai.output.messages': 'answer' },
        },
      ]);
      openFlyout();
      const viewTrace = await screen.findByTestId('agentTracesViewTraceLink');
      fireEvent.click(viewTrace);
      await waitFor(() => expect(generator.createUrl).toHaveBeenCalled());
      const arg = generator.createUrl.mock.calls[0][0];
      // `escapePPLValue` wraps string literals in double quotes (see
      // ppl_request_helpers.tsx), matching the flyout conversation query.
      expect(arg.query.query).toContain('traceId = "trace-1"');
      await waitFor(() => expect(windowOpen).toHaveBeenCalled());
      windowOpen.mockRestore();
    });
  });
});
