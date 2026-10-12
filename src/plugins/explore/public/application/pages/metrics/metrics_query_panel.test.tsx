/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { MetricsQueryPanel } from './metrics_query_panel';
import type { QueryRowProps } from './query_panel/query_row';

interface MockState {
  query: {
    query: string;
    language: string;
    queryOptions?: { perQueryOptions?: Array<{ minStep?: string; legendFormat?: string }> };
  };
  isQueryEditorDirty: boolean;
}

let mockState: MockState;

jest.mock('react-redux', () => ({
  useDispatch: () => jest.fn(),
  useSelector: (selector: (state: MockState) => unknown) => selector(mockState),
}));

jest.mock('../../../application/utils/state_management/selectors', () => ({
  selectIsLoading: () => false,
  selectIsPromptEditorMode: () => false,
  selectPromptToQueryIsLoading: () => false,
  selectIsQueryEditorDirty: (state: MockState) => state.isQueryEditorDirty,
  selectQueryLanguage: (state: MockState) => state.query.language,
  selectQueryString: (state: MockState) => state.query.query,
}));

jest.mock('../../../../../opensearch_dashboards_react/public', () => ({
  ...jest.requireActual('../../../../../opensearch_dashboards_react/public'),
  useOpenSearchDashboards: () => ({
    services: {
      data: {
        query: {
          queryString: {
            getQuery: () => ({ query: '', language: 'PROMQL' }),
            setQuery: jest.fn(),
            getLanguageService: () => ({ getLanguage: () => ({ title: 'PromQL' }) }),
          },
        },
      },
    },
  }),
}));

jest.mock('@osd/monaco', () => {
  const actual = jest.requireActual('@osd/monaco');
  return {
    ...actual,
    monaco: {
      ...actual.monaco,
      languages: {
        ...actual.monaco.languages,
        registerCompletionItemProvider: () => ({ dispose: jest.fn() }),
      },
    },
  };
});

jest.mock('../../../components/query_panel/query_panel_widgets', () => ({
  QueryPanelWidgets: () => null,
}));
jest.mock('../../../components/query_panel/query_panel_editor', () => ({
  ExploreQueryPanelEditor: () => null,
}));
jest.mock('../../../components/query_panel/query_panel_generated_query', () => ({
  QueryPanelGeneratedQuery: () => null,
}));
jest.mock('../../../components/query_panel/actions/ppl_execute_query_action', () => ({
  usePPLExecuteQueryAction: jest.fn(),
}));
jest.mock('../../../components/query_panel/actions/ppl_lint_fix_action', () => ({
  usePPLLintFixAction: jest.fn(),
}));
jest.mock('../../../application/hooks', () => ({
  useEditorRef: () => ({ current: null }),
  useSetEditorTextWithQuery: () => jest.fn(),
}));
jest.mock(
  '../../../application/hooks/editor_hooks/use_set_editor_text/use_set_editor_text',
  () => ({ useSetEditorText: () => jest.fn() })
);
jest.mock('./explore/services/prometheus_client', () => ({
  PrometheusClient: jest.fn(),
}));

jest.mock('./query_panel', () => ({
  ...jest.requireActual('./query_panel/row_state'),
  QueryRowComponent: ({ row, onOptionsChange }: QueryRowProps) => (
    <div data-test-subj="queryRow">
      <span data-test-subj="queryRowQuery">{row.query}</span>
      <span data-test-subj="queryRowLegendFormat">{row.legendFormat ?? ''}</span>
      <button
        data-test-subj="queryRowEditLegendFormat"
        onClick={() => onOptionsChange(row.id, { minStep: row.minStep, legendFormat: 'draft' })}
      />
    </div>
  ),
  createPromQLSuggestionProvider: jest.fn(),
  MetricsQueryOptions: () => null,
  formatStepSeconds: jest.fn(),
  useExecutedStepResolution: () => undefined,
  useMetricsQuerySettings: () => ({
    maxDataPoints: undefined,
    onMaxDataPointsChange: jest.fn(),
    getResolvedStep: jest.fn(),
  }),
}));

const setReduxState = (
  query: string,
  legendFormat: string | undefined,
  isQueryEditorDirty: boolean
) => {
  mockState = {
    query: {
      query,
      language: 'PROMQL',
      queryOptions: { perQueryOptions: [{ legendFormat }] },
    },
    isQueryEditorDirty,
  };
};

const legendFormat = () => screen.getAllByTestId('queryRowLegendFormat')[0].textContent;

describe('MetricsQueryPanel row sync', () => {
  beforeEach(() => {
    setReduxState('up', 'saved', false);
  });

  it('keeps a dirty draft when the query text is unchanged', () => {
    const { rerender } = render(<MetricsQueryPanel />);
    expect(legendFormat()).toBe('saved');

    fireEvent.click(screen.getByTestId('queryRowEditLegendFormat'));
    setReduxState('up', 'saved', true);
    rerender(<MetricsQueryPanel />);

    expect(legendFormat()).toBe('draft');
  });

  it('restores rows and options when a query with the same text is loaded', () => {
    const { rerender } = render(<MetricsQueryPanel />);
    fireEvent.click(screen.getByTestId('queryRowEditLegendFormat'));
    setReduxState('up', 'saved', true);
    rerender(<MetricsQueryPanel />);

    setReduxState('up', 'loaded', false);
    rerender(<MetricsQueryPanel />);

    expect(legendFormat()).toBe('loaded');
  });

  it('resets rows when the loaded query text changes', () => {
    const { rerender } = render(<MetricsQueryPanel />);
    fireEvent.click(screen.getByTestId('queryRowEditLegendFormat'));
    setReduxState('up', 'saved', true);
    rerender(<MetricsQueryPanel />);

    setReduxState('go_goroutines;\nup;', undefined, true);
    rerender(<MetricsQueryPanel />);

    expect(screen.getAllByTestId('queryRowQuery').map((el) => el.textContent)).toEqual([
      'go_goroutines',
      'up',
    ]);
    expect(legendFormat()).toBe('');
  });
});
