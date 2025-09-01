/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GaugeVisStyleControls, GaugeVisStyleControlsProps } from './gauge_vis_options';
import { VisFieldType } from '../types';
import { defaultGaugeChartStyles } from './gauge_vis_config';

jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: jest.fn().mockImplementation((id, { defaultMessage }) => defaultMessage),
  },
}));

jest.mock('../style_panel/threshold_custom_values', () => ({
  ThresholdCustomValues: jest.fn(({ thresholdValues, onThresholdValuesChange }) => (
    <div data-test-subj="mockGaugeThreshold">
      <button
        data-test-subj="mockAddRange"
        onClick={() =>
          onThresholdValuesChange([...thresholdValues, { value: 50, color: '#FF0000' }])
        }
      >
        Add Range
      </button>
    </div>
  )),
}));

describe('GaugeVisStyleControls', () => {
  const mockProps: GaugeVisStyleControlsProps = {
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
    styleOptions: defaultGaugeChartStyles,
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

  it('renders the gauge accordion', () => {
    render(<GaugeVisStyleControls {...mockProps} />);
    expect(screen.getByText('Gauge')).toBeInTheDocument();
  });

  it('renders the show title switch', () => {
    render(<GaugeVisStyleControls {...mockProps} />);
    expect(screen.getByTestId('showTitleSwitch')).toBeInTheDocument();
  });

  it('calls onStyleChange when show title switch is toggled', () => {
    render(<GaugeVisStyleControls {...mockProps} />);
    const switchButton = screen.getByTestId('showTitleSwitch');
    fireEvent.click(switchButton);

    expect(mockProps.onStyleChange).toHaveBeenCalledWith({ showTitle: false });
  });

  it('renders title input when showTitle is true', () => {
    const propsWithTitle = {
      ...mockProps,
      styleOptions: { ...defaultGaugeChartStyles, showTitle: true },
    };
    render(<GaugeVisStyleControls {...propsWithTitle} />);

    expect(screen.getByPlaceholderText('Title')).toBeInTheDocument();
  });

  it('calls onStyleChange when title is changed', async () => {
    const propsWithTitle = {
      ...mockProps,
      styleOptions: { ...defaultGaugeChartStyles, showTitle: true },
    };
    render(<GaugeVisStyleControls {...propsWithTitle} />);

    const titleInput = screen.getByPlaceholderText('Title');
    await fireEvent.change(titleInput, {
      target: { value: 'New Title' },
    });

    await waitFor(() => {
      expect(mockProps.onStyleChange).toHaveBeenCalledWith({ title: 'New Title' });
    });
  });

  it('renders threshold panel', () => {
    render(<GaugeVisStyleControls {...mockProps} />);
    expect(screen.getByText('Threshold')).toBeInTheDocument();
    expect(screen.getByTestId('mockGaugeThreshold')).toBeInTheDocument();
  });

  it('renders min and max inputs', () => {
    render(<GaugeVisStyleControls {...mockProps} />);
    expect(screen.getByTestId('gaugeMinBase')).toBeInTheDocument();
    expect(screen.getByTestId('gaugeMaxBase')).toBeInTheDocument();
  });

  it('calls onStyleChange when min value is changed', async () => {
    render(<GaugeVisStyleControls {...mockProps} />);

    const minInput = screen.getByTestId('gaugeMinBase');
    await fireEvent.change(minInput, {
      target: { value: 10 },
    });

    await waitFor(() => {
      expect(mockProps.onStyleChange).toHaveBeenCalledWith({ min: 10 });
    });
  });

  it('calls onStyleChange when max value is changed', async () => {
    render(<GaugeVisStyleControls {...mockProps} />);

    const maxInput = screen.getByTestId('gaugeMaxBase');
    await fireEvent.change(maxInput, {
      target: { value: 100 },
    });

    await waitFor(() => {
      expect(mockProps.onStyleChange).toHaveBeenCalledWith({ max: 100 });
    });
  });

  it('calls onStyleChange when custom range is added', () => {
    render(<GaugeVisStyleControls {...mockProps} />);

    const addRangeButton = screen.getByTestId('mockAddRange');
    fireEvent.click(addRangeButton);

    expect(mockProps.onStyleChange).toHaveBeenCalledWith({
      thresholdValues: [{ value: 50, color: '#FF0000' }],
    });
  });
});
