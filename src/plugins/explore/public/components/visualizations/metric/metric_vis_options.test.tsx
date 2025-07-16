/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MetricVisStyleControls, MetricVisStyleControlsProps } from './metric_vis_options';
import { VisFieldType } from '../types';
import { defaultMetricChartStyles } from './metric_vis_config';
import { rootReducer } from '../../../application/utils/state_management/store';

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

  const renderWithProvider = (component: React.ReactElement) => {
    const store = configureStore({
      reducer: rootReducer,
      preloadedState: {
        query: {
          query: '',
          language: 'PPL',
          dataset: {
            id: 'test',
            type: 'INDEX_PATTERN',
            title: '',
          },
        },
        ui: {
          showFilterPanel: false,
          activeTabId: '',
          showHistogram: false,
        },
        results: {},
        tab: {
          logs: {},
          visualizations: {
            styleOptions: { switchAxes: false } as any,
            chartType: 'metric',
            axesMapping: {},
          },
        },
        legacy: { interval: 'auto', columns: [], sort: [] },
        queryEditor: {} as any,
      },
    });
    return render(<Provider store={store}>{component}</Provider>);
  };

  it('renders the metric accordion', () => {
    renderWithProvider(<MetricVisStyleControls {...mockProps} />);

    expect(screen.getByText('Metric')).toBeInTheDocument();
  });

  it('renders the show title switch', () => {
    renderWithProvider(<MetricVisStyleControls {...mockProps} />);
    expect(screen.getByTestId('showTitleSwitch')).toBeInTheDocument();
  });

  it('calls onStyleChange when show title switch is toggled', () => {
    renderWithProvider(<MetricVisStyleControls {...mockProps} />);
    const switchButton = screen.getByTestId('showTitleSwitch');
    fireEvent.click(switchButton);

    expect(mockProps.onStyleChange).toHaveBeenCalledWith({ showTitle: false });
  });

  it('renders title input when showTitle is true', () => {
    const propsWithTitle = {
      ...mockProps,
      styleOptions: { ...defaultMetricChartStyles, showTitle: true },
    };
    renderWithProvider(<MetricVisStyleControls {...propsWithTitle} />);

    expect(screen.getByPlaceholderText('Title')).toBeInTheDocument();
  });

  it('does not render title input when showTitle is false', () => {
    const propsWithoutTitle = {
      ...mockProps,
      styleOptions: { ...defaultMetricChartStyles, showTitle: false },
    };
    renderWithProvider(<MetricVisStyleControls {...propsWithoutTitle} />);

    expect(screen.queryByPlaceholderText('Title')).not.toBeInTheDocument();
  });

  it('renders font size range slider', () => {
    renderWithProvider(<MetricVisStyleControls {...mockProps} />);

    expect(screen.getByRole('slider', { name: 'Font Size' })).toBeInTheDocument();
  });

  it('renders use color switch', () => {
    renderWithProvider(<MetricVisStyleControls {...mockProps} />);

    expect(screen.getByText('Value color')).toBeInTheDocument();
  });

  it('calls onStyleChange when use color switch is toggled', () => {
    renderWithProvider(<MetricVisStyleControls {...mockProps} />);
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
    renderWithProvider(<MetricVisStyleControls {...propsWithColor} />);

    expect(screen.getByText('Color Schema')).toBeInTheDocument();
  });

  it('does not render color schema when useColor is false', () => {
    renderWithProvider(<MetricVisStyleControls {...mockProps} />);

    expect(screen.queryByText('Color Schema')).not.toBeInTheDocument();
  });

  it('does not render style options when no axis mapping is selected', () => {
    const propsWithoutMapping = {
      ...mockProps,
      axisColumnMappings: {},
    };
    renderWithProvider(<MetricVisStyleControls {...propsWithoutMapping} />);

    expect(screen.queryByText('Font Size')).not.toBeInTheDocument();
    expect(screen.queryByText('Value color')).not.toBeInTheDocument();
  });

  it('renders axes selector panel', () => {
    renderWithProvider(<MetricVisStyleControls {...mockProps} />);

    // AxesSelectPanel should be rendered regardless of mapping
    expect(screen.getByText('Metric')).toBeInTheDocument();
  });

  it('calls onStyleChange when font size is changed', async () => {
    renderWithProvider(<MetricVisStyleControls {...mockProps} />);
    const fontSizeSlider = screen.getByRole('slider', { name: 'Font Size' });
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
    renderWithProvider(<MetricVisStyleControls {...propsWithColor} />);
    const colorSchemaSelect = screen.getByRole('combobox');
    fireEvent.change(colorSchemaSelect, { target: { value: 'greens' } });

    expect(mockProps.onStyleChange).toHaveBeenCalledWith({ colorSchema: 'greens' });
  });

  it('renders custom ranges when useColor is true', () => {
    const propsWithColor = {
      ...mockProps,
      styleOptions: { ...defaultMetricChartStyles, useColor: true },
    };
    renderWithProvider(<MetricVisStyleControls {...propsWithColor} />);

    // CustomRange component should be rendered
    expect(screen.getByText('Color Schema')).toBeInTheDocument();
  });

  it('calls onStyleChange when title text is changed', async () => {
    const propsWithTitle = {
      ...mockProps,
      styleOptions: { ...defaultMetricChartStyles, showTitle: true },
    };
    renderWithProvider(<MetricVisStyleControls {...propsWithTitle} />);
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
    renderWithProvider(<MetricVisStyleControls {...propsWithTitle} />);
    const titleInput = screen.getByDisplayValue('value');

    expect(titleInput).toBeInTheDocument();
  });
});
