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
  DebouncedFieldNumber: (props: any) => (
    <input
      data-test-subj={props['data-test-subj']}
      placeholder={props.label}
      onChange={(e) => props.onChange(Number(e.target.value))}
    />
  ),
}));

jest.mock('./threshold_custom_values', () => ({
  ThresholdCustomValues: ({ thresholds, onThresholdValuesChange, onBaseColorChange }: any) => (
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
      <button data-test-subj="migrate-data" onClick={() => onThresholdValuesChange(thresholds)}>
        Migrate data
      </button>
    </div>
  ),
}));

describe('ThresholdPanel', () => {
  const mockProps: ThresholdPanelProps = {
    thresholdsOptions: {
      thresholds: [],
      baseColor: '#FFFFFF',
    },
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders threshold accordion', () => {
    render(<ThresholdPanel {...mockProps} />);
    expect(screen.getByText('Thresholds')).toBeInTheDocument();
  });

  it('renders threshold custom values component', () => {
    render(<ThresholdPanel {...mockProps} />);
    expect(screen.getByTestId('threshold-custom-values')).toBeInTheDocument();
  });

  it('calls onChange when threshold is added', () => {
    render(<ThresholdPanel {...mockProps} />);
    const addButton = screen.getByTestId('add-threshold');
    fireEvent.click(addButton);
    expect(mockProps.onChange).toHaveBeenCalledWith({
      thresholds: [{ value: 50, color: '#FF0000' }],
      baseColor: '#FFFFFF',
    });
  });

  it('calls onChange when base color changes', () => {
    render(<ThresholdPanel {...mockProps} />);
    const colorButton = screen.getByTestId('change-base-color');
    fireEvent.click(colorButton);
    expect(mockProps.onChange).toHaveBeenCalledWith({
      thresholds: [],
      baseColor: '#00FF00',
    });
  });
});
