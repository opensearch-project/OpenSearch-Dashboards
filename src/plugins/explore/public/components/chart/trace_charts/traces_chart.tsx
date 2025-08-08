/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import { Subscription, combineLatest } from 'rxjs';
import {
  Axis,
  Chart,
  HistogramBarSeries,
  LineSeries,
  Position,
  ScaleType,
  Settings,
  TooltipType,
  Theme,
  BrushEndListener,
} from '@elastic/charts';
import { EuiChartThemeType } from '@elastic/eui/dist/eui_charts_theme';
import { euiThemeVars } from '@osd/ui-shared-deps/theme';
import moment from 'moment';
import { ExploreServices } from '../../../types';

interface ChartDataPoint {
  x: number;
  y: number;
}

interface TracesChartProps {
  data: ChartDataPoint[];
  title: string;
  color?: string;
  height?: number;
  chartType?: 'bar' | 'line';
  services: ExploreServices;
  yAxisLabel?: string;
  onBrushEnd?: BrushEndListener;
}

interface TracesChartState {
  chartsTheme: EuiChartThemeType['theme'];
  chartsBaseTheme: Theme;
}

export class TracesChart extends Component<TracesChartProps, TracesChartState> {
  private subscription?: Subscription;

  constructor(props: TracesChartProps) {
    super(props);
    this.state = {
      chartsTheme: props.services.theme.chartsDefaultTheme,
      chartsBaseTheme: props.services.theme.chartsDefaultBaseTheme,
    };
  }

  componentDidMount() {
    this.subscription = combineLatest(
      this.props.services.theme.chartsTheme$,
      this.props.services.theme.chartsBaseTheme$
    ).subscribe(([chartsTheme, chartsBaseTheme]) =>
      this.setState({ chartsTheme, chartsBaseTheme })
    );
  }

  componentWillUnmount() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  public formatXValue = (val: string | number) => {
    return moment(val).format('HH:mm:ss');
  };

  public render() {
    const {
      data,
      title,
      color = '#1f77b4',
      height = 150,
      chartType = 'bar',
      yAxisLabel,
      onBrushEnd,
    } = this.props;
    const { chartsTheme, chartsBaseTheme } = this.state;

    if (!data || data.length === 0) {
      return (
        <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: euiThemeVars.euiColorMediumShade }}>No data to display</span>
        </div>
      );
    }

    // Create a custom theme with our color
    const customTheme = {
      ...chartsTheme,
      colors: {
        ...chartsTheme.colors,
        vizColors: [color],
      },
      axes: {
        ...chartsTheme.axes,
        axisTitle: {
          fill: euiThemeVars.euiTextColor,
        },
      },
    };

    const tooltipProps = {
      type: TooltipType.VerticalCursor,
    };

    return (
      <div style={{ height }}>
        <Chart size="100%">
          <Settings
            tooltip={tooltipProps}
            theme={customTheme}
            baseTheme={chartsBaseTheme}
            showLegend={false}
            onBrushEnd={onBrushEnd}
          />
          <Axis id="left-axis" position={Position.Left} ticks={5} title={yAxisLabel} />
          <Axis
            id="bottom-axis"
            position={Position.Bottom}
            tickFormat={this.formatXValue}
            ticks={6}
          />
          {chartType === 'bar' ? (
            <HistogramBarSeries
              id={`traces-${title.toLowerCase().replace(/\s+/g, '-')}`}
              minBarHeight={2}
              xScaleType={ScaleType.Time}
              yScaleType={ScaleType.Linear}
              xAccessor="x"
              yAccessors={['y']}
              data={data}
              name={title}
            />
          ) : (
            <LineSeries
              id={`traces-${title.toLowerCase().replace(/\s+/g, '-')}`}
              xScaleType={ScaleType.Time}
              yScaleType={ScaleType.Linear}
              xAccessor="x"
              yAccessors={['y']}
              data={data}
              name={title}
            />
          )}
        </Chart>
      </div>
    );
  }
}
