/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HistogramVisStyleControls, HistogramVisStyleControlsProps } from './histogram_vis_options';
import { defaultHistogramChartStyles } from './histogram_vis_config';
import { VisColumn, VisFieldType, AxisRole, AxisColumnMappings } from '../types';

const mockNumericalColumns: VisColumn[] = [
  {
    id: 1,
    name: 'value 1',
    schema: VisFieldType.Numerical,
    column: 'x1',
    validValuesCount: 6,
    uniqueValuesCount: 6,
  },

  {
    id: 2,
    name: 'value 2',
    schema: VisFieldType.Numerical,
    column: 'x2',
    validValuesCount: 6,
    uniqueValuesCount: 6,
  },
];

const mockAxisColumnMappings: AxisColumnMappings = {
  [AxisRole.X]: mockNumericalColumns[0],
  [AxisRole.Y]: mockNumericalColumns[1],
};

jest.mock('../bar/bucket_options.tsx', () => ({
  BucketOptionsPanel: jest.fn(({ styles, bucketType, onChange }) => (
    <div data-test-subj="mockBucketOptionsPanel">
      <span data-test-subj="bucketType">{bucketType}</span>

      <button
        data-test-subj="mockUpdateBucketSize"
        onClick={() => onChange({ ...styles, bucketSize: 100 })}
      >
        Update Bucket Size
      </button>

      <button
        data-test-subj="mockUpdateBucketCount"
        onClick={() => onChange({ ...styles, bucketCount: 20 })}
      >
        Update Bucket Size
      </button>

      {bucketType !== 'single' && (
        <button
          data-test-subj="mockUpdateAggregation"
          onClick={() => onChange({ ...styles, aggregationType: 'sum' })}
        >
          Update Aggregation
        </button>
      )}
    </div>
  )),
}));

describe('BarVisStyleControls', () => {
  const defaultProps: HistogramVisStyleControlsProps = {
    styleOptions: {
      ...defaultHistogramChartStyles,
      titleOptions: {
        show: true,
        titleName: '',
      },
    },
    onStyleChange: jest.fn(),
    numericalColumns: mockNumericalColumns,
    categoricalColumns: [],
    dateColumns: [],
    axisColumnMappings: mockAxisColumnMappings,
    updateVisualization: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('render correct bucket panel for two numerical fields', async () => {
    const propsWithNumBucket = {
      ...defaultProps,
      axisColumnMappings: {
        ...mockAxisColumnMappings,
      },
    };

    render(<HistogramVisStyleControls {...propsWithNumBucket} />);

    expect(screen.getByTestId('mockBucketOptionsPanel')).toBeInTheDocument();
    expect(screen.getByTestId('bucketType')).toHaveTextContent('num');
    expect(screen.getByTestId('mockUpdateBucketSize')).toBeInTheDocument();
    expect(screen.getByTestId('mockUpdateBucketCount')).toBeInTheDocument();
    expect(screen.getByTestId('mockUpdateAggregation')).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('mockUpdateBucketSize'));
    expect(defaultProps.onStyleChange).toHaveBeenCalledWith({
      bucket: { aggregationType: 'sum', bucketSize: 100 },
    });

    await userEvent.click(screen.getByTestId('mockUpdateBucketCount'));
    expect(defaultProps.onStyleChange).toHaveBeenCalledWith({
      bucket: { aggregationType: 'sum', bucketCount: 20 },
    });

    await userEvent.click(screen.getByTestId('mockUpdateAggregation'));
    expect(defaultProps.onStyleChange).toHaveBeenCalledWith({
      bucket: { aggregationType: 'sum' },
    });
  });

  test('render correct bucket panel for one numerical fields', async () => {
    const mockSingleAxisColumnMappings: AxisColumnMappings = {
      [AxisRole.X]: mockNumericalColumns[0],
    };

    const propsWithNumBucket = {
      ...defaultProps,
      axisColumnMappings: {
        ...mockSingleAxisColumnMappings,
      },
    };

    render(<HistogramVisStyleControls {...propsWithNumBucket} />);

    expect(screen.getByTestId('mockBucketOptionsPanel')).toBeInTheDocument();
    expect(screen.getByTestId('bucketType')).toHaveTextContent('single');
    expect(screen.getByTestId('mockUpdateBucketSize')).toBeInTheDocument();
    expect(screen.getByTestId('mockUpdateBucketCount')).toBeInTheDocument();
    expect(screen.queryByTestId('mockUpdateAggregation')).not.toBeInTheDocument();

    await userEvent.click(screen.getByTestId('mockUpdateBucketSize'));
    expect(defaultProps.onStyleChange).toHaveBeenCalledWith({
      bucket: { aggregationType: 'sum', bucketSize: 100 },
    });

    await userEvent.click(screen.getByTestId('mockUpdateBucketCount'));
    expect(defaultProps.onStyleChange).toHaveBeenCalledWith({
      bucket: { aggregationType: 'sum', bucketCount: 20 },
    });
  });
});
