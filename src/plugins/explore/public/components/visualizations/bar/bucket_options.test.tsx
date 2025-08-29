/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BucketVisOptions } from './bucket_options';
import { AggregationType } from '../types';

jest.mock('../utils/collections', () => ({
  getAggregationnType: () => [
    { value: 'sum', text: 'Sum' },
    { value: 'mean', text: 'Mean' },
  ],
  getTimeUnits: () => [
    { value: 'day', text: 'Day' },
    { value: 'month', text: 'Month' },
  ],
}));

jest.mock('../utils/use_debounced_value', () => ({
  useDebouncedValue: (value: any, callback: any) => [value, callback],
}));

describe('BucketVisOptions', () => {
  const mockOnChange = jest.fn();

  it('renders aggregation type for time bucket', () => {
    render(
      <BucketVisOptions
        styles={{ aggregationType: AggregationType.SUM }}
        bucketType="time"
        onChange={mockOnChange}
      />
    );

    expect(screen.getByDisplayValue('Sum')).toBeInTheDocument();
    expect(screen.getByLabelText('Time interval selection')).toBeInTheDocument();
  });

  it('renders bucket size and count for num bucket', () => {
    render(
      <BucketVisOptions
        styles={{ bucketSize: 10, bucketCount: 20 }}
        bucketType="num"
        onChange={mockOnChange}
      />
    );

    expect(screen.getByDisplayValue('10')).toBeInTheDocument();
    expect(screen.getByDisplayValue('20')).toBeInTheDocument();
  });

  it('does not render aggregation type for single bucket', () => {
    render(<BucketVisOptions styles={{}} bucketType="single" onChange={mockOnChange} />);

    expect(screen.queryByLabelText('Type')).not.toBeInTheDocument();
  });

  it('calls onChange when aggregation type changes', () => {
    render(<BucketVisOptions styles={{}} bucketType="time" onChange={mockOnChange} />);

    fireEvent.change(screen.getByDisplayValue('Sum'), { target: { value: 'mean' } });
    expect(mockOnChange).toHaveBeenCalledWith({ aggregationType: 'mean' });
  });

  it('calls onChange when bucket size changes', () => {
    render(<BucketVisOptions styles={{}} bucketType="num" onChange={mockOnChange} />);

    fireEvent.change(screen.getByPlaceholderText('Auto'), { target: { value: '15' } });
    expect(mockOnChange).toHaveBeenCalledWith({ bucketSize: 15 });
  });
});
