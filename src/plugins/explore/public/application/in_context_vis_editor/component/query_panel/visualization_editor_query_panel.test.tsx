/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen } from '@testing-library/react';
import QueryPanel from './visualization_editor_query_panel';
import { EditorMode, QueryExecutionStatus } from '../../../utils/state_management/types';
import { QueryPanelProps } from './query_panel_context';

// Mock child components to isolate QueryPanel/InnerQueryPanel logic
jest.mock('./query_panel_widget', () => ({
  QueryPanelWidgets: () => <div data-test-subj="mock-widgets" />,
}));
jest.mock('./query_editor', () => ({
  QueryPanelEditor: () => <div data-test-subj="mock-editor" />,
}));
jest.mock('./generated_query_panel', () => ({
  QueryPanelGeneratedQuery: () => <div data-test-subj="mock-generated-query" />,
}));
jest.mock('../../query_builder/query_builder', () => ({
  SupportLanguageType: { ppl: 'PPL', promQL: 'PROMQL', ai: 'AI' },
}));

const buildProps = (overrides: Partial<QueryPanelProps> = {}): QueryPanelProps => ({
  services: {
    data: {} as any,
    notifications: { toasts: { addError: jest.fn() } } as any,
    appName: 'explore',
    capabilities: { explore: { save: true, show: true } } as any,
  },
  queryState: { query: '', language: 'PPL', dataset: undefined },
  queryEditorState: {
    queryStatus: {
      status: QueryExecutionStatus.UNINITIALIZED,
      elapsedMs: undefined,
      startTime: undefined,
    },
    editorMode: EditorMode.Query,
    promptModeIsAvailable: false,
    promptToQueryIsLoading: false,
    isQueryEditorDirty: false,
    dateRange: undefined,
    languageType: 'PPL' as any,
  },
  onQuerySubmit: jest.fn(),
  handleQueryChange: jest.fn(),
  handleEditorChange: jest.fn(),
  showLanguageToggle: true,
  showDatasetSelect: true,
  showSaveQueryButton: false,
  getEditor: jest.fn().mockReturnValue(null),
  setEditor: jest.fn(),
  ...overrides,
});

describe('QueryPanel', () => {
  it('renders child components', () => {
    render(<QueryPanel {...buildProps()} />);
    expect(screen.getByTestId('mock-widgets')).toBeInTheDocument();
    expect(screen.getByTestId('mock-editor')).toBeInTheDocument();
    expect(screen.getByTestId('mock-generated-query')).toBeInTheDocument();
  });

  it('does not show loading indicator when status is UNINITIALIZED', () => {
    render(<QueryPanel {...buildProps()} />);
    expect(screen.queryByTestId('exploreQueryPanelIsLoading')).not.toBeInTheDocument();
  });

  it('shows loading indicator when query status is LOADING', () => {
    render(
      <QueryPanel
        {...buildProps({
          queryEditorState: {
            ...buildProps().queryEditorState,
            queryStatus: {
              status: QueryExecutionStatus.LOADING,
              elapsedMs: undefined,
              startTime: undefined,
            },
          },
        })}
      />
    );
    expect(screen.getByTestId('exploreQueryPanelIsLoading')).toBeInTheDocument();
  });

  it('shows loading indicator when promptToQueryIsLoading is true', () => {
    render(
      <QueryPanel
        {...buildProps({
          queryEditorState: {
            ...buildProps().queryEditorState,
            promptToQueryIsLoading: true,
          },
        })}
      />
    );
    expect(screen.getByTestId('exploreQueryPanelIsLoading')).toBeInTheDocument();
  });

  it('does not show loading indicator when query completes', () => {
    render(
      <QueryPanel
        {...buildProps({
          queryEditorState: {
            ...buildProps().queryEditorState,
            queryStatus: {
              status: QueryExecutionStatus.READY,
              elapsedMs: 100,
              startTime: undefined,
            },
          },
        })}
      />
    );
    expect(screen.queryByTestId('exploreQueryPanelIsLoading')).not.toBeInTheDocument();
  });
});
