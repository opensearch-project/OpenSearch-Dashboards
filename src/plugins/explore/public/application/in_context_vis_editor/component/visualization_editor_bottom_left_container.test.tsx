/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen } from '@testing-library/react';
import { ResizableQueryPanelAndVisualization } from './visualization_editor_bottom_left_container';
import { QueryExecutionStatus } from '../../utils/state_management/types';
import { useQueryBuilderState } from '../hooks/use_query_builder_state';
import { useVisualizationBuilder } from '../hooks/use_visualization_builder';

jest.mock('../hooks/use_query_builder_state', () => ({ useQueryBuilderState: jest.fn() }));
jest.mock('../hooks/use_visualization_builder', () => ({ useVisualizationBuilder: jest.fn() }));
jest.mock('../../../components/query_panel/utils/use_search_context', () => ({
  useSearchContext: jest.fn().mockReturnValue({}),
}));
jest.mock('./editor_panel', () => ({
  EditorPanel: ({ children }: any) => <div data-test-subj="editor-panel">{children}</div>,
}));
jest.mock('./vis_editor_uninitialized', () => ({
  VisEditorUninitialized: () => <div data-test-subj="vis-uninitialized" />,
}));
jest.mock('./vis_editor_no_results', () => ({
  VisEditorNoResults: () => <div data-test-subj="vis-no-results" />,
}));
jest.mock('./vis_editor_loading_state', () => ({
  VisEditorLoadingState: () => <div data-test-subj="vis-loading" />,
}));
jest.mock('../component/query_panel/visualization_editor_query_panel', () => ({
  __esModule: true,
  default: () => <div data-test-subj="query-panel" />,
}));
jest.mock('../../../components/tabs/error_guard/error_code_block', () => ({
  ErrorCodeBlock: ({ title, text }: any) => (
    <div data-test-subj={`error-code-block-${title}`}>{text}</div>
  ),
}));
jest.mock('../query_builder/query_builder', () => ({}));
jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: jest.fn((key, options) => options.defaultMessage),
  },
}));

const mockQueryEditorState$ = { getValue: jest.fn() };
const mockQueryBuilder = {
  queryEditorState$: mockQueryEditorState$,
};

const buildState = (options: Record<string, any>) => ({
  queryEditorState: { queryStatus: options },
  queryBuilder: mockQueryBuilder,
  resultState: undefined,
});

beforeEach(() => {
  jest.clearAllMocks();
  (useVisualizationBuilder as jest.Mock).mockReturnValue({
    visualizationBuilderForEditor: {
      handleData: jest.fn(),
      renderVisualization: jest.fn().mockReturnValue(<div data-test-subj="visualization" />),
    },
  });
});

describe('ResizableQueryPanelAndVisualization', () => {
  it('renders QueryPanel', () => {
    (useQueryBuilderState as jest.Mock).mockReturnValue(
      buildState({ status: QueryExecutionStatus.UNINITIALIZED })
    );
    render(<ResizableQueryPanelAndVisualization />);
    expect(screen.getByTestId('query-panel')).toBeInTheDocument();
  });

  it('renders VisEditorUninitialized when status is UNINITIALIZED', () => {
    (useQueryBuilderState as jest.Mock).mockReturnValue(
      buildState({ status: QueryExecutionStatus.UNINITIALIZED })
    );
    render(<ResizableQueryPanelAndVisualization />);
    expect(screen.getByTestId('vis-uninitialized')).toBeInTheDocument();
  });

  it('renders VisEditorNoResults when status is NO_RESULTS', () => {
    (useQueryBuilderState as jest.Mock).mockReturnValue(
      buildState({ status: QueryExecutionStatus.NO_RESULTS })
    );
    render(<ResizableQueryPanelAndVisualization />);
    expect(screen.getByTestId('vis-no-results')).toBeInTheDocument();
  });

  it('renders VisEditorLoadingState when status is LOADING', () => {
    (useQueryBuilderState as jest.Mock).mockReturnValue(
      buildState({ status: QueryExecutionStatus.LOADING })
    );
    render(<ResizableQueryPanelAndVisualization />);
    expect(screen.getByTestId('vis-loading')).toBeInTheDocument();
  });

  it('renders error panel when status is ERROR', () => {
    (useQueryBuilderState as jest.Mock).mockReturnValue(
      buildState({
        status: QueryExecutionStatus.ERROR,
        error: {
          message: { reason: 'Query failed', details: 'syntax error', type: 'error' },
        },
      })
    );
    render(<ResizableQueryPanelAndVisualization />);
    expect(screen.getByText('Query failed')).toBeInTheDocument();
    expect(screen.getByTestId('error-code-block-Details')).toBeInTheDocument();
    expect(screen.getByTestId('error-code-block-Type')).toBeInTheDocument();
  });

  it('renders VisualizationContainer when status is READY', () => {
    (useQueryBuilderState as jest.Mock).mockReturnValue(
      buildState({ status: QueryExecutionStatus.READY })
    );
    render(<ResizableQueryPanelAndVisualization />);
    expect(screen.getByTestId('visualization')).toBeInTheDocument();
  });
});
