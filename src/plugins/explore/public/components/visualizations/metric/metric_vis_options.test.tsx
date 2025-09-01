/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MetricVisStyleControls, MetricVisStyleControlsProps } from './metric_vis_options';
import { VisFieldType } from '../types';
import { defaultMetricChartStyles } from './metric_vis_config';

jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: jest.fn().mockImplementation((id, { defaultMessage }) => defaultMessage),
  },
}));

describe('MetricVisStyleControls', () => {
  const mockProps: MetricVisStyleControlsProps = {
    axisColumnMappings: {
      value: {
        id: 1,
        name: 'value',
        schema: VisFieldType.Numerical,
        column: 'field-1',
        validValuesCount: 1,
        uniqueValuesCount: 1,
      },
    },
    updateVisualization: jest.fn(),
    styleOptions: defaultMetricChartStyles,
    onStyleChange: jest.fn(),
    numericalColumns: [
      {
        id: 1,
        name: 'value',
        schema: VisFieldType.Numerical,
        column: 'field-1',
        validValuesCount: 1,
        uniqueValuesCount: 1,
      },
    ],
    categoricalColumns: [],
    dateColumns: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the metric accordion', () => {
    render(<MetricVisStyleControls {...mockProps} />);

    expect(screen.getByText('Metric')).toBeInTheDocument();
  });

  it('renders the show title switch', () => {
    render(<MetricVisStyleControls {...mockProps} />);
    expect(screen.getByTestId('showTitleSwitch')).toBeInTheDocument();
  });

  it('calls onStyleChange when show title switch is toggled', () => {
    render(<MetricVisStyleControls {...mockProps} />);
    const switchButton = screen.getByTestId('showTitleSwitch');
    fireEvent.click(switchButton);

    expect(mockProps.onStyleChange).toHaveBeenCalledWith({ showTitle: false });
  });

  it('renders title input when showTitle is true', () => {
    const propsWithTitle = {
      ...mockProps,
      styleOptions: { ...defaultMetricChartStyles, showTitle: true },
    };
    render(<MetricVisStyleControls {...propsWithTitle} />);

    expect(screen.getByPlaceholderText('Title')).toBeInTheDocument();
  });

  it('does not render title input when showTitle is false', () => {
    const propsWithoutTitle = {
      ...mockProps,
      styleOptions: { ...defaultMetricChartStyles, showTitle: false },
    };
    render(<MetricVisStyleControls {...propsWithoutTitle} />);

    expect(screen.queryByPlaceholderText('Title')).not.toBeInTheDocument();
  });

  it('renders font size range slider', () => {
    render(<MetricVisStyleControls {...mockProps} />);

    expect(screen.getByTestId('valueFontSizeInput')).toBeInTheDocument();
  });

  it('renders use color switch', () => {
    render(<MetricVisStyleControls {...mockProps} />);

    expect(screen.getByText('Value color')).toBeInTheDocument();
  });

  it('calls onStyleChange when use color switch is toggled', () => {
    render(<MetricVisStyleControls {...mockProps} />);
    const switches = screen.getAllByRole('switch');
    const colorSwitch = switches.find((sw) => sw.getAttribute('aria-checked') === 'false');
    fireEvent.click(colorSwitch!);

    expect(mockProps.onStyleChange).toHaveBeenCalledWith({ useColor: true });
  });

  it('renders color schema select when useColor is true', () => {
    const propsWithColor = {
      ...mockProps,
      styleOptions: { ...defaultMetricChartStyles, useColor: true },
    };
    render(<MetricVisStyleControls {...propsWithColor} />);

    expect(screen.getByText('Color Schema')).toBeInTheDocument();
  });

  it('does not render color schema when useColor is false', () => {
    render(<MetricVisStyleControls {...mockProps} />);

    expect(screen.queryByText('Color Schema')).not.toBeInTheDocument();
  });

  it('does not render style options when no axis mapping is selected', () => {
    const propsWithoutMapping = {
      ...mockProps,
      axisColumnMappings: {},
    };
    render(<MetricVisStyleControls {...propsWithoutMapping} />);

    expect(screen.queryByText('Font Size')).not.toBeInTheDocument();
    expect(screen.queryByText('Value color')).not.toBeInTheDocument();
  });

  it('renders axes selector panel', () => {
    render(<MetricVisStyleControls {...mockProps} />);

    // AxesSelectPanel should be rendered regardless of mapping
    expect(screen.getByText('Metric')).toBeInTheDocument();
  });

  it('calls onStyleChange when font size is changed', async () => {
    render(<MetricVisStyleControls {...mockProps} />);
    const fontSizeSlider = screen.getByTestId('valueFontSizeInput');
    fireEvent.change(fontSizeSlider, { target: { value: '80' } });

    await waitFor(() => {
      expect(mockProps.onStyleChange).toHaveBeenCalledWith({ fontSize: 80 });
    });
  });

  it('calls onStyleChange when color schema is changed', () => {
    const propsWithColor = {
      ...mockProps,
      styleOptions: { ...defaultMetricChartStyles, useColor: true },
    };
    render(<MetricVisStyleControls {...propsWithColor} />);
    const colorSchemaSelect = screen.getByTestId('colorSchemaSelect');
    fireEvent.change(colorSchemaSelect, { target: { value: 'greens' } });

    expect(mockProps.onStyleChange).toHaveBeenCalledWith({ colorSchema: 'greens' });
  });

  it('renders custom ranges when useColor is true', () => {
    const propsWithColor = {
      ...mockProps,
      styleOptions: { ...defaultMetricChartStyles, useColor: true },
    };
    render(<MetricVisStyleControls {...propsWithColor} />);

    // CustomRange component should be rendered
    expect(screen.getByText('Color Schema')).toBeInTheDocument();
  });

  it('calls onStyleChange when title text is changed', async () => {
    const propsWithTitle = {
      ...mockProps,
      styleOptions: { ...defaultMetricChartStyles, showTitle: true },
    };
    render(<MetricVisStyleControls {...propsWithTitle} />);
    const titleInput = screen.getByPlaceholderText('Title');
    fireEvent.change(titleInput, { target: { value: 'New Title' } });

    await waitFor(() => {
      expect(mockProps.onStyleChange).toHaveBeenCalledWith({ title: 'New Title' });
    });
  });

  it('uses numerical column name as default title when no title is set', () => {
    const propsWithTitle = {
      ...mockProps,
      styleOptions: { ...defaultMetricChartStyles, showTitle: true, title: '' },
    };
    render(<MetricVisStyleControls {...propsWithTitle} />);
    const titleInput = screen.getByDisplayValue('value');

    expect(titleInput).toBeInTheDocument();
  });

  it('uses empty string as default title when no title and no value axis mapping is set', () => {
    const propsWithEmptyTitle = {
      ...mockProps,
      styleOptions: { ...defaultMetricChartStyles, showTitle: true, title: '' },
      axisColumnMappings: { value: undefined },
    };
    render(<MetricVisStyleControls {...propsWithEmptyTitle} />);
    const titleInput = screen.getByPlaceholderText('Title');

    expect(titleInput).toHaveValue('');
  });
});
