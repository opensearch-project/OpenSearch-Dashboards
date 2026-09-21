/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen } from '@testing-library/react';
import { AxisRole, VisFieldType } from '../types';
import { MetricChartRender } from './metric_component';
import { defaultMetricChartStyles } from './metric_vis_config';

jest.mock('../echarts_render', () => ({
  EchartsRender: jest.fn(() => <div data-test-subj="metricEchartsRender" />),
}));

describe('MetricChartRender', () => {
  const axisColumnMappings = {
    [AxisRole.Value]: {
      id: 1,
      name: 'COUNT()',
      schema: VisFieldType.Numerical,
      column: 'count',
    },
  };

  beforeEach(() => {
    global.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      disconnect: jest.fn(),
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('uses the query-derived name when the custom metric name is empty', () => {
    render(
      <MetricChartRender
        styles={defaultMetricChartStyles}
        axisColumnMappings={axisColumnMappings}
        spec={{ data: [{ count: 2 }], name: 'COUNT()' }}
      />
    );

    expect(screen.getByText('COUNT()')).toBeInTheDocument();
  });

  it('replaces the query-derived name with the custom metric name', () => {
    render(
      <MetricChartRender
        styles={{ ...defaultMetricChartStyles, title: 'Total requests' }}
        axisColumnMappings={axisColumnMappings}
        spec={{ data: [{ count: 2 }], name: 'COUNT()' }}
      />
    );

    expect(screen.getByText('Total requests')).toBeInTheDocument();
    expect(screen.queryByText('COUNT()')).not.toBeInTheDocument();
  });

  it('uses the query-derived name when the custom metric name is only whitespace', () => {
    render(
      <MetricChartRender
        styles={{ ...defaultMetricChartStyles, title: '   ' }}
        axisColumnMappings={axisColumnMappings}
        spec={{ data: [{ count: 2 }], name: 'COUNT()' }}
      />
    );

    expect(screen.getByText('COUNT()')).toBeInTheDocument();
  });

  it('does not render a custom metric name when text display excludes the name', () => {
    render(
      <MetricChartRender
        styles={{ ...defaultMetricChartStyles, title: 'Total requests', textMode: 'value' }}
        axisColumnMappings={axisColumnMappings}
        spec={{ data: [{ count: 2 }], name: 'COUNT()' }}
      />
    );

    expect(screen.queryByText('Total requests')).not.toBeInTheDocument();
    expect(screen.queryByText('COUNT()')).not.toBeInTheDocument();
  });

  it('prefixes custom metric names with the split series name', () => {
    render(
      <MetricChartRender
        styles={{ ...defaultMetricChartStyles, title: 'Total requests' }}
        axisColumnMappings={axisColumnMappings}
        spec={{ data: [{ count: 2 }], name: 'COUNT()' }}
        seriesName="jpg"
      />
    );

    expect(screen.getByText('jpg Total requests')).toBeInTheDocument();
    expect(screen.queryByText('COUNT()')).not.toBeInTheDocument();
  });
});
