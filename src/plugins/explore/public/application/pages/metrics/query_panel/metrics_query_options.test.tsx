/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MetricsQueryOptions, formatStepSeconds } from './metrics_query_options';

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
    const onStepSettingsChange = jest.fn();
    const onLegendFormatChange = jest.fn();
    render(
      <MetricsQueryOptions
        resolvedStepLabel="30s"
        minStepInvalid={false}
        onStepSettingsChange={onStepSettingsChange}
        onLegendFormatChange={onLegendFormatChange}
        {...overrides}
      />
    );
    return { onStepSettingsChange, onLegendFormatChange };
  };

  it('emits an integer maxDataPoints and preserves minStep', () => {
    const { onStepSettingsChange } = setup({ minStep: '1m' });
    fireEvent.click(screen.getByTestId('metricsQueryOptionsButton'));
    fireEvent.change(screen.getByTestId('metricsStepMaxDataPointsInput'), {
      target: { value: '500' },
    });
    expect(onStepSettingsChange).toHaveBeenCalledWith({ maxDataPoints: 500, minStep: '1m' });
  });

  it('clears maxDataPoints when the field is emptied', () => {
    const { onStepSettingsChange } = setup({ maxDataPoints: 500 });
    fireEvent.click(screen.getByTestId('metricsQueryOptionsButton'));
    fireEvent.change(screen.getByTestId('metricsStepMaxDataPointsInput'), {
      target: { value: '' },
    });
    expect(onStepSettingsChange).toHaveBeenCalledWith({
      maxDataPoints: undefined,
      minStep: undefined,
    });
  });

  it('emits a trimmed minStep string', () => {
    const { onStepSettingsChange } = setup();
    fireEvent.click(screen.getByTestId('metricsQueryOptionsButton'));
    fireEvent.change(screen.getByTestId('metricsStepMinStepInput'), {
      target: { value: ' 60s ' },
    });
    expect(onStepSettingsChange).toHaveBeenCalledWith({ maxDataPoints: undefined, minStep: '60s' });
  });

  it('shows a validation error when the min step is invalid', () => {
    setup({ minStep: 'bad', minStepInvalid: true });
    fireEvent.click(screen.getByTestId('metricsQueryOptionsButton'));
    expect(screen.getByText(/Enter a duration with a unit/)).toBeInTheDocument();
  });

  it('shows min step and max data points fields', () => {
    setup();
    fireEvent.click(screen.getByTestId('metricsQueryOptionsButton'));
    expect(screen.getByTestId('metricsStepMinStepInput')).toBeInTheDocument();
    expect(screen.getByTestId('metricsStepMaxDataPointsInput')).toBeInTheDocument();
  });

  it('shows the current legend format in the field', () => {
    setup({ legendFormat: '{{instance}}' });
    fireEvent.click(screen.getByTestId('metricsQueryOptionsButton'));
    expect(screen.getByTestId('metricsLegendFormatInput')).toHaveValue('{{instance}}');
  });

  it('emits the entered legend template', () => {
    const { onLegendFormatChange } = setup();
    fireEvent.click(screen.getByTestId('metricsQueryOptionsButton'));
    fireEvent.change(screen.getByTestId('metricsLegendFormatInput'), {
      target: { value: '{{job}}-{{instance}}' },
    });
    expect(onLegendFormatChange).toHaveBeenCalledWith('{{job}}-{{instance}}');
  });

  it('emits undefined when the legend field is emptied', () => {
    const { onLegendFormatChange } = setup({ legendFormat: '{{instance}}' });
    fireEvent.click(screen.getByTestId('metricsQueryOptionsButton'));
    fireEvent.change(screen.getByTestId('metricsLegendFormatInput'), {
      target: { value: '' },
    });
    expect(onLegendFormatChange).toHaveBeenCalledWith(undefined);
  });
});
