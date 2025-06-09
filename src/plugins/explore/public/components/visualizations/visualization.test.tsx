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

// Mock the visualization type
const mockVisualizationType = {
  name: 'line',
  type: 'line',
  ui: {
    style: {
      defaults: {} as LineChartStyleControls,
      render: jest.fn(),
    },
  },
};

describe('Visualization', () => {
  const defaultProps: VisualizationProps = {
    expression: 'mock-expression',
    searchContext: {},
    styleOptions: {} as LineChartStyleControls,
    visualizationData: {
      ruleId: 'test-rule',
      visualizationType: mockVisualizationType as VisualizationType,
      transformedData: [{ x: 1, y: 2 }],
      numericalColumns: [{ id: 1, name: 'y', schema: VisFieldType.Numerical, column: 'y' }],
      categoricalColumns: [],
      dateColumns: [{ id: 2, name: 'x', schema: VisFieldType.Date, column: 'x' }],
      availableChartTypes: [{ type: 'line', priority: 100, name: 'Line Chart' }],
      toExpression: jest.fn(),
    },
    onStyleChange: jest.fn(),
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
      },
    };

    const props = {
      ...defaultProps,
      visualizationData: {
        ...defaultProps.visualizationData,
        visualizationType: mockVisType,
      },
    };

    render(<Visualization {...props} />);

    expect(mockStyleRender).toHaveBeenCalledWith(
      expect.objectContaining({
        styleOptions: props.styleOptions,
        onStyleChange: props.onStyleChange,
        numericalColumns: props.visualizationData.numericalColumns,
        categoricalColumns: props.visualizationData.categoricalColumns,
        dateColumns: props.visualizationData.dateColumns,
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
    const stylePanel = container.querySelector('[data-test-subj="exploreStylePanel"]');
    expect(stylePanel).toBeInTheDocument();
  });

  it('calls the style render function with correct props', () => {
    const renderStyleMock = jest.fn();
    const props = {
      ...defaultProps,
      visualizationData: {
        ...defaultProps.visualizationData,
        visualizationType: {
          ...defaultProps.visualizationData.visualizationType,
          ui: {
            style: {
              defaults: {} as LineChartStyleControls,
              render: renderStyleMock,
            },
          },
        } as any,
      },
    };

    render(<Visualization {...props} />);

    expect(renderStyleMock).toHaveBeenCalledWith({
      styleOptions: props.styleOptions,
      onStyleChange: props.onStyleChange,
      numericalColumns: props.visualizationData.numericalColumns,
      categoricalColumns: props.visualizationData.categoricalColumns,
      dateColumns: props.visualizationData.dateColumns,
    });
  });
});
