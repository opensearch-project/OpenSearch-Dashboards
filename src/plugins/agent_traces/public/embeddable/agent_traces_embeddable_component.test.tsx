/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { AgentTracesEmbeddableComponent } from './agent_traces_embeddable_component';
import { SearchProps } from './agent_traces_embeddable';

// Mock the services
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
    expressions: {
      ReactExpressionRenderer: jest.fn(({ expression, searchContext }) => (
        <div data-test-subj="mockExpressionRenderer">
          <div data-test-subj="mockExpression">{expression}</div>
          <div data-test-subj="mockSearchContext">{JSON.stringify(searchContext)}</div>
        </div>
      )),
    },
  })),
}));

// Mock the DataTable component
jest.mock('../components/data_table/data_table', () => ({
  DataTable: jest.fn((props) => (
    <div data-test-subj="mockDataGridTable">
      <div data-test-subj="mockColumns">{JSON.stringify(props.columns)}</div>
      <div data-test-subj="mockRows">{JSON.stringify(props.rows)}</div>
    </div>
  )),
}));

// Mock the helper functions
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

// Mock the VisualizationNoResults component
jest.mock('../../../visualizations/public', () => ({
  VisualizationNoResults: jest.fn(() => <div data-test-subj="mockNoResults">No results</div>),
}));

describe('AgentTracesEmbeddableComponent', () => {
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
    title: 'Test Agent Traces',
    description: 'Test description',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders data grid table when activeTab is logs and rows exist', () => {
    render(<AgentTracesEmbeddableComponent searchProps={mockSearchProps} />);

    // Check if the data grid table is rendered
    expect(screen.getByTestId('mockDataGridTable')).toBeInTheDocument();
    expect(screen.getByTestId('mockColumns')).toHaveTextContent('column1');
    expect(screen.getByTestId('mockColumns')).toHaveTextContent('column2');
  });

  test('renders no results when rows are empty', () => {
    const noResultsProps = {
      ...mockSearchProps,
      rows: [],
    };

    render(<AgentTracesEmbeddableComponent searchProps={noResultsProps} />);

    // Check if the no results component is rendered
    expect(screen.getByTestId('mockNoResults')).toBeInTheDocument();
  });

  test('renders wreith the correct data-test-subj attributes', () => {
    render(<AgentTracesEmbeddableComponent searchProps={mockSearchProps} />);

    // Check if the container has the correct data-test-subj
    expect(screen.getByTestId('embeddedSavedAgentTraces')).toBeInTheDocument();
    expect(screen.getByTestId('osdAgentTracesContainer')).toBeInTheDocument();
  });

  test('renders gracefully with missing optional fields in searchProps', () => {
    const minimalProps = {
      services: {} as any,
      displayTimeColumn: true,
      title: 'Minimal',
      rows: [{ _id: '1' }],
    };
    render(<AgentTracesEmbeddableComponent searchProps={minimalProps as any} />);
    expect(screen.getByTestId('osdAgentTracesContainer')).toBeInTheDocument();
  });
});
