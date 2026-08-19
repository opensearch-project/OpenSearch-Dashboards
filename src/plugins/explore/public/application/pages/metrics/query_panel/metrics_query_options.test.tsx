/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MetricsQueryOptions, RowQueryOptions, formatStepSeconds } from './metrics_query_options';

describe('formatStepSeconds', () => {
  it('formats compact durations', () => {
    expect(formatStepSeconds(15)).toBe('15s');
    expect(formatStepSeconds(60)).toBe('1m');
    expect(formatStepSeconds(90)).toBe('1m 30s');
    expect(formatStepSeconds(3661)).toBe('1h 1m 1s');
  });

  it('renders a placeholder for missing or invalid steps', () => {
    expect(formatStepSeconds(null)).toBe('—');
    expect(formatStepSeconds(0)).toBe('—');
    expect(formatStepSeconds(NaN)).toBe('—');
  });
});

describe('MetricsQueryOptions', () => {
  const setup = (overrides = {}) => {
    const onMaxDataPointsChange = jest.fn();
    render(<MetricsQueryOptions onMaxDataPointsChange={onMaxDataPointsChange} {...overrides} />);
    return { onMaxDataPointsChange };
  };

  it('emits an integer maxDataPoints', () => {
    const { onMaxDataPointsChange } = setup();
    fireEvent.click(screen.getByTestId('metricsQueryOptionsButton'));
    fireEvent.change(screen.getByTestId('metricsStepMaxDataPointsInput'), {
      target: { value: '500' },
    });
    expect(onMaxDataPointsChange).toHaveBeenCalledWith(500);
  });

  it('clears maxDataPoints when the field is emptied', () => {
    const { onMaxDataPointsChange } = setup({ maxDataPoints: 500 });
    fireEvent.click(screen.getByTestId('metricsQueryOptionsButton'));
    fireEvent.change(screen.getByTestId('metricsStepMaxDataPointsInput'), {
      target: { value: '' },
    });
    expect(onMaxDataPointsChange).toHaveBeenCalledWith(undefined);
  });
});

describe('RowQueryOptions', () => {
  const setup = (overrides = {}) => {
    const onChange = jest.fn();
    render(<RowQueryOptions resolvedStepLabel="30s" onChange={onChange} {...overrides} />);
    return { onChange };
  };

  it('shows legend and min step fields', () => {
    setup();
    fireEvent.click(screen.getByTestId('metricsRowQueryOptionsButton'));
    expect(screen.getByTestId('metricsLegendFormatInput')).toBeInTheDocument();
    expect(screen.getByTestId('metricsStepMinStepInput')).toBeInTheDocument();
  });

  it('emits a trimmed minStep string alongside the current legend', () => {
    const { onChange } = setup({ legendFormat: '{{job}}' });
    fireEvent.click(screen.getByTestId('metricsRowQueryOptionsButton'));
    fireEvent.change(screen.getByTestId('metricsStepMinStepInput'), {
      target: { value: ' 60s ' },
    });
    expect(onChange).toHaveBeenCalledWith({ minStep: '60s', legendFormat: '{{job}}' });
  });

  it('flags an invalid min step', () => {
    setup({ minStep: 'bad' });
    fireEvent.click(screen.getByTestId('metricsRowQueryOptionsButton'));
    expect(screen.getByText(/Enter a duration with a unit/)).toBeInTheDocument();
  });

  it('shows the current legend format in the field', () => {
    setup({ legendFormat: '{{instance}}' });
    fireEvent.click(screen.getByTestId('metricsRowQueryOptionsButton'));
    expect(screen.getByTestId('metricsLegendFormatInput')).toHaveValue('{{instance}}');
  });

  it('emits the entered legend template alongside the current min step', () => {
    const { onChange } = setup({ minStep: '1m' });
    fireEvent.click(screen.getByTestId('metricsRowQueryOptionsButton'));
    fireEvent.change(screen.getByTestId('metricsLegendFormatInput'), {
      target: { value: '{{job}}-{{instance}}' },
    });
    expect(onChange).toHaveBeenCalledWith({ minStep: '1m', legendFormat: '{{job}}-{{instance}}' });
  });

  it('emits undefined when the legend field is emptied', () => {
    const { onChange } = setup({ legendFormat: '{{instance}}' });
    fireEvent.click(screen.getByTestId('metricsRowQueryOptionsButton'));
    fireEvent.change(screen.getByTestId('metricsLegendFormatInput'), {
      target: { value: '' },
    });
    expect(onChange).toHaveBeenCalledWith({ minStep: undefined, legendFormat: undefined });
  });
});
