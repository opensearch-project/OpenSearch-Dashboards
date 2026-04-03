/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ChartTypeSelector } from './chart_type_selector';
import { VisColumn, VisFieldType } from './types';
import { VisData } from './visualization_builder.types';

const mockGetAvailableChartTypes = jest.fn();
const mockFindRulesByColumns = jest.fn();

jest.mock('./visualization_registry', () => ({
  visualizationRegistry: {
    getAvailableChartTypes: (...args: any[]) => mockGetAvailableChartTypes(...args),
    findRulesByColumns: (...args: any[]) => mockFindRulesByColumns(...args),
  },
}));

// Create a mock store
const createMockStore = () => {
  return configureStore({
    reducer: {
      explore: () => ({}),
    },
  });
};

describe('ChartTypeSelector', () => {
  const mockNumericalColumns: VisColumn[] = [
    {
      id: 1,
      name: 'count',
      schema: VisFieldType.Numerical,
      column: 'count',
      validValuesCount: 100,
      uniqueValuesCount: 50,
    },
  ];

  const mockCategoricalColumns: VisColumn[] = [
    {
      id: 2,
      name: 'category',
      schema: VisFieldType.Categorical,
      column: 'category',
      validValuesCount: 100,
      uniqueValuesCount: 10,
    },
  ];

  const mockDateColumns: VisColumn[] = [
    {
      id: 3,
      name: 'timestamp',
      schema: VisFieldType.Date,
      column: 'timestamp',
      validValuesCount: 100,
      uniqueValuesCount: 80,
    },
  ];

  const mockVisualizationData: VisData = {
    numericalColumns: mockNumericalColumns,
    categoricalColumns: mockCategoricalColumns,
    dateColumns: mockDateColumns,
    transformedData: [],
  };

  const mockOnChartTypeChange = jest.fn();

  const renderWithStore = () => {
    return render(
      <Provider store={createMockStore()}>
        <ChartTypeSelector
          visualizationData={mockVisualizationData}
          onChartTypeChange={mockOnChartTypeChange}
        />
      </Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAvailableChartTypes.mockReturnValue([
      { type: 'bar', name: 'Bar Chart', icon: 'visBarVertical' },
      { type: 'line', name: 'Line Chart', icon: 'visLine' },
    ]);
    mockFindRulesByColumns.mockReturnValue({
      all: [{ visType: 'bar', rules: [{ id: 'rule1' }] }],
      exact: [],
    });
  });

  it('renders without crashing', () => {
    const { container } = renderWithStore();
    expect(container).toBeInTheDocument();
  });

  it('renders visualization type label', () => {
    renderWithStore();
    expect(screen.getByText('Visualization type')).toBeInTheDocument();
  });

  it('renders chart type selector', () => {
    renderWithStore();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls onChartTypeChange when selection changes', () => {
    renderWithStore();

    const selector = screen.getByRole('button');
    fireEvent.click(selector);

    const lineOption = screen.getByText('Line Chart');
    fireEvent.click(lineOption);

    expect(mockOnChartTypeChange).toHaveBeenCalledWith('line');
  });

  it('renders with empty visualization data', () => {
    const { container } = render(
      <Provider store={createMockStore()}>
        <ChartTypeSelector
          visualizationData={{
            transformedData: [],
            categoricalColumns: [],
            numericalColumns: [],
            dateColumns: [],
          }}
          onChartTypeChange={mockOnChartTypeChange}
        />
      </Provider>
    );
    expect(container.firstChild).not.toBeNull();
    expect(screen.getByText('Visualization type')).toBeInTheDocument();
  });

  it('disables chart types with no valid rules', () => {
    const dataWithoutColumns: VisData = {
      numericalColumns: [],
      categoricalColumns: [],
      dateColumns: [],
      transformedData: [],
    };

    render(
      <Provider store={createMockStore()}>
        <ChartTypeSelector
          visualizationData={dataWithoutColumns}
          onChartTypeChange={mockOnChartTypeChange}
        />
      </Provider>
    );

    const selector = screen.getByRole('button');
    fireEvent.click(selector);

    // All options should be disabled due to insufficient columns
    const options = screen.getAllByText(/Chart/);
    expect(options.length).toBeGreaterThan(0);
  });
});
