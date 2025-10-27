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

jest.mock('../style_panel/threshold/threshold_panel', () => ({
  ThresholdPanel: jest.fn(({ thresholdsOptions, onChange }) => (
    <>
      <div data-test-subj="mockGaugeThresholdPanel">
        <button
          data-test-subj="mockAddRange"
          onClick={() =>
            onChange({ ...thresholdsOptions, thresholds: [{ value: 50, color: '#FF0000' }] })
          }
        >
          Add Range
        </button>
      </div>
    </>
  )),
}));

jest.mock('../style_panel/standard_options/standard_options_panel', () => ({
  StandardOptionsPanel: jest.fn(({ min, onMinChange, max, onMaxChange, unit, onUnitChange }) => (
    <div data-test-subj="mockGaugeStandardPanel">
      <input
        data-test-subj="thresholdMinBase"
        onChange={(e) => onMinChange(Number(e.target.value))}
      />
      <input
        data-test-subj="thresholdMaxBase"
        onChange={(e) => onMaxChange(Number(e.target.value))}
      />
      <div data-test-subj="mockGaugeUnitPanel">
        <select data-test-subj="changeUnit" onClick={() => onUnitChange('number')}>
          <option value="number">Number</option>
        </select>
      </div>
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
    expect(screen.getByTestId('mockGaugeThresholdPanel')).toBeInTheDocument();
  });

  it('renders standard options panel', () => {
    render(<GaugeVisStyleControls {...mockProps} />);
    expect(screen.getByTestId('mockGaugeStandardPanel')).toBeInTheDocument();
  });

  it('renders min and max inputs', () => {
    render(<GaugeVisStyleControls {...mockProps} />);
    expect(screen.getByTestId('thresholdMinBase')).toBeInTheDocument();
    expect(screen.getByTestId('thresholdMaxBase')).toBeInTheDocument();
  });

  it('calls onStyleChange when min value is changed', () => {
    render(<GaugeVisStyleControls {...mockProps} />);

    const minInput = screen.getByTestId('thresholdMinBase');
    fireEvent.change(minInput, { target: { value: 50 } });

    expect(mockProps.onStyleChange).toHaveBeenCalledWith({ min: 50 });
  });

  it('calls onStyleChange when max value is changed', () => {
    render(<GaugeVisStyleControls {...mockProps} />);

    const maxInput = screen.getByTestId('thresholdMaxBase');
    fireEvent.change(maxInput, { target: { value: 50 } });

    expect(mockProps.onStyleChange).toHaveBeenCalledWith({ max: 50 });
  });

  it('calls onStyleChange when threshold is added', () => {
    render(<GaugeVisStyleControls {...mockProps} />);

    const addRangeButton = screen.getByTestId('mockAddRange');
    fireEvent.click(addRangeButton);

    expect(mockProps.onStyleChange).toHaveBeenCalledWith({
      thresholdOptions: {
        ...mockProps.styleOptions.thresholdOptions,
        thresholds: [{ color: '#FF0000', value: 50 }],
      },
    });
  });

  it('calls onStyleChange when unit is changed', () => {
    render(<GaugeVisStyleControls {...mockProps} />);
    const unitSelect = screen.getByTestId('changeUnit');
    fireEvent.click(unitSelect);
    expect(mockProps.onStyleChange).toHaveBeenCalledWith({ unitId: 'number' });
  });
});
