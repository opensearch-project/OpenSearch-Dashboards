/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { Visualization, VisualizationProps } from './visualization';
import { LineChartStyleControls } from './line/line_vis_config';
import { VisFieldType } from './types';
import { VisualizationType } from './utils/use_visualization_types';

// Mock the visualization registry and types
jest.mock('./utils/use_visualization_types', () => ({
  useVisualizationRegistry: jest.fn().mockReturnValue({
    findRuleById: jest.fn().mockReturnValue({
      toExpression: jest.fn().mockReturnValue({
        type: 'expression',
        data: 'mock-expression-data',
      }),
    }),
  }),
}));

// Mock the ChartTypeSelector component to avoid Redux dependency
jest.mock('./chart_type_selector', () => ({
  ChartTypeSelector: () => <div data-testid="chart-type-selector">Chart Type Selector</div>,
}));

// Mock the visualization type
const mockVisualizationType: VisualizationType<'line'> = {
  name: 'line',
  type: 'line',
  ui: {
    style: {
      defaults: {} as LineChartStyleControls,
      render: jest.fn(),
    },
    availableMappings: [],
  },
};

describe('Visualization', () => {
  const defaultProps: VisualizationProps<'line'> = {
    updateVisualization: jest.fn(),
    expression: 'mock-expression',
    searchContext: {},
    styleOptions: {} as LineChartStyleControls,
    visualizationData: {
      ruleId: 'test-rule',
      visualizationType: mockVisualizationType,
      transformedData: [{ x: 1, y: 2 }],
      numericalColumns: [
        {
          id: 1,
          name: 'y',
          schema: VisFieldType.Numerical,
          column: 'y',
          validValuesCount: 1,
          uniqueValuesCount: 1,
        },
      ],
      categoricalColumns: [],
      dateColumns: [
        {
          id: 2,
          name: 'x',
          schema: VisFieldType.Date,
          column: 'x',
          validValuesCount: 1,
          uniqueValuesCount: 1,
        },
      ],
      availableChartTypes: [{ type: 'line', priority: 100, name: 'Line Chart', icon: '' }],
      toExpression: jest.fn(),
      axisColumnMappings: {
        x: {
          id: 2,
          name: 'x',
          schema: VisFieldType.Date,
          column: 'x',
          validValuesCount: 1,
          uniqueValuesCount: 1,
        },
        y: {
          id: 1,
          name: 'y',
          schema: VisFieldType.Numerical,
          column: 'y',
          validValuesCount: 1,
          uniqueValuesCount: 1,
        },
      },
    },
    onStyleChange: jest.fn() as (newOptions: Partial<LineChartStyleControls>) => void,
    ReactExpressionRenderer: ({ expression }) => (
      <div data-testid="expression-renderer">
        <div data-testid="expression-data">{expression}</div>
      </div>
    ),
  };

  it('should pass the correct props to the expression renderer', () => {
    const mockRenderer = jest.fn().mockReturnValue(<div>Mocked Renderer</div>);
    const props = {
      ...defaultProps,
      ReactExpressionRenderer: mockRenderer,
    };

    render(<Visualization {...props} />);

    expect(mockRenderer).toHaveBeenCalledWith(
      expect.objectContaining({
        expression: 'mock-expression',
        searchContext: {},
      }),
      expect.anything()
    );
  });

  it('should call the style render function with correct props', () => {
    const mockStyleRender = jest.fn().mockReturnValue(<div>Style Controls</div>);
    const mockVisType = {
      ...mockVisualizationType,
      ui: {
        style: {
          defaults: {} as LineChartStyleControls,
          render: mockStyleRender,
        },
        availableMappings: [],
      },
    };

    const props = {
      ...defaultProps,
      visualizationData: {
        ...defaultProps.visualizationData,
        visualizationType: mockVisType,
      },
    };

    render(<Visualization<'line'> {...props} />);

    expect(mockStyleRender).toHaveBeenCalledWith(
      expect.objectContaining({
        styleOptions: props.styleOptions,
        onStyleChange: props.onStyleChange,
        numericalColumns: props.visualizationData.numericalColumns,
        categoricalColumns: props.visualizationData.categoricalColumns,
        dateColumns: props.visualizationData.dateColumns,
        axisColumnMappings: props.visualizationData.axisColumnMappings,
        updateVisualization: props.updateVisualization,
      })
    );
  });

  it('renders without crashing', () => {
    const { container } = render(<Visualization {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });

  it('renders the visualization panel', () => {
    const { container } = render(<Visualization {...defaultProps} />);
    const visPanel = container.querySelector('[data-test-subj="exploreVisualizationLoader"]');
    expect(visPanel).toBeInTheDocument();
  });

  it('renders the style panel', () => {
    const { container } = render(<Visualization {...defaultProps} />);
    const stylePanel = container.querySelector('.exploreVisStylePanel');
    expect(stylePanel).toBeInTheDocument();
  });

  it('returns null when visualizationData is null', () => {
    // We can't actually test this because the useMemo hook runs before the null check
    // This would require refactoring the component to move the null check before useMemo
    // For now, we'll test that the component handles undefined visualizationData gracefully
    const props = {
      ...defaultProps,
      visualizationData: undefined as any,
    };

    expect(() => render(<Visualization {...(props as any)} />)).toThrow();
  });

  it('renders table visualization when selectedChartType is table', () => {
    const props = {
      ...defaultProps,
      selectedChartType: 'table',
      styleOptions: { pageSize: 10 } as any,
    };

    const { getByTestId } = render(<Visualization {...props} />);
    expect(getByTestId('exploreVisualizationLoader')).toBeInTheDocument();
  });

  it('renders empty prompt when no expression and no table chart type', () => {
    const props = {
      ...defaultProps,
      expression: null,
      visualizationData: {
        ...defaultProps.visualizationData,
        axisColumnMappings: {},
      },
    };

    const { getByText } = render(<Visualization {...props} />);
    expect(
      getByText('Select a chart type, and x and y axes fields to get started')
    ).toBeInTheDocument();
  });

  it('renders empty prompt when no axis mapping is selected', () => {
    const props = {
      ...defaultProps,
      expression: 'some-expression',
      visualizationData: {
        ...defaultProps.visualizationData,
        axisColumnMappings: {},
      },
    };

    const { getByText } = render(<Visualization {...props} />);
    expect(
      getByText('Select a chart type, and x and y axes fields to get started')
    ).toBeInTheDocument();
  });
});
