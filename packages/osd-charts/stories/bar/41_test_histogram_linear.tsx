import { boolean, number, select } from '@storybook/addon-knobs';
import React from 'react';

import {
  AnnotationDomainTypes,
  AreaSeries,
  Axis,
  BarSeries,
  Chart,
  HistogramBarSeries,
  HistogramModeAlignments,
  LineAnnotation,
  LineSeries,
  Position,
  RectAnnotation,
  ScaleType,
  Settings,
} from '../../src';
import * as TestDatasets from '../../src/utils/data_samples/test_dataset';
import { getChartRotationKnob } from '../utils/knobs';
import { SB_SOURCE_PANEL } from '../utils/storybook';

// for testing purposes only
export const example = () => {
  const data = TestDatasets.BARCHART_2Y1G;

  const lineAnnotationStyle = {
    line: {
      strokeWidth: 2,
      stroke: '#c80000',
      opacity: 0.3,
    },
  };

  const theme = {
    scales: {
      barsPadding: number('bars padding', 0.25, {
        range: true,
        min: 0,
        max: 1,
        step: 0.1,
      }),
      histogramPadding: number('histogram padding', 0.05, {
        range: true,
        min: 0,
        max: 1,
        step: 0.1,
      }),
    },
  };

  const otherSeriesSelection = select(
    'other series',
    {
      line: 'line',
      area: 'area',
    },
    'line',
  );

  const pointAlignment = select('point series alignment', HistogramModeAlignments, HistogramModeAlignments.Center);
  const pointData = TestDatasets.BARCHART_1Y0G;

  const otherSeries =
    otherSeriesSelection === 'line' ? (
      <LineSeries
        id="other-series"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={pointData}
        histogramModeAlignment={pointAlignment}
      />
    ) : (
      <AreaSeries
        id="other-series"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={pointData}
        histogramModeAlignment={pointAlignment}
      />
    );

  const hasHistogramBarSeries = boolean('hasHistogramBarSeries', false);
  return (
    <Chart className="story-chart">
      <Settings rotation={getChartRotationKnob()} theme={theme} debug={boolean('debug', true)} />
      <LineAnnotation
        id="line-annotation"
        domainType={AnnotationDomainTypes.XDomain}
        dataValues={[{ dataValue: 2 }, { dataValue: 2.5 }, { dataValue: 3.5 }]}
        style={lineAnnotationStyle}
        marker={<div style={{ background: 'red', width: 10, height: 10 }} />}
      />
      <RectAnnotation
        dataValues={[
          {
            coordinates: {
              x0: 0.5,
            },
            details: 'rect annotation',
          },
          {
            coordinates: {
              x1: 3,
            },
            details: 'rect annotation',
          },
        ]}
        id="rect"
      />
      <Axis id="discover-histogram-left-axis" position={Position.Left} title="left axis" />
      <Axis id="discover-histogram-bottom-axis" position={Position.Bottom} title="bottom axis" />
      {hasHistogramBarSeries && (
        <HistogramBarSeries
          id="histo"
          xScaleType={ScaleType.Time}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          data={pointData}
          name="histogram"
        />
      )}
      <BarSeries
        id="bars-1"
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={pointData}
        name="bars 1"
        enableHistogramMode={boolean('bars-1 enableHistogramMode', false)}
      />
      <BarSeries
        id="bars-2"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y1', 'y2']}
        splitSeriesAccessors={['g']}
        data={data}
        enableHistogramMode={boolean('bars-2 enableHistogramMode', false)}
      />
      {otherSeries}
    </Chart>
  );
};

// storybook configuration
example.story = {
  parameters: {
    options: { selectedPanel: SB_SOURCE_PANEL },
  },
};
