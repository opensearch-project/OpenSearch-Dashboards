/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { SeverityHistogram } from './severity_histogram';
import { HistogramResult } from '../hooks/fetch_histogram';

// ECharts can't render in jsdom; stub the chart and assert the legend/composition instead.
jest.mock('./histogram_chart', () => ({
  HistogramChart: (props: any) => (
    <div data-test-subj="mock-histogram-chart" data-chart-id={props.chartId} />
  ),
  SINGLE_SERIES_BUCKET: 'unknown',
}));
jest.mock('../severity', () => ({
  // Mirrors the real map after the bugbash swap: unknown → "regular logs" blue, debug → purple.
  severityColor: (b: string) =>
    (
      ({
        error: '#f13939',
        warn: '#F90',
        info: '#00BD6B',
        debug: '#9170B8',
        unknown: '#0077CC',
      }) as Record<string, string>
    )[b] || '#0077CC',
}));

const services = {} as any;

const severityHistogram: HistogramResult = {
  intervalMs: 60000,
  from: 0,
  to: 900000,
  series: [],
  totals: [
    { name: 'INFO', bucket: 'info', total: 18000 },
    { name: 'ERROR', bucket: 'error', total: 3 },
  ],
};

describe('SeverityHistogram', () => {
  it('renders the ECharts chart wrapper with the card chartId', () => {
    render(
      <SeverityHistogram services={services} histogram={severityHistogram} chartId="my-index" />
    );
    const chart = screen.getByTestId('mock-histogram-chart');
    expect(chart).toBeInTheDocument();
    expect(chart.getAttribute('data-chart-id')).toBe('my-index');
  });

  it('renders one legend entry per severity total with humanized counts', () => {
    render(
      <SeverityHistogram services={services} histogram={severityHistogram} chartId="my-index" />
    );
    expect(screen.getByTestId('logsExploreLegend-INFO')).toHaveTextContent('18K');
    expect(screen.getByTestId('logsExploreLegend-ERROR')).toHaveTextContent('3');
  });

  it("labels the single-series 'count' total as 'logs' and colors it the 'regular logs' blue", () => {
    const { container } = render(
      <SeverityHistogram
        services={services}
        chartId="x"
        histogram={{
          ...severityHistogram,
          // bucket is 'unknown' (as normalizeSeverity('count') yields) — after the swap that IS the
          // prominent "regular logs" blue, matching the single-series bars.
          totals: [{ name: 'count', bucket: 'unknown', total: 1500 }],
        }}
      />
    );
    expect(screen.getByTestId('logsExploreLegend-count')).toHaveTextContent('logs');
    expect(screen.getByTestId('logsExploreLegend-count')).toHaveTextContent('1.5K');
    // The EuiHealth dot uses the "regular logs" blue (#0077CC in the mock), via the unknown bucket.
    const html = container.innerHTML;
    expect(html).toContain('#0077CC');
  });

  it('humanizes millions with an M suffix and thousands ≥10K without a decimal', () => {
    render(
      <SeverityHistogram
        services={services}
        chartId="x"
        histogram={{
          ...severityHistogram,
          totals: [
            { name: 'INFO', bucket: 'info', total: 2_400_000 },
            { name: 'ERROR', bucket: 'error', total: 42_000 },
          ],
        }}
      />
    );
    expect(screen.getByTestId('logsExploreLegend-INFO')).toHaveTextContent('2.4M');
    expect(screen.getByTestId('logsExploreLegend-ERROR')).toHaveTextContent('42K');
  });

  it('humanizes billions with a B suffix', () => {
    render(
      <SeverityHistogram
        services={services}
        chartId="x"
        histogram={{
          ...severityHistogram,
          totals: [
            { name: 'INFO', bucket: 'info', total: 3_200_000_000 },
            { name: 'WARN', bucket: 'warn', total: 45_000_000_000 },
          ],
        }}
      />
    );
    expect(screen.getByTestId('logsExploreLegend-INFO')).toHaveTextContent('3.2B');
    expect(screen.getByTestId('logsExploreLegend-WARN')).toHaveTextContent('45B');
  });

  it('renders raw counts under 1000 without a suffix', () => {
    render(
      <SeverityHistogram
        services={services}
        chartId="x"
        histogram={{ ...severityHistogram, totals: [{ name: 'WARN', bucket: 'warn', total: 7 }] }}
      />
    );
    expect(screen.getByTestId('logsExploreLegend-WARN')).toHaveTextContent('7');
  });

  it('shows the "No data in the selected time range" state when every total is zero (#18)', () => {
    render(
      <SeverityHistogram
        services={services}
        chartId="x"
        histogram={{ ...severityHistogram, totals: [] }}
      />
    );
    // No chart, no legend — just the explicit empty-range message.
    expect(screen.getByTestId('logsExploreHistNoData')).toHaveTextContent(
      'No data in the selected time range'
    );
    expect(screen.queryByTestId('mock-histogram-chart')).not.toBeInTheDocument();
  });

  it('shows the no-data state when totals sum to zero even if series exist', () => {
    render(
      <SeverityHistogram
        services={services}
        chartId="x"
        histogram={{
          ...severityHistogram,
          series: [{ name: 'count', dataPoints: [[0, 0]] }],
          totals: [{ name: 'count', bucket: 'unknown', total: 0 }],
        }}
      />
    );
    expect(screen.getByTestId('logsExploreHistNoData')).toBeInTheDocument();
  });
});
