/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThresholdPanel, ThresholdPanelProps } from './threshold_panel';
import { ColorSchemas, ThresholdLine } from '../../types';

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
    expect(screen.getByText('Threshold')).toBeInTheDocument();
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

  it('should able to migrate old custom ranges to thresholds', () => {
    const oldProps = {
      customRanges: [
        { min: 0, max: 50 },
        { min: 50, max: 100 },
      ],
      colorSchema: ColorSchemas.BLUES,
      thresholdsOptions: undefined,
      onChange: jest.fn(),
    };

    render(<ThresholdPanel {...oldProps} />);
    const migrateButton = screen.getByTestId('migrate-data');
    fireEvent.click(migrateButton);

    expect(oldProps.onChange).toHaveBeenCalledWith({
      thresholds: [
        { value: 0, color: '#c6dbef' },
        { value: 50, color: '#9ecae1' },
        { value: 100, color: '#6baed6' },
      ],
    });
  });

  it('should able to migrate old thresholdLines to thresholds', () => {
    const oldProps = {
      thresholdLines: [
        { value: 0, color: '#c6dbef' },
        { value: 50, color: '#9ecae1' },
      ] as ThresholdLine[],
      colorSchema: ColorSchemas.BLUES,
      thresholdsOptions: undefined,
      onChange: jest.fn(),
    };

    render(<ThresholdPanel {...oldProps} />);
    const migrateButton = screen.getByTestId('migrate-data');
    fireEvent.click(migrateButton);

    expect(oldProps.onChange).toHaveBeenCalledWith({
      thresholds: [
        { value: 0, color: '#c6dbef' },
        { value: 50, color: '#9ecae1' },
      ],
    });
  });
});
