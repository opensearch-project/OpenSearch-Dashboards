/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { LogsQueryPanel } from './logs_query_panel';
import {
  queryReducer,
  queryEditorReducer,
  legacyReducer,
} from '../../utils/state_management/slices';

jest.mock('@osd/i18n', () => ({
  i18n: { translate: jest.fn((_key, opts) => opts.defaultMessage) },
}));

const mockSetQuery = jest.fn();
const mockGetQuery = jest.fn(() => ({ query: '', language: 'PPL', dataset: undefined }));

jest.mock('../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn(),
}));

// The data plugin's UI barrel calls withOpenSearchDashboards at import time;
// stub it so the selectors' transitive import resolves without the query bar.
jest.mock('../../../../../data/public', () => ({
  ResultStatus: {
    UNINITIALIZED: 'uninitialized',
    LOADING: 'loading',
    READY: 'ready',
    NO_RESULTS: 'none',
    ERROR: 'error',
  },
}));

// Keep the real parsePPL/types (mode decision depends on parsePPL) but stub the
// heavy PPLBuilder, whose module pulls in the data plugin via
// createHistogramConfigs. Re-export from the leaf modules to avoid that chain.
jest.mock('./ppl_builder', () => ({
  ...jest.requireActual('./ppl_builder/parse_ppl'),
  ...jest.requireActual('./ppl_builder/types'),
  // The stub surfaces the `initialState` it mounted with and exposes buttons to
  // switch to code and to push a builder edit whose state carries partial work
  // buildPPL can't serialize (a fieldless metric).
  PPLBuilder: ({
    initialState,
    onSwitchToCode,
    onQueryChange,
  }: {
    initialState?: any;
    onSwitchToCode?: () => void;
    onQueryChange?: (query: string, state: any) => void;
  }) => (
    <div data-test-subj="ppl-builder-stub">
      Builder
      <span data-test-subj="stub-initial-state">{JSON.stringify(initialState)}</span>
      <button type="button" data-test-subj="stub-switch-to-code" onClick={onSwitchToCode}>
        code
      </button>
      <button
        type="button"
        data-test-subj="stub-add-partial-metric"
        onClick={() =>
          // A fieldless metric compiles to nothing, so the emitted query is just
          // the search expression; the partial work lives only in state.
          onQueryChange?.('service="web-store"', {
            searchExpression: 'service="web-store"',
            aggregations: [{ id: 'ag-partial', fn: 'avg' }],
            groupBy: { fields: [] },
          })
        }
      >
        add partial metric
      </button>
    </div>
  ),
}));

// Surface whether the analyze props were passed through (vs. gated to `undefined`
// in visual builder mode).
jest.mock('../../../components/query_panel/query_panel_widgets', () => ({
  QueryPanelWidgets: ({ onToggleAnalyze }: { onToggleAnalyze?: () => void }) => (
    <div data-test-subj="query-panel-widgets">
      Widgets
      {onToggleAnalyze !== undefined && <span data-test-subj="widgets-analyze-enabled" />}
    </div>
  ),
}));
jest.mock('../../../components/query_panel/query_panel_editor', () => ({
  ExploreQueryPanelEditor: () => <div data-test-subj="code-editor-stub">Code Editor</div>,
}));
jest.mock('../../../components/query_panel/query_panel_generated_query', () => ({
  QueryPanelGeneratedQuery: () => <div />,
}));
jest.mock('../../../components/query_panel/actions/ppl_execute_query_action', () => ({
  usePPLExecuteQueryAction: jest.fn(),
}));
// Stubbed to a no-op thunk; the real action pulls in createHistogramConfigs
// (data plugin) at module load.
jest.mock('../../utils/state_management/actions/query_editor', () => ({
  onEditorRunActionCreator: jest.fn(() => () => {}),
}));
// Shared editor-text state so the Code round-trip is realistic: what the builder
// pushes via setEditorText is what getEditorText reads back.
const mockEditorText = { current: '' };
jest.mock('../../../application/hooks', () => ({
  useSetEditorTextWithQuery: () => jest.fn(),
  useEditorRef: () => ({ current: null }),
  useEditorText: () => () => mockEditorText.current,
}));
jest.mock(
  '../../../application/hooks/editor_hooks/use_set_editor_text/use_set_editor_text',
  () => ({
    useSetEditorText: () => (text: string) => {
      mockEditorText.current = text;
    },
  })
);

const makeStore = (query: string, savedSearch?: string) =>
  configureStore({
    reducer: { query: queryReducer, queryEditor: queryEditorReducer, legacy: legacyReducer },
    preloadedState: {
      query: { query, language: 'PPL', dataset: { id: '1', title: 'logs' } },
      legacy: { savedSearch },
    } as any,
  });

const setupServices = () => {
  (useOpenSearchDashboards as jest.Mock).mockReturnValue({
    services: {
      uiSettings: { get: jest.fn() },
      data: {
        query: {
          queryString: {
            getQuery: mockGetQuery,
            setQuery: mockSetQuery,
            getInitialQueryByDataset: jest.fn(() => ({ query: 'source = logs' })),
          },
        },
      },
    },
  });
};

const renderPanel = (
  query: string,
  savedSearch?: string,
  props: React.ComponentProps<typeof LogsQueryPanel> = {}
) =>
  render(
    <Provider store={makeStore(query, savedSearch)}>
      <LogsQueryPanel {...props} />
    </Provider>
  );

describe('LogsQueryPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupServices();
    mockEditorText.current = '';
    mockGetQuery.mockReturnValue({ query: '', language: 'PPL', dataset: { id: '1' } as any });
  });

  it('defaults a fresh query to builder mode', () => {
    renderPanel('');
    expect(screen.getByTestId('ppl-builder-stub')).toBeInTheDocument();
  });

  it('opens a parseable query in builder mode', () => {
    renderPanel('source = logs service="web-store"');
    expect(screen.getByTestId('ppl-builder-stub')).toBeInTheDocument();
  });

  it('opens an unparseable query in code mode', () => {
    renderPanel('source = logs | sort field');
    expect(screen.getByTestId('code-editor-stub')).toBeInTheDocument();
    expect(screen.queryByTestId('ppl-builder-stub')).not.toBeInTheDocument();
  });

  it('opens a saved-loaded query in code mode even when parseable', () => {
    renderPanel('source = logs service="web-store"', 'saved-id');
    expect(screen.getByTestId('code-editor-stub')).toBeInTheDocument();
    expect(screen.queryByTestId('ppl-builder-stub')).not.toBeInTheDocument();
  });

  it('can switch back to Builder from Code for a representable query', () => {
    renderPanel('source = logs service="web-store"');
    expect(screen.getByTestId('ppl-builder-stub')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('stub-switch-to-code'));
    expect(screen.getByTestId('code-editor-stub')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('pplBuilderModeToggle'));
    expect(screen.getByTestId('ppl-builder-stub')).toBeInTheDocument();
    expect(screen.queryByTestId('code-editor-stub')).not.toBeInTheDocument();
  });

  it('disables the Builder toggle for an unrepresentable query in Code mode', () => {
    renderPanel('source = logs | sort field');
    expect(screen.getByTestId('code-editor-stub')).toBeInTheDocument();
    expect(screen.getByTestId('pplBuilderModeToggle')).toBeDisabled();
  });

  it('preserves partial builder work across a Code round-trip when the code is unedited', () => {
    renderPanel('service="web-store"');
    expect(screen.getByTestId('ppl-builder-stub')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('stub-add-partial-metric'));

    // Toggle to Code and back WITHOUT editing the code.
    fireEvent.click(screen.getByTestId('stub-switch-to-code'));
    fireEvent.click(screen.getByTestId('pplBuilderModeToggle'));

    // The preserved state is restored verbatim; a re-parse would drop the metric.
    const initial = JSON.parse(screen.getByTestId('stub-initial-state').textContent || '{}');
    expect(initial.aggregations).toEqual([{ id: 'ag-partial', fn: 'avg' }]);
  });

  it('preserves partial work when Monaco returns the same query with a trailing newline / CRLF', () => {
    renderPanel('service="web-store"');
    fireEvent.click(screen.getByTestId('stub-add-partial-metric'));
    fireEvent.click(screen.getByTestId('stub-switch-to-code'));

    // A trailing newline / CRLF from Monaco must NOT count as an edit: the
    // preserved snapshot should still be restored rather than lossily re-parsed.
    mockEditorText.current = 'service="web-store"\r\n';
    fireEvent.click(screen.getByTestId('pplBuilderModeToggle'));

    const initial = JSON.parse(screen.getByTestId('stub-initial-state').textContent || '{}');
    expect(initial.aggregations).toEqual([{ id: 'ag-partial', fn: 'avg' }]);
  });

  it('re-parses (dropping partial work) when the code was edited before switching back', () => {
    renderPanel('service="web-store"');
    fireEvent.click(screen.getByTestId('stub-add-partial-metric'));
    fireEvent.click(screen.getByTestId('stub-switch-to-code'));

    // Edited code no longer matches the builder's output, so it is authoritative:
    // the preserved snapshot is dropped in favor of re-parsing.
    mockEditorText.current = 'service="web-store" | stats count()';
    fireEvent.click(screen.getByTestId('pplBuilderModeToggle'));

    const initial = JSON.parse(screen.getByTestId('stub-initial-state').textContent || '{}');
    expect(initial.aggregations).toEqual([{ id: expect.any(String), fn: 'count' }]);
  });

  describe('analyze mode gating', () => {
    const noop = () => {};

    it('reports code mode via onModeChange when opening an unparseable query', () => {
      const onModeChange = jest.fn();
      // An unparseable query opens in code mode.
      renderPanel('source = logs | sort field', undefined, { onModeChange });
      expect(onModeChange).toHaveBeenLastCalledWith(true);
    });

    it('reports visual (non-code) mode via onModeChange when opening in builder', () => {
      const onModeChange = jest.fn();
      // A fresh query opens in builder mode.
      renderPanel('', undefined, { onModeChange });
      expect(onModeChange).toHaveBeenLastCalledWith(false);
    });

    it('reports the mode change when toggling between code and builder', () => {
      const onModeChange = jest.fn();
      renderPanel('source = logs service="web-store"', undefined, { onModeChange });
      // Opens in builder mode.
      expect(onModeChange).toHaveBeenLastCalledWith(false);

      fireEvent.click(screen.getByTestId('stub-switch-to-code'));
      expect(onModeChange).toHaveBeenLastCalledWith(true);

      fireEvent.click(screen.getByTestId('pplBuilderModeToggle'));
      expect(onModeChange).toHaveBeenLastCalledWith(false);
    });

    it('passes analyze props to the widgets in code mode', () => {
      // Unparseable query -> code mode.
      renderPanel('source = logs | sort field', undefined, {
        analyzeIsOpen: false,
        onToggleAnalyze: noop,
        hasAnalyzeResult: false,
      });
      expect(screen.getByTestId('widgets-analyze-enabled')).toBeInTheDocument();
    });

    it('does not pass analyze props to the widgets in visual builder mode', () => {
      // Fresh query -> builder mode, so analyze props are gated to undefined.
      renderPanel('', undefined, {
        analyzeIsOpen: false,
        onToggleAnalyze: noop,
        hasAnalyzeResult: false,
      });
      expect(screen.queryByTestId('widgets-analyze-enabled')).not.toBeInTheDocument();
    });
  });
});
