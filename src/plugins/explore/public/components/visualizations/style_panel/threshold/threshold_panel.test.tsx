/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThresholdPanel, ThresholdPanelProps } from './threshold_panel';

jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: jest.fn().mockImplementation((id, { defaultMessage }) => defaultMessage),
  },
}));

jest.mock('../style_accordion', () => ({
  StyleAccordion: ({ children, accordionLabel }: any) => (
    <div data-test-subj="style-accordion">
      <div>{accordionLabel}</div>
      {children}
    </div>
  ),
}));

jest.mock('../utils', () => ({
  DebouncedTruncateGaugeBaseField: ({ label, onChange, testId }: any) => (
    <input
      data-test-subj={testId}
      placeholder={label}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  ),
}));

jest.mock('./threshold_custom_values', () => ({
  ThresholdCustomValues: ({ onThresholdValuesChange, onBaseColorChange }: any) => (
    <div data-test-subj="threshold-custom-values">
      <button
        data-test-subj="add-threshold"
        onClick={() => onThresholdValuesChange([{ value: 50, color: '#FF0000' }])}
      >
        Add Threshold
      </button>
      <button data-test-subj="change-base-color" onClick={() => onBaseColorChange('#00FF00')}>
        Change Base Color
      </button>
    </div>
  ),
}));

describe('ThresholdPanel', () => {
  const mockProps: ThresholdPanelProps = {
    thresholds: [],
    onThresholdValuesChange: jest.fn(),
    baseColor: '#FFFFFF',
    onBaseColorChange: jest.fn(),
    min: 0,
    max: 100,
    onMinChange: jest.fn(),
    onMaxChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders threshold accordion', () => {
    render(<ThresholdPanel {...mockProps} />);
    expect(screen.getByText('Threshold')).toBeInTheDocument();
  });

  it('renders min and max inputs', () => {
    render(<ThresholdPanel {...mockProps} />);
    expect(screen.getByTestId('thresholdMinBase')).toBeInTheDocument();
    expect(screen.getByTestId('thresholdMaxBase')).toBeInTheDocument();
  });

  it('calls onMinChange when min value changes', () => {
    render(<ThresholdPanel {...mockProps} />);
    const minInput = screen.getByTestId('thresholdMinBase');
    fireEvent.change(minInput, { target: { value: '10' } });
    expect(mockProps.onMinChange).toHaveBeenCalledWith(10);
  });

  it('calls onMaxChange when max value changes', () => {
    render(<ThresholdPanel {...mockProps} />);
    const maxInput = screen.getByTestId('thresholdMaxBase');
    fireEvent.change(maxInput, { target: { value: '200' } });
    expect(mockProps.onMaxChange).toHaveBeenCalledWith(200);
  });

  it('renders threshold custom values component', () => {
    render(<ThresholdPanel {...mockProps} />);
    expect(screen.getByTestId('threshold-custom-values')).toBeInTheDocument();
  });

  it('calls onThresholdValuesChange when threshold is added', () => {
    render(<ThresholdPanel {...mockProps} />);
    const addButton = screen.getByTestId('add-threshold');
    fireEvent.click(addButton);
    expect(mockProps.onThresholdValuesChange).toHaveBeenCalledWith([
      { value: 50, color: '#FF0000' },
    ]);
  });

  it('calls onBaseColorChange when base color changes', () => {
    render(<ThresholdPanel {...mockProps} />);
    const colorButton = screen.getByTestId('change-base-color');
    fireEvent.click(colorButton);
    expect(mockProps.onBaseColorChange).toHaveBeenCalledWith('#00FF00');
  });
});
