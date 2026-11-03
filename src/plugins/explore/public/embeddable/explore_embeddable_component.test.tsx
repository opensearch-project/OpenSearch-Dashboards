/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen } from '@testing-library/react';
import { ExploreEmbeddableComponent } from './explore_embeddable_component';
import { ExploreEmbeddableContent, ExploreEmbeddableViewProps } from './explore_embeddable_state';
import { CommonVisualizationRender } from '../components/visualizations/visualization_render';

jest.mock('../application/legacy/discover/opensearch_dashboards_services', () => ({
  getDocViewsRegistry: jest.fn(() => ({
    getDocViewsSorted: jest.fn(() => []),
  })),
}));

jest.mock('../components/data_table/data_table', () => ({
  DataTable: jest.fn((props) => (
    <div data-test-subj="mockDataGridTable">
      <div data-test-subj="mockColumns">{JSON.stringify(props.columns)}</div>
      <div data-test-subj="mockRows">{JSON.stringify(props.rows)}</div>
    </div>
  )),
}));

jest.mock('../components/visualizations/table/table_vis', () => ({
  TableVis: jest.fn(() => <div data-test-subj="mockTableVis">Table Visualization</div>),
}));

jest.mock('../components/visualizations/visualization_render', () => ({
  CommonVisualizationRender: jest.fn(() => (
    <div data-test-subj="mockChartRender">Chart Visualization</div>
  )),
}));

jest.mock('../helpers/data_table_helper', () => ({
  getLegacyDisplayedColumns: jest.fn((columns) =>
    columns.map((column: string, index: number) => ({
      name: column,
      displayName: column,
      isSortable: true,
      isRemoveable: true,
      colLeftIdx: index - 1,
      colRightIdx: index + 1,
    }))
  ),
}));

jest.mock('../../../visualizations/public', () => ({
  VisualizationNoResults: jest.fn(() => <div data-test-subj="mockNoResults">No results</div>),
  VisualizationRequestError: jest.fn(({ error }) => (
    <div data-test-subj="mockRequestError">{error}</div>
  )),
}));

describe('ExploreEmbeddableComponent', () => {
  const onAddColumn = jest.fn();
  const onRemoveColumn = jest.fn();
  const onFilter = jest.fn();
  const onSelectTimeRange = jest.fn();

  const logContent: ExploreEmbeddableContent = {
    kind: 'logs',
    dataset: { id: 'test-index' } as any,
    sampleSize: 500,
    rows: [
      {
        _index: 'test-index',
        _id: '1',
        _score: null,
        _source: { field1: 'value1' },
      },
      {
        _index: 'test-index',
        _id: '2',
        _score: null,
        _source: { field1: 'value2' },
      },
    ],
    hits: 2,
  };

  const chartContent: ExploreEmbeddableContent = {
    kind: 'chart',
    query: {
      language: 'SQL',
      dataset: { id: 'panel-dataset', type: 'INDEXES', title: 'logs' },
    },
    data: {
      transformedData: [{ value: 10 }],
      numericalColumns: [],
      categoricalColumns: [],
      dateColumns: [],
      unknownColumns: [],
    },
    config: {
      type: 'bar',
      styles: {} as any,
    },
    timeRange: { from: 'now-15m', to: 'now' },
  };

  const renderView = (
    state: ExploreEmbeddableViewProps['state'],
    overrides: Partial<ExploreEmbeddableViewProps> = {}
  ) =>
    render(
      <ExploreEmbeddableComponent
        state={state}
        selectedColumns={['column1', 'column2']}
        hideTimeColumn={false}
        onAddColumn={onAddColumn}
        onRemoveColumn={onRemoveColumn}
        onFilter={onFilter}
        onSelectTimeRange={onSelectTimeRange}
        {...overrides}
      />
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders log content from a ready state', () => {
    renderView({ status: 'ready', content: logContent });

    expect(screen.getByTestId('mockDataGridTable')).toBeInTheDocument();
    expect(screen.getByTestId('mockColumns')).toHaveTextContent('column1');
    expect(screen.getByTestId('mockColumns')).toHaveTextContent('column2');
  });

  test('renders chart content from a ready state', () => {
    renderView({ status: 'ready', content: chartContent });

    expect(screen.getByTestId('mockChartRender')).toBeInTheDocument();
    expect(CommonVisualizationRender).toHaveBeenCalledWith(
      expect.objectContaining({ query: chartContent.query }),
      expect.anything()
    );
  });

  test('renders table content from a ready state', () => {
    const tableContent: ExploreEmbeddableContent = {
      kind: 'table',
      rows: [{ col1: 'val1' }],
      columns: [],
      config: {
        type: 'table',
        styles: {} as any,
      },
    };

    renderView({ status: 'ready', content: tableContent });

    expect(screen.getByTestId('mockTableVis')).toBeInTheDocument();
  });

  test('renders no results for empty ready content', () => {
    renderView({
      status: 'ready',
      content: { ...logContent, rows: [], hits: 0 },
    });

    expect(screen.getByTestId('mockNoResults')).toBeInTheDocument();
  });

  test('renders an error instead of content', () => {
    renderView({
      status: 'error',
      error: {
        name: 'QueryError',
        message: 'PPL query failed: syntax error',
      },
    });

    expect(screen.getByTestId('mockRequestError')).toHaveTextContent(
      'PPL query failed: syntax error'
    );
    expect(screen.queryByTestId('mockDataGridTable')).not.toBeInTheDocument();
  });
});
