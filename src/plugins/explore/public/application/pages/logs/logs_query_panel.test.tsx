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

// The data plugin's UI barrel calls withOpenSearchDashboards at import time and
// isn't needed here; stub it (keeping harmless value exports) so the selectors'
// transitive import resolves without mounting the query bar.
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
// heavy PPLBuilder component, whose module pulls in the data plugin via
// createHistogramConfigs. Re-export from the leaf modules to avoid that chain.
jest.mock('./ppl_builder', () => ({
  ...jest.requireActual('./ppl_builder/parse_ppl'),
  ...jest.requireActual('./ppl_builder/types'),
  // The builder's `</>` toggle (search-row code switch) is driven by
  // onSwitchToCode; expose it so the mode tests can switch to code. The stub also
  // surfaces the `initialState` it was mounted with (so tests can assert what
  // survives a Code round-trip) and lets a test push a builder edit whose state
  // carries partial work that buildPPL can't serialize (a fieldless metric).
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
          // A metric with no field yet compiles to nothing, so buildPPL emits
          // just the search expression — the partial work lives only in state.
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

jest.mock('../../../components/query_panel/query_panel_widgets', () => ({
  QueryPanelWidgets: () => <div data-test-subj="query-panel-widgets">Widgets</div>,
}));
jest.mock('../../../components/query_panel/query_panel_editor', () => ({
  QueryPanelEditor: () => <div data-test-subj="code-editor-stub">Code Editor</div>,
}));
jest.mock('../../../components/query_panel/query_panel_generated_query', () => ({
  QueryPanelGeneratedQuery: () => <div />,
}));
jest.mock('../../../components/query_panel/actions/ppl_execute_query_action', () => ({
  usePPLExecuteQueryAction: jest.fn(),
}));
// The run action (Cmd/Ctrl+Enter) is imported from the query_editor actions
// barrel, which transitively pulls in createHistogramConfigs (data plugin) at
// module load. Stub it to a no-op thunk so that chain isn't required here.
jest.mock('../../utils/state_management/actions/query_editor', () => ({
  onEditorRunActionCreator: jest.fn(() => () => {}),
}));
// Shared editor-text state so the Code editor round-trip is realistic: whatever
// the builder pushes via setEditorText is what getEditorText reads back on a
// Code -> Builder toggle (in the real app the editor is seeded with the
// source-less builder output). Reset per-test in beforeEach.
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

const renderPanel = (query: string, savedSearch?: string) =>
  render(
    <Provider store={makeStore(query, savedSearch)}>
      <LogsQueryPanel />
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

    // The builder's `</>` toggle switches to code.
    fireEvent.click(screen.getByTestId('stub-switch-to-code'));
    expect(screen.getByTestId('code-editor-stub')).toBeInTheDocument();

    // In code mode the `</>` toggle (pinned top-right) switches back to builder;
    // the query is still representable, so it is enabled.
    fireEvent.click(screen.getByTestId('pplBuilderModeToggle'));
    expect(screen.getByTestId('ppl-builder-stub')).toBeInTheDocument();
    expect(screen.queryByTestId('code-editor-stub')).not.toBeInTheDocument();
  });

  it('disables the Builder toggle for an unrepresentable query in Code mode', () => {
    renderPanel('source = logs | sort field');
    expect(screen.getByTestId('code-editor-stub')).toBeInTheDocument();
    // The `</>` toggle is rendered but disabled (query can't round-trip).
    expect(screen.getByTestId('pplBuilderModeToggle')).toBeDisabled();
  });

  it('preserves partial builder work across a Code round-trip when the code is unedited', () => {
    renderPanel('service="web-store"');
    expect(screen.getByTestId('ppl-builder-stub')).toBeInTheDocument();

    // Build partial work that buildPPL can't serialize: a metric with no field.
    // The emitted query is just the search expression; the fieldless metric lives
    // only in the builder state.
    fireEvent.click(screen.getByTestId('stub-add-partial-metric'));

    // Toggle to Code and back WITHOUT editing the code.
    fireEvent.click(screen.getByTestId('stub-switch-to-code'));
    fireEvent.click(screen.getByTestId('pplBuilderModeToggle'));

    // The builder remounts with the preserved state verbatim — the fieldless
    // metric is still there (a re-parse of the code would have dropped it).
    const initial = JSON.parse(screen.getByTestId('stub-initial-state').textContent || '{}');
    expect(initial.aggregations).toEqual([{ id: 'ag-partial', fn: 'avg' }]);
  });

  it('preserves partial work when Monaco returns the same query with a trailing newline / CRLF', () => {
    renderPanel('service="web-store"');
    fireEvent.click(screen.getByTestId('stub-add-partial-metric'));
    fireEvent.click(screen.getByTestId('stub-switch-to-code'));

    // Monaco can hand the text back with a different EOL or a trailing newline
    // even when the user didn't edit it. That must NOT be treated as an edit:
    // the preserved snapshot (with the fieldless metric) should still be
    // restored rather than falling into the lossy re-parse.
    mockEditorText.current = 'service="web-store"\r\n';
    fireEvent.click(screen.getByTestId('pplBuilderModeToggle'));

    const initial = JSON.parse(screen.getByTestId('stub-initial-state').textContent || '{}');
    expect(initial.aggregations).toEqual([{ id: 'ag-partial', fn: 'avg' }]);
  });

  it('re-parses (dropping partial work) when the code was edited before switching back', () => {
    renderPanel('service="web-store"');
    fireEvent.click(screen.getByTestId('stub-add-partial-metric'));
    fireEvent.click(screen.getByTestId('stub-switch-to-code'));

    // Simulate the user editing the code so it no longer matches the builder's
    // last output. The preserved snapshot must NOT be restored — the edited code
    // is now authoritative, so the fieldless metric is gone.
    mockEditorText.current = 'service="web-store" | stats count()';
    fireEvent.click(screen.getByTestId('pplBuilderModeToggle'));

    const initial = JSON.parse(screen.getByTestId('stub-initial-state').textContent || '{}');
    expect(initial.aggregations).toEqual([{ id: expect.any(String), fn: 'count' }]);
  });
});
