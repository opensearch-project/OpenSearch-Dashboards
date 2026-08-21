/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen } from '@testing-library/react';
import { GaugeChartRender } from './gauge_component';

jest.mock('../echarts_render', () => ({
  EchartsRender: jest.fn(() => <div data-test-subj="gaugeEchartsRender" />),
}));

describe('GaugeChartRender', () => {
  beforeEach(() => {
    global.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      disconnect: jest.fn(),
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the gauge chart and html text overlay', () => {
    render(
      <GaugeChartRender
        spec={{ series: [] }}
        text={{
          value: '9.25',
          title: {
            valueFieldName: 'Value',
          },
          unitFirst: false,
          valueColor: '#111111',
          titleColor: '#222222',
          unitColor: '#111111',
        }}
      />
    );

    expect(screen.getByTestId('gaugeEchartsRender')).toBeInTheDocument();
    expect(screen.getByText('9.25')).toBeInTheDocument();
    expect(screen.getByText('Value')).toBeInTheDocument();
  });

  it('renders suffix units separately from value text', () => {
    render(
      <GaugeChartRender
        spec={{ series: [] }}
        text={{
          value: '30',
          unit: 'ms',
          unitFirst: false,
          valueColor: '#111111',
          titleColor: '#222222',
          unitColor: '#333333',
        }}
      />
    );

    expect(screen.getByText('30')).toHaveClass('gauge-value-number');
    expect(screen.getByText('ms')).toHaveClass('gauge-value-unit--suffix');
  });

  it('renders prefix units before the value', () => {
    render(
      <GaugeChartRender
        spec={{ series: [] }}
        text={{
          value: '30',
          unit: '$',
          unitFirst: true,
          valueColor: '#111111',
          titleColor: '#222222',
          unitColor: '#333333',
        }}
      />
    );

    const value = screen.getByText('30');
    const unit = screen.getByText('$');

    expect(unit.compareDocumentPosition(value)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('uses the series name for split auto titles', () => {
    render(
      <GaugeChartRender
        spec={{ series: [] }}
        seriesName="jpg"
        text={{
          value: '30',
          title: {
            valueFieldName: 'COUNT()',
          },
          unitFirst: false,
          valueColor: '#111111',
          titleColor: '#222222',
          unitColor: '#333333',
        }}
      />
    );

    expect(screen.getByText('jpg')).toBeInTheDocument();
    expect(screen.queryByText('COUNT()')).not.toBeInTheDocument();
    expect(screen.queryByText('jpg COUNT()')).not.toBeInTheDocument();
  });

  it('prefixes custom titles with the series name', () => {
    render(
      <GaugeChartRender
        spec={{ series: [] }}
        seriesName="jpg"
        text={{
          value: '30',
          title: {
            valueFieldName: 'COUNT()',
            customTitle: 'Custom title',
          },
          unitFirst: false,
          valueColor: '#111111',
          titleColor: '#222222',
          unitColor: '#333333',
        }}
      />
    );

    expect(screen.getByText('jpg Custom title')).toBeInTheDocument();
    expect(screen.queryByText('Custom title')).not.toBeInTheDocument();
  });
});
