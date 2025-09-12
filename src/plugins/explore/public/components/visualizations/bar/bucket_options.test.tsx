/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BucketOptionsPanel } from './bucket_options';
import { AggregationType } from '../types';

jest.mock('../utils/collections', () => ({
  getAggregationType: () => [
    { value: 'sum', text: 'Sum' },
    { value: 'mean', text: 'Mean' },
  ],
  getTimeUnits: () => [
    { value: 'day', text: 'Day' },
    { value: 'month', text: 'Month' },
    { value: 'auto', text: 'Auto' },
  ],
}));

// Mock the DebouncedFieldNumber component
jest.mock('../style_panel/utils', () => ({
  DebouncedFieldNumber: jest.fn(({ value, onChange, placeholder, ...rest }) => (
    <input
      type="number"
      value={value || ''}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      placeholder={placeholder}
      data-test-subj="debouncedFieldNumber"
      {...rest}
    />
  )),
}));

describe('BucketVisOptions', () => {
  const mockOnChange = jest.fn();

  it('renders aggregation type for time bucket', () => {
    render(
      <BucketOptionsPanel
        styles={{ aggregationType: AggregationType.SUM }}
        bucketType="time"
        onChange={mockOnChange}
      />
    );

    expect(screen.getByDisplayValue('Sum')).toBeInTheDocument();
    expect(screen.getByLabelText('Interval')).toBeInTheDocument();
  });

  it('renders bucket size and count for num bucket', () => {
    render(
      <BucketOptionsPanel
        styles={{ bucketSize: 10, bucketCount: 20 }}
        bucketType="num"
        onChange={mockOnChange}
      />
    );

    expect(screen.getByDisplayValue('10')).toBeInTheDocument();
    expect(screen.getByDisplayValue('20')).toBeInTheDocument();
  });

  it('does not render aggregation type for single bucket', () => {
    render(<BucketOptionsPanel styles={{}} bucketType="single" onChange={mockOnChange} />);

    expect(screen.queryByLabelText('Type')).not.toBeInTheDocument();
  });

  it('calls onChange when aggregation type changes', () => {
    render(<BucketOptionsPanel styles={{}} bucketType="time" onChange={mockOnChange} />);

    fireEvent.change(screen.getByDisplayValue('Sum'), { target: { value: 'mean' } });
    expect(mockOnChange).toHaveBeenCalledWith({ aggregationType: 'mean' });
  });

  it('calls onChange when bucket size changes', () => {
    render(<BucketOptionsPanel styles={{}} bucketType="num" onChange={mockOnChange} />);

    fireEvent.change(screen.getByPlaceholderText('auto'), { target: { value: '15' } });
    expect(mockOnChange).toHaveBeenCalledWith({ bucketSize: 15 });
  });

  it('use default bucket options if current bucket styles is undefinec', () => {
    render(<BucketOptionsPanel styles={undefined} bucketType="time" onChange={mockOnChange} />);

    expect(screen.getByDisplayValue('Sum')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Auto')).toBeInTheDocument();
  });
});
