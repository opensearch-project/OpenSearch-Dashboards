/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { VisualizationContainer } from './visualization_container';
import { VisFieldType } from './types';
import { ResultStatus } from '../../application/legacy/discover/application/view_components/utils/use_search';

// Define a minimal OpenSearchSearchHit type for testing
interface OpenSearchSearchHit {
  _index: string;
  _type: string;
  _id: string;
  _score: number;
  _source: Record<string, any>;
  _version?: number;
  fields?: Record<string, any>;
  highlight?: Record<string, any>;
}

// Mock the visualization component
jest.mock('./visualization', () => ({
  Visualization: jest.fn().mockImplementation(({ styleOptions }) => (
    <div data-testid="visualization">
      <div data-testid="style-options">{JSON.stringify(styleOptions)}</div>
    </div>
  )),
}));

// Mock the OpenSearch Dashboards context
jest.mock('../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn().mockReturnValue({
    services: {
      data: {
        query: {
          filterManager: {},
          queryString: {},
          timefilter: { timefilter: {} },
        },
      },
      expressions: {
        ReactExpressionRenderer: jest.fn(),
      },
    },
  }),
}));

// Mock the discover context
jest.mock('../../application/legacy/discover/application/view_components/context', () => ({
  useDiscoverContext: jest.fn().mockReturnValue({
    indexPattern: {},
  }),
}));

// Mock the visualization type
const mockVisualizationType = {
  name: 'line',
  type: 'line',
  ui: {
    style: {
      defaults: {
        addTooltip: true,
        addLegend: true,
        legendPosition: 'right',
        addTimeMarker: false,
        showLine: true,
        lineMode: 'smooth',
        lineWidth: 2,
        showDots: true,
        thresholdLine: {
          color: '#E7664C',
          show: false,
          style: 'full',
          value: 10,
          width: 1,
        },
        grid: {
          categoryLines: true,
          valueLines: true,
        },
        categoryAxes: [],
        valueAxes: [],
      },
      render: jest.fn(),
    },
  },
};

describe('VisualizationContainer', () => {
  const defaultProps = {
    rows: [
      {
        _index: 'test-index',
        _type: 'test-type',
        _id: 'test-id',
        _score: 1,
        _source: { x: 1, y: 2 },
      },
    ] as OpenSearchSearchHit[],
    fieldSchema: [
      { name: 'y', type: VisFieldType.Numerical },
      { name: 'x', type: VisFieldType.Date },
    ],
    status: ResultStatus.READY,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock getVisualizationType to return visualization data
    jest.mock('./utils/use_visualization_types', () => ({
      getVisualizationType: jest.fn().mockReturnValue({
        ruleId: 'test-rule',
        visualizationType: mockVisualizationType,
        transformedData: [{ x: 1, y: 2 }],
        numericalColumns: [{ id: 1, name: 'y', schema: VisFieldType.Numerical, column: 'y' }],
        categoricalColumns: [],
        dateColumns: [{ id: 2, name: 'x', schema: VisFieldType.Date, column: 'x' }],
        chartType: 'line',
        availableChartTypes: [{ type: 'line', priority: 100, name: 'Line Chart' }],
        toExpression: jest.fn(),
      }),
      useVisualizationRegistry: jest.fn().mockReturnValue({
        getRules: jest.fn().mockReturnValue([
          {
            id: 'test-rule',
            toExpression: jest.fn().mockReturnValue('mock-expression'),
          },
        ]),
      }),
    }));
  });

  it('should render null when visualization data is not ready', () => {
    // Mock the implementation to return undefined visualization data
    jest.mock('./utils/use_visualization_types', () => ({
      getVisualizationType: jest.fn().mockReturnValue(undefined),
      useVisualizationRegistry: jest.fn(),
    }));

    const { container } = render(<VisualizationContainer {...defaultProps} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render the visualization component when data is ready', () => {
    // We need to mock useState to return the visualization data
    const originalUseState = React.useState;

    // Type the mock implementation properly
    const mockUseState = jest.fn().mockImplementation((initialValue: any): [any, jest.Mock] => {
      if (initialValue === undefined) {
        return [
          {
            ruleId: 'test-rule',
            visualizationType: mockVisualizationType,
            transformedData: [{ x: 1, y: 2 }],
            numericalColumns: [{ id: 1, name: 'y', schema: VisFieldType.Numerical, column: 'y' }],
            categoricalColumns: [],
            dateColumns: [{ id: 2, name: 'x', schema: VisFieldType.Date, column: 'x' }],
            chartType: 'line',
            availableChartTypes: [{ type: 'line', priority: 100, name: 'Line Chart' }],
          },
          jest.fn(),
        ];
      } else if (typeof initialValue === 'string' || initialValue === undefined) {
        return ['mock-expression', jest.fn()];
      } else {
        return [mockVisualizationType.ui.style.defaults, jest.fn()];
      }
    });

    jest.spyOn(React, 'useState').mockImplementation(mockUseState);

    const { getByTestId } = render(<VisualizationContainer {...defaultProps} />);

    // Restore the original useState implementation after the test
    React.useState = originalUseState;

    // This test will pass if the component renders without errors
    expect(getByTestId('visualization')).toBeInTheDocument();
  });

  it('should handle style changes correctly', () => {
    // Mock useState to control the styleOptions state
    const setStyleOptionsMock = jest.fn();

    // Type the mock implementation properly
    const mockUseState = jest.fn().mockImplementation((initialValue: any): [any, jest.Mock] => {
      if (initialValue === undefined) {
        return [
          {
            ruleId: 'test-rule',
            visualizationType: mockVisualizationType,
          },
          jest.fn(),
        ];
      } else if (typeof initialValue === 'string' || initialValue === undefined) {
        return ['mock-expression', jest.fn()];
      } else {
        return [mockVisualizationType.ui.style.defaults, setStyleOptionsMock];
      }
    });

    jest.spyOn(React, 'useState').mockImplementation(mockUseState);

    render(<VisualizationContainer {...defaultProps} />);

    // Get the handleStyleChange function from the component
    const { Visualization } = jest.requireMock('./visualization');
    const onStyleChangeHandler = Visualization.mock.calls[0][0].onStyleChange;

    // Call the handler with new style options
    onStyleChangeHandler({ showLine: false });

    // Check that setStyleOptions was called with the correct merged options
    expect(setStyleOptionsMock).toHaveBeenCalledWith({
      ...mockVisualizationType.ui.style.defaults,
      showLine: false,
    });
  });
});
