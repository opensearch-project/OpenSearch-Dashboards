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
    expect(formatStepSeconds(undefined)).toBe('—');
    expect(formatStepSeconds(0)).toBe('—');
    expect(formatStepSeconds(NaN)).toBe('—');
  });
});

describe('MetricsQueryOptions', () => {
  const setup = (overrides = {}) => {
    const onMaxDataPointsChange = jest.fn();
    const onDefaultMinStepChange = jest.fn();
    render(
      <MetricsQueryOptions
        onMaxDataPointsChange={onMaxDataPointsChange}
        onDefaultMinStepChange={onDefaultMinStepChange}
        {...overrides}
      />
    );
    fireEvent.click(screen.getByTestId('metricsQueryOptionsButton'));
    return { onMaxDataPointsChange, onDefaultMinStepChange };
  };

  it('emits an integer maxDataPoints', () => {
    const { onMaxDataPointsChange } = setup();
    fireEvent.change(screen.getByTestId('metricsStepMaxDataPointsInput'), {
      target: { value: '500' },
    });
    expect(onMaxDataPointsChange).toHaveBeenCalledWith(500);
  });

  it('clears maxDataPoints when the field is emptied', () => {
    const { onMaxDataPointsChange } = setup({ maxDataPoints: 500 });
    fireEvent.change(screen.getByTestId('metricsStepMaxDataPointsInput'), {
      target: { value: '' },
    });
    expect(onMaxDataPointsChange).toHaveBeenCalledWith(undefined);
  });

  it('shows the resolution the last run used as the auto placeholder', () => {
    setup({ resolvedMaxDataPoints: 1440 });
    expect(screen.getByTestId('metricsStepMaxDataPointsInput')).toHaveAttribute(
      'placeholder',
      'auto = 1440'
    );
  });

  it('emits the datasource default min step once it parses', () => {
    const { onDefaultMinStepChange } = setup();
    const input = screen.getByTestId('metricsDefaultMinStepInput');
    fireEvent.change(input, { target: { value: ' 30s ' } });
    expect(onDefaultMinStepChange).toHaveBeenCalledWith('30s');
  });

  it('clears the datasource default when the field is emptied', () => {
    const { onDefaultMinStepChange } = setup({ defaultMinStep: '30s' });
    fireEvent.change(screen.getByTestId('metricsDefaultMinStepInput'), { target: { value: '' } });
    expect(onDefaultMinStepChange).toHaveBeenCalledWith(undefined);
  });

  it('does not persist a half-typed datasource default', () => {
    const { onDefaultMinStepChange } = setup();
    const input = screen.getByTestId('metricsDefaultMinStepInput');
    fireEvent.change(input, { target: { value: '30' } });
    expect(onDefaultMinStepChange).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: '30s' } });
    expect(onDefaultMinStepChange).toHaveBeenCalledWith('30s');
  });

  it('flags an invalid datasource default without persisting it', () => {
    const { onDefaultMinStepChange } = setup();
    fireEvent.change(screen.getByTestId('metricsDefaultMinStepInput'), {
      target: { value: 'banana' },
    });
    expect(screen.getByText(/Enter a duration with a unit/)).toBeInTheDocument();
    expect(onDefaultMinStepChange).not.toHaveBeenCalled();
  });

  it('keeps the typed text visible while it is still invalid', () => {
    setup();
    const input = screen.getByTestId('metricsDefaultMinStepInput');
    fireEvent.change(input, { target: { value: '30' } });
    expect(input).toHaveValue('30');
  });

  it('names the connection the default is saved on', () => {
    setup({ connectionName: 'local' });
    expect(screen.getByText(/Saved on local/)).toBeInTheDocument();
  });
});

describe('RowQueryOptions', () => {
  const setup = (overrides = {}) => {
    const onChange = jest.fn();
    render(
      <RowQueryOptions
        stepLabel="30s"
        rateIntervalLabel="4m"
        isFromLastRun
        onChange={onChange}
        {...overrides}
      />
    );
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

  it('shows the inherited datasource default as the min step placeholder', () => {
    setup({ inheritedMinStep: '30s' });
    fireEvent.click(screen.getByTestId('metricsRowQueryOptionsButton'));
    expect(screen.getByTestId('metricsStepMinStepInput')).toHaveAttribute('placeholder', '30s');
    expect(screen.getByText(/Empty inherits 30s/)).toBeInTheDocument();
  });

  it('reports the resolved step and rate window from the last run', () => {
    setup();
    fireEvent.click(screen.getByTestId('metricsRowQueryOptionsButton'));
    const readout = screen.getByTestId('metricsStepResolved');
    expect(readout).toHaveTextContent('Step: 30s ($__interval)');
    expect(readout).toHaveTextContent('Rate window: 4m ($__rate_interval)');
    expect(readout).toHaveTextContent('From the last run of this query.');
  });

  it('marks the readout as an estimate before the query has run', () => {
    setup({ isFromLastRun: false });
    fireEvent.click(screen.getByTestId('metricsRowQueryOptionsButton'));
    expect(screen.getByTestId('metricsStepResolved')).toHaveTextContent(
      'Estimated; run the query to confirm.'
    );
  });
});
