/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen } from '@testing-library/react';
import { ExploreEmbeddableComponent } from './explore_embeddable_component';
import { SearchProps } from './explore_embeddable';

jest.mock('../application/legacy/discover/opensearch_dashboards_services', () => ({
  getDocViewsRegistry: jest.fn(() => ({
    getDocViewsSorted: jest.fn(() => []),
  })),
  getServices: jest.fn(() => ({
    uiSettings: {
      get: jest.fn((key) => {
        if (key === 'discover:sampleSize') return 500;
        return false;
      }),
    },
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

jest.mock('../helpers/data_table_helper', () => ({
  getLegacyDisplayedColumns: jest.fn((columns) =>
    columns.map((col: string, idx: number) => ({
      name: col,
      displayName: col,
      isSortable: true,
      isRemoveable: true,
      colLeftIdx: idx - 1,
      colRightIdx: idx + 1,
    }))
  ),
}));

jest.mock('../components/visualizations/table/table_vis', () => ({
  TableVis: jest.fn(() => <div data-test-subj="mockTableVis">Table Visualization</div>),
}));

jest.mock('../../../visualizations/public', () => ({
  VisualizationNoResults: jest.fn(() => <div data-test-subj="mockNoResults">No results</div>),
}));

describe('ExploreEmbeddableComponent', () => {
  const mockSearchProps: SearchProps = {
    columns: ['column1', 'column2'],
    indexPattern: { id: 'test-index' } as any,
    onAddColumn: jest.fn(),
    onFilter: jest.fn(),
    onMoveColumn: jest.fn(),
    onRemoveColumn: jest.fn(),
    onReorderColumn: jest.fn(),
    onSort: jest.fn(),
    onSetColumns: jest.fn(),
    rows: [
      { _id: '1', _source: { field1: 'value1' } },
      { _id: '2', _source: { field1: 'value2' } },
    ],
    sort: [['column1', 'asc']],
    displayTimeColumn: true,
    services: {} as any,
    hits: 2,
    title: 'Test Explore',
    description: 'Test description',
    activeTab: 'logs',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders data grid table when activeTab is logs and rows exist', () => {
    render(<ExploreEmbeddableComponent searchProps={mockSearchProps} />);

    expect(screen.getByTestId('mockDataGridTable')).toBeInTheDocument();
    expect(screen.getByTestId('mockColumns')).toHaveTextContent('column1');
    expect(screen.getByTestId('mockColumns')).toHaveTextContent('column2');
  });

  test('renders chartRender output when activeTab is visualization and chartRender is provided', () => {
    const visualizationProps: SearchProps = {
      ...mockSearchProps,
      activeTab: 'visualization',
      chartRender: () => <div data-test-subj="mockChartRender">Chart Render</div>,
    };

    render(<ExploreEmbeddableComponent searchProps={visualizationProps} />);

    expect(screen.getByTestId('mockChartRender')).toBeInTheDocument();
  });

  test('renders no results when rows are empty', () => {
    const noResultsProps = {
      ...mockSearchProps,
      rows: [],
    };

    render(<ExploreEmbeddableComponent searchProps={noResultsProps} />);

    expect(screen.getByTestId('mockNoResults')).toBeInTheDocument();
  });

  test('renders with the correct data-test-subj attributes', () => {
    render(<ExploreEmbeddableComponent searchProps={mockSearchProps} />);

    expect(screen.getByTestId('embeddedSavedExplore')).toBeInTheDocument();
    expect(screen.getByTestId('osdExploreContainer')).toBeInTheDocument();
  });

  test('renders TableVis when chartType is table', () => {
    const tableProps: SearchProps = {
      ...mockSearchProps,
      activeTab: 'visualization',
      chartType: 'table' as any,
      tableData: {
        rows: [{ col1: 'val1' }],
        columns: [],
      },
    };

    render(<ExploreEmbeddableComponent searchProps={tableProps} />);

    expect(screen.getByTestId('mockTableVis')).toBeInTheDocument();
  });

  test('renders gracefully with missing optional fields in searchProps', () => {
    const minimalProps = {
      services: {} as any,
      displayTimeColumn: true,
      title: 'Minimal',
      rows: [{ _id: '1' }],
    };

    render(<ExploreEmbeddableComponent searchProps={minimalProps as any} />);

    expect(screen.getByTestId('osdExploreContainer')).toBeInTheDocument();
  });
});
