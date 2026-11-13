/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { act, render, screen } from '@testing-library/react';
import { ResizableQueryPanelAndVisualization } from './visualization_editor_bottom_left_container';
import { QueryExecutionStatus } from '../../utils/state_management/types';
import { useQueryBuilderState } from '../hooks/use_query_builder_state';
import { useVisualizationBuilder } from '../hooks/use_visualization_builder';
import { BehaviorSubject } from 'rxjs';

// The vis status now comes from the container's aggregate status, not the selected row.
const mockAggregateStatus$ = new BehaviorSubject<any>({
  status: 'UNINITIALIZED',
  failedQueries: [],
});
// One stable container, as the real Provider gives.
const mockSeries$ = new BehaviorSubject<any[]>([]);
const mockContainer = {
  getAggregateStatus$: () => mockAggregateStatus$,
  // getSeriesResult$: () => new BehaviorSubject([]),
  getSeriesResult$: () => mockSeries$,
};
// The raw table: render its rows so a test can read the cells.
jest.mock('../../../components/visualizations/table/table_vis', () => ({
  TableVis: ({ rows }: { rows: Array<Record<string, unknown>> }) => (
    <pre data-test-subj="raw-table">{JSON.stringify(rows)}</pre>
  ),
}));
jest.mock('../multi_query_builder/multi_query_builder_context', () => ({
  useMultiQueryBuilder: () => mockContainer,
}));
jest.mock('../hooks/use_query_builder_state', () => ({ useQueryBuilderState: jest.fn() }));
jest.mock('../hooks/use_visualization_builder', () => ({ useVisualizationBuilder: jest.fn() }));

jest.mock('../../../components/data_transformations', () => {
  const mockObs = {
    subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
    getValue: jest.fn().mockReturnValue([]),
  };
  const mockMapObs = {
    subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
    getValue: jest.fn().mockReturnValue(new Map()),
  };
  return {
    useTransformationService: jest.fn().mockReturnValue({
      clearPipeline: jest.fn(),
      pipeline$: mockObs,
      getPipeline$: () => mockObs,
      stageFields$: mockMapObs,
    }),
    TransformPanel: () => null,
  };
});
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
jest.mock('./visualization_editor_query_workspace/query_workspace', () => ({
  QueryWorkspace: () => <div data-test-subj="query-workspace" />,
}));
jest.mock('../../../components/tabs/error_guard/error_code_block', () => ({
  ErrorCodeBlock: ({ title, text }: any) => (
    <div data-test-subj={`error-code-block-${title}`}>{text}</div>
  ),
}));
jest.mock('../query_builder/query_builder', () => ({}));
jest.mock('../visualization_editor.scss', () => ({}), { virtual: true });
jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: jest.fn((key, options) => options.defaultMessage),
  },
}));

const mockQueryEditorState$ = { getValue: jest.fn() };
const mockResultState$ = { subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }) };
const mockQueryBuilder = {
  queryEditorState$: mockQueryEditorState$,
  resultState$: mockResultState$,
  updateQueryEditorState: jest.fn(),
};

// const buildState = (options: Record<string, any>) => ({
//   queryEditorState: { queryStatus: options },
//   queryBuilder: mockQueryBuilder,
//   resultState: undefined,
// });
const buildState = (options: Record<string, any>) => {
  mockAggregateStatus$.next({ failedQueries: [], ...options });
  return { queryBuilder: mockQueryBuilder, container: mockContainer, resultState: undefined };
};

beforeEach(() => {
  jest.clearAllMocks();
  mockSeries$.next([]);
  (useVisualizationBuilder as jest.Mock).mockReturnValue({
    visualizationBuilderForEditor: {
      handleData: jest.fn(),
      handleSeries: jest.fn(),
      renderVisualization: jest.fn().mockReturnValue(<div data-test-subj="visualization" />),
      showRawTable$: new BehaviorSubject(false),
      rawTableRefId$: new BehaviorSubject(undefined),
      rawTableStage$: new BehaviorSubject('before'),
      pipelineResult$: new BehaviorSubject(undefined),
      data$: new BehaviorSubject(undefined),
      setQueryField: jest.fn(),
    },
  });
});

describe('ResizableQueryPanelAndVisualization', () => {
  it('renders QueryWorkspace', () => {
    (useQueryBuilderState as jest.Mock).mockReturnValue(
      buildState({ status: QueryExecutionStatus.UNINITIALIZED })
    );
    render(<ResizableQueryPanelAndVisualization />);
    expect(screen.getByTestId('query-workspace')).toBeInTheDocument();
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
      // buildState({
      //   status: QueryExecutionStatus.ERROR,
      //   error: {
      //     message: { reason: 'Query failed', details: 'syntax error', type: 'error' },
      //   },
      // })
      buildState({
        status: QueryExecutionStatus.ERROR,
        failedQueries: [
          {
            refId: 'A',
            error: { message: { reason: 'Query failed', details: 'syntax error', type: 'error' } },
          },
        ],
      })
    );
    render(<ResizableQueryPanelAndVisualization />);
    // expect(screen.getByText('Query failed')).toBeInTheDocument();
    expect(screen.getByText('Query A: Query failed')).toBeInTheDocument();
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

  it("shows the raw table's cells from each hit's _source", () => {
    (useVisualizationBuilder as jest.Mock).mockReturnValue({
      visualizationBuilderForEditor: {
        handleData: jest.fn(),
        handleSeries: jest.fn(),
        renderVisualization: jest.fn().mockReturnValue(<div data-test-subj="visualization" />),
        showRawTable$: new BehaviorSubject(true),
        rawTableRefId$: new BehaviorSubject('B'),
        rawTableStage$: new BehaviorSubject('before'),
        pipelineResult$: new BehaviorSubject(undefined),
        data$: new BehaviorSubject(undefined),
        setQueryField: jest.fn(),
      },
    });
    mockSeries$.next([
      {
        refId: 'B',
        // rows: [{ _index: 'i', _id: '1', _source: { Series: 'up', Value: 1 } }],
        // Series rows are flattened.
        rows: [{ Series: 'up', Value: 1 }],
        fieldSchema: [
          { name: 'Series', type: 'string' },
          { name: 'Value', type: 'number' },
        ],
      },
    ]);
    (useQueryBuilderState as jest.Mock).mockReturnValue(
      buildState({ status: QueryExecutionStatus.READY })
    );
    render(<ResizableQueryPanelAndVisualization />);

    expect(JSON.parse(screen.getByTestId('raw-table').textContent ?? '[]')).toEqual([
      { Series: 'up', Value: 1 },
    ]);
  });

  it('hands every visible query to the vis, and nothing before a result', () => {
    const handleSeries = jest.fn();
    (useVisualizationBuilder as jest.Mock).mockReturnValue({
      visualizationBuilderForEditor: {
        handleData: jest.fn(),
        handleSeries,
        renderVisualization: jest.fn().mockReturnValue(<div data-test-subj="visualization" />),
        showRawTable$: new BehaviorSubject(false),
        rawTableRefId$: new BehaviorSubject(undefined),
        rawTableStage$: new BehaviorSubject('before'),
        pipelineResult$: new BehaviorSubject(undefined),
        data$: new BehaviorSubject(undefined),
      },
    });
    (useQueryBuilderState as jest.Mock).mockReturnValue(
      buildState({ status: QueryExecutionStatus.READY })
    );
    render(<ResizableQueryPanelAndVisualization />);
    // No result yet: empty data would turn the chart into a table for good.
    expect(handleSeries).not.toHaveBeenCalled();

    const series = [
      { refId: 'A', rows: [{ Value: 1 }], fieldSchema: [] },
      { refId: 'B', rows: [{ Value: 2 }], fieldSchema: [] },
    ];
    act(() => mockSeries$.next(series));
    expect(handleSeries).toHaveBeenLastCalledWith(series);
  });
});
