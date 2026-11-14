/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen } from '@testing-library/react';
import { ExploreEmbeddableComponent } from './explore_embeddable_component';
import { SearchProps } from './explore_embeddable';

// Settings the panel reads; tests override entries and `beforeEach` resets them.
const mockUiSettings: Record<string, unknown> = {};

// One services object, as the real getServices returns, so a memo on it behaves as in the app.
const mockServices = {
  uiSettings: {
    get: jest.fn((key: string) => {
      if (key === 'discover:sampleSize') return 500;
      return key in mockUiSettings ? mockUiSettings[key] : false;
    }),
  },
};

jest.mock('../application/legacy/discover/opensearch_dashboards_services', () => ({
  getDocViewsRegistry: jest.fn(() => ({
    getDocViewsSorted: jest.fn(() => []),
  })),
  getServices: jest.fn(() => mockServices),
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
  VisualizationRequestError: jest.fn(({ error }) => (
    <div data-test-subj="mockRequestError">{error}</div>
  )),
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
    services: {} as any,
    hits: 2,
    title: 'Test Explore',
    description: 'Test description',
    activeTab: 'logs',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockUiSettings).forEach((key) => delete mockUiSettings[key]);
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

  describe('while the query runs', () => {
    // The loading state is for a dataset that needs an explicit Run.
    const explicitRunProps: SearchProps = { ...mockSearchProps, requiresExplicitRun: true };

    test('shows a loading state, not "No results", before the first run settles', () => {
      render(
        <ExploreEmbeddableComponent
          searchProps={{ ...explicitRunProps, rows: [], isLoading: true }}
        />
      );

      expect(screen.getByTestId('exploreEmbeddableLoading')).toBeInTheDocument();
      expect(screen.queryByTestId('mockNoResults')).not.toBeInTheDocument();
    });

    test('shows the results once the run settles', () => {
      const { rerender } = render(
        <ExploreEmbeddableComponent
          searchProps={{ ...explicitRunProps, rows: [], isLoading: true }}
        />
      );
      rerender(
        <ExploreEmbeddableComponent searchProps={{ ...explicitRunProps, isLoading: false }} />
      );

      expect(screen.queryByTestId('exploreEmbeddableLoading')).not.toBeInTheDocument();
      expect(screen.getByTestId('mockDataGridTable')).toBeInTheDocument();
    });

    test('shows "No results" only once a run returned nothing', () => {
      const { rerender } = render(
        <ExploreEmbeddableComponent
          searchProps={{ ...explicitRunProps, rows: [], isLoading: true }}
        />
      );
      rerender(
        <ExploreEmbeddableComponent
          searchProps={{ ...explicitRunProps, rows: [], isLoading: false }}
        />
      );

      expect(screen.queryByTestId('exploreEmbeddableLoading')).not.toBeInTheDocument();
      expect(screen.getByTestId('mockNoResults')).toBeInTheDocument();
    });

    test('keeps the previous results on screen while a refresh runs', () => {
      render(<ExploreEmbeddableComponent searchProps={{ ...explicitRunProps, isLoading: true }} />);

      expect(screen.queryByTestId('exploreEmbeddableLoading')).not.toBeInTheDocument();
      expect(screen.getByTestId('mockDataGridTable')).toBeInTheDocument();
    });

    test('shows an error rather than the loading state', () => {
      render(
        <ExploreEmbeddableComponent
          searchProps={{
            ...explicitRunProps,
            rows: [],
            isLoading: true,
            error: { name: 'Error', message: 'failed' },
          }}
        />
      );

      expect(screen.getByTestId('mockRequestError')).toBeInTheDocument();
    });

    test('shows "No results" while loading for another dataset, as before', () => {
      render(
        <ExploreEmbeddableComponent
          searchProps={{ ...mockSearchProps, rows: [], isLoading: true }}
        />
      );

      expect(screen.queryByTestId('exploreEmbeddableLoading')).not.toBeInTheDocument();
      expect(screen.getByTestId('mockNoResults')).toBeInTheDocument();
    });
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

  test('passes dashboard variables to the table visualization', () => {
    const { TableVis } = jest.requireMock('../components/visualizations/table/table_vis');
    (TableVis as jest.Mock).mockClear();
    const variables = [{ name: 'service', value: 'checkout' }];

    render(
      <ExploreEmbeddableComponent
        searchProps={{
          ...mockSearchProps,
          activeTab: 'visualization',
          chartType: 'table' as any,
          tableData: { rows: [{ col1: 'val1' }], columns: [] },
          variables,
        }}
      />
    );

    expect((TableVis as jest.Mock).mock.calls[0][0].variables).toBe(variables);
  });

  test('renders gracefully with missing optional fields in searchProps', () => {
    const minimalProps = {
      services: {} as any,
      title: 'Minimal',
      rows: [{ _id: '1' }],
    };

    render(<ExploreEmbeddableComponent searchProps={minimalProps as any} />);

    expect(screen.getByTestId('osdExploreContainer')).toBeInTheDocument();
  });

  test('renders error message when searchProps.error is present', () => {
    const errorProps: SearchProps = {
      ...mockSearchProps,
      error: {
        name: 'QueryError',
        message: 'PPL query failed: syntax error',
      },
    };

    render(<ExploreEmbeddableComponent searchProps={errorProps} />);

    expect(screen.getByTestId('mockRequestError')).toBeInTheDocument();
    expect(screen.getByTestId('mockRequestError')).toHaveTextContent(
      'PPL query failed: syntax error'
    );
  });

  test('shows error instead of old data when error occurs', () => {
    const errorPropsWithOldData: SearchProps = {
      ...mockSearchProps,
      error: {
        name: 'Error',
        message: 'Failed to execute query',
      },
      rows: [{ _id: '1', _source: { field1: 'value1' } }],
      tableData: {
        rows: [{ col1: 'val1' }],
        columns: [],
      },
    };

    render(<ExploreEmbeddableComponent searchProps={errorPropsWithOldData} />);

    // Should show error, not the table or old data
    expect(screen.getByTestId('mockRequestError')).toBeInTheDocument();
    expect(screen.queryByTestId('mockDataGridTable')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mockTableVis')).not.toBeInTheDocument();
  });

  describe('logs table columns', () => {
    // Discover's column processing is for a dataset that needs an explicit Run.
    const explicitRunProps: SearchProps = { ...mockSearchProps, requiresExplicitRun: true };

    // A dataset whose mapping knows only the time field, like one that isn't an index pattern
    // and learns its fields from the results.
    const createDataset = (fieldNames: string[] = ['@timestamp']) =>
      ({
        id: 'logs-dataset',
        timeFieldName: '@timestamp',
        fields: {
          getAll: () => fieldNames.map((name) => ({ name })),
          getByName: (name: string) => (fieldNames.includes(name) ? { name } : undefined),
        },
        getFieldByName: (name: string) => (fieldNames.includes(name) ? { name } : undefined),
        flattenHit: (hit: any) => ({ ...hit._source }),
      }) as any;

    const logRows = [
      { _id: '1', _source: { '@timestamp': '2026-01-01T00:00:00Z', '@message': 'first' } },
      { _id: '2', _source: { '@timestamp': '2026-01-01T00:01:00Z', '@message': 'second' } },
    ];

    const renderedColumnNames = () =>
      JSON.parse(screen.getByTestId('mockColumns').textContent || '[]').map(
        (column: { name: string }) => column.name
      );

    beforeEach(() => {
      mockUiSettings.defaultColumns = ['_source'];
      mockUiSettings['discover:modifyColumnsOnSwitch'] = true;
    });

    test('falls back to _source when no saved column is in the dataset or the results', () => {
      render(
        <ExploreEmbeddableComponent
          searchProps={{
            ...explicitRunProps,
            indexPattern: createDataset(),
            columns: ['body', 'severityText', 'resource.attributes.service.name'],
            rows: logRows,
          }}
        />
      );

      expect(renderedColumnNames()).toEqual(['_source']);
    });

    test('keeps a saved column that the results carry, even if the dataset does not map it', () => {
      render(
        <ExploreEmbeddableComponent
          searchProps={{
            ...explicitRunProps,
            indexPattern: createDataset(),
            columns: ['body', '@message'],
            rows: logRows,
          }}
        />
      );

      expect(renderedColumnNames()).toEqual(['@message']);
    });

    test('keeps saved columns that the dataset maps', () => {
      render(
        <ExploreEmbeddableComponent
          searchProps={{
            ...explicitRunProps,
            indexPattern: createDataset(['@timestamp', 'level', 'service']),
            columns: ['level', 'service'],
            rows: [{ _id: '1', _source: { '@timestamp': '2026-01-01T00:00:00Z', level: 'ERROR' } }],
          }}
        />
      );

      expect(renderedColumnNames()).toEqual(['level', 'service']);
    });

    test('keeps every saved column when columns are not adjusted to the dataset', () => {
      mockUiSettings['discover:modifyColumnsOnSwitch'] = false;

      render(
        <ExploreEmbeddableComponent
          searchProps={{
            ...explicitRunProps,
            indexPattern: createDataset(),
            columns: ['body', 'severityText'],
            rows: logRows,
          }}
        />
      );

      expect(renderedColumnNames()).toEqual(['body', 'severityText']);
    });

    test('follows rows and columns set on the same searchProps object, as the embeddable does', () => {
      // The embeddable renders while loading (no rows yet), then writes the rows, and a column
      // change, onto the one searchProps object it renders again.
      const rows = [
        {
          _id: '1',
          _source: { '@timestamp': '2026-01-01T00:00:00Z', '@message': 'a', level: 'E' },
        },
      ];
      const searchProps: SearchProps = {
        ...explicitRunProps,
        indexPattern: createDataset(),
        columns: ['body', '@message'],
        rows: [],
      };
      const { rerender } = render(<ExploreEmbeddableComponent searchProps={searchProps} />);

      searchProps.rows = rows;
      rerender(<ExploreEmbeddableComponent searchProps={searchProps} />);
      expect(renderedColumnNames()).toEqual(['@message']);

      searchProps.columns = ['@message', 'level'];
      rerender(<ExploreEmbeddableComponent searchProps={searchProps} />);
      expect(renderedColumnNames()).toEqual(['@message', 'level']);

      searchProps.columns = ['level'];
      rerender(<ExploreEmbeddableComponent searchProps={searchProps} />);
      expect(renderedColumnNames()).toEqual(['level']);
    });

    test('honours the hide-time-column and short-dots settings', () => {
      const { getLegacyDisplayedColumns } = jest.requireMock('../helpers/data_table_helper');
      mockUiSettings['doc_table:hideTimeColumn'] = true;
      mockUiSettings['shortDots:enable'] = false;

      render(
        <ExploreEmbeddableComponent
          searchProps={{ ...explicitRunProps, indexPattern: createDataset(), rows: logRows }}
        />
      );

      const [, , isShortDots, hideTimeField] = (getLegacyDisplayedColumns as jest.Mock).mock
        .calls[0];
      expect(isShortDots).toBe(false);
      expect(hideTimeField).toBe(true);
    });

    describe('for another dataset, as before', () => {
      test('shows the saved columns, including ones the dataset and results lack', () => {
        render(
          <ExploreEmbeddableComponent
            searchProps={{
              ...mockSearchProps,
              indexPattern: createDataset(),
              columns: ['body', 'severityText'],
              rows: logRows,
            }}
          />
        );

        expect(renderedColumnNames()).toEqual(['body', 'severityText']);
      });

      test('passes displayTimeColumn to getLegacyDisplayedColumns', () => {
        const { getLegacyDisplayedColumns } = jest.requireMock('../helpers/data_table_helper');
        const indexPattern = createDataset();
        const columns = ['body'];

        const { rerender } = render(
          <ExploreEmbeddableComponent
            searchProps={{ ...mockSearchProps, indexPattern, columns, displayTimeColumn: true }}
          />
        );
        expect(getLegacyDisplayedColumns).toHaveBeenLastCalledWith(
          columns,
          indexPattern,
          false,
          false
        );

        rerender(
          <ExploreEmbeddableComponent
            searchProps={{ ...mockSearchProps, indexPattern, columns, displayTimeColumn: false }}
          />
        );
        expect(getLegacyDisplayedColumns).toHaveBeenLastCalledWith(
          columns,
          indexPattern,
          true,
          false
        );
      });
    });
  });
});
