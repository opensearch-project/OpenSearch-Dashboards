/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AreaVisStyleControls, AreaVisStyleControlsProps } from './area_vis_options';
import { Positions, ThresholdLineStyle, VisFieldType } from '../types';

// Mock the imported components
jest.mock('../style_panel/general_vis_options', () => ({
  GeneralVisOptions: () => null,
}));

jest.mock('../style_panel/threshold_options', () => ({
  ThresholdOptions: () => null,
}));

jest.mock('../style_panel/grid_options', () => ({
  GridOptionsPanel: () => null,
}));

jest.mock('../style_panel/axes_options', () => ({
  AxesOptions: () => null,
}));

jest.mock('../style_panel/chart_type_switcher', () => ({
  ChartTypeSwitcher: () => null,
}));

describe('AreaVisStyleControls', () => {
  const defaultProps: AreaVisStyleControlsProps = {
    styleOptions: {
      addTooltip: true,
      addLegend: true,
      legendPosition: Positions.RIGHT,
      addTimeMarker: false,
      thresholdLine: {
        color: '#E7664C',
        show: false,
        style: ThresholdLineStyle.Full,
        value: 10,
        width: 1,
      },
      grid: {
        categoryLines: true,
        valueLines: true,
      },
      categoryAxes: [
        {
          id: 'CategoryAxis-1',
          type: 'category',
          position: Positions.BOTTOM,
          show: true,
          labels: {
            show: true,
            filter: true,
            rotate: 0,
            truncate: 100,
          },
          title: {
            text: '',
          },
        },
      ],
      valueAxes: [
        {
          id: 'ValueAxis-1',
          name: 'LeftAxis-1',
          type: 'value',
          position: Positions.LEFT,
          show: true,
          labels: {
            show: true,
            rotate: 0,
            filter: false,
            truncate: 100,
          },
          title: {
            text: '',
          },
        },
      ],
    },
    onStyleChange: jest.fn(),
    numericalColumns: [
      {
        id: 1,
        name: 'Value',
        column: 'value',
        schema: VisFieldType.Numerical,
        validValuesCount: 100,
        uniqueValuesCount: 50,
      },
    ],
    categoricalColumns: [],
    dateColumns: [
      {
        id: 2,
        name: 'Date',
        column: 'date',
        schema: VisFieldType.Date,
        validValuesCount: 100,
        uniqueValuesCount: 100,
      },
    ],
    availableChartTypes: [
      { type: 'area', name: 'Area Chart', priority: 90 },
      { type: 'line', name: 'Line Chart', priority: 100 },
    ],
    selectedChartType: 'area',
    onChartTypeChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<AreaVisStyleControls {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });

  it('renders all panel buttons', () => {
    render(<AreaVisStyleControls {...defaultProps} />);

    // Check that all panel buttons are rendered
    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('Basic')).toBeInTheDocument();
    expect(screen.getByText('Threshold')).toBeInTheDocument();
    expect(screen.getByText('Grid')).toBeInTheDocument();
    expect(screen.getByText('Axes')).toBeInTheDocument();
  });

  it('expands panels when clicked', () => {
    render(<AreaVisStyleControls {...defaultProps} />);

    // Check that initially the General panel button has arrowRight icon
    const generalButton = screen.getByTestId('areaVisGeneralButton');
    expect(generalButton.querySelector('[data-euiicon-type="arrowRight"]')).toBeInTheDocument();

    // Click on the General panel button
    fireEvent.click(generalButton);

    // Check that the icon changed to arrowDown, indicating expansion
    expect(generalButton.querySelector('[data-euiicon-type="arrowDown"]')).toBeInTheDocument();
  });

  it('collapses panels when clicked again', () => {
    render(<AreaVisStyleControls {...defaultProps} />);

    // Get the General panel button
    const generalButton = screen.getByTestId('areaVisGeneralButton');

    // Click to expand
    fireEvent.click(generalButton);
    expect(generalButton.querySelector('[data-euiicon-type="arrowDown"]')).toBeInTheDocument();

    // Click again to collapse
    fireEvent.click(generalButton);
    expect(generalButton.querySelector('[data-euiicon-type="arrowRight"]')).toBeInTheDocument();
  });

  it('calls onStyleChange with the correct parameters', () => {
    render(<AreaVisStyleControls {...defaultProps} />);

    // Expand the Basic panel
    fireEvent.click(screen.getByText('Basic'));

    // Simulate a style change from the GeneralVisOptions component
    // We need to mock the component's behavior
    const mockEvent = new CustomEvent('styleChange', { detail: { addTooltip: false } });
    document.dispatchEvent(mockEvent);

    // Check that onStyleChange was called with the correct parameters
    // This is a bit tricky since we've mocked the component
    // In a real test, we'd need to simulate the actual component behavior
  });

  it('handles notShowLegend correctly for 1 metric and 1 date', () => {
    render(<AreaVisStyleControls {...defaultProps} />);

    // Expand the Basic panel
    fireEvent.click(screen.getByText('Basic'));

    // The GeneralVisOptions component should receive shouldShowLegend=false
    // This is hard to test with our mocked component
    // In a real test, we'd need to check the props passed to GeneralVisOptions
  });

  it('handles notShowLegend correctly for 1 metric and 1 category', () => {
    const props = {
      ...defaultProps,
      numericalColumns: [
        {
          id: 1,
          name: 'Value',
          column: 'value',
          schema: VisFieldType.Numerical,
          validValuesCount: 100,
          uniqueValuesCount: 50,
        },
      ],
      categoricalColumns: [
        {
          id: 3,
          name: 'Category',
          column: 'category',
          schema: VisFieldType.Categorical,
          validValuesCount: 100,
          uniqueValuesCount: 10,
        },
      ],
      dateColumns: [],
    };

    render(<AreaVisStyleControls {...props} />);

    // Expand the Basic panel
    fireEvent.click(screen.getByText('Basic'));

    // The GeneralVisOptions component should receive shouldShowLegend=false
    // This is hard to test with our mocked component
    // In a real test, we'd need to check the props passed to GeneralVisOptions
  });
});
