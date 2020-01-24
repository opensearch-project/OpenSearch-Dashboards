import { boolean, color, number, select } from '@storybook/addon-knobs';
import { DateTime } from 'luxon';
import React from 'react';

import {
  AnnotationDomainTypes,
  AreaSeries,
  Axis,
  BarSeries,
  Chart,
  DARK_THEME,
  getAxisId,
  getGroupId,
  getSpecId,
  HistogramBarSeries,
  HistogramModeAlignments,
  LIGHT_THEME,
  LineAnnotation,
  LineSeries,
  niceTimeFormatByDay,
  Position,
  RectAnnotation,
  ScaleType,
  Settings,
  timeFormatter,
  TooltipType,
} from '../src';
import { SeededDataGenerator, getRandomNumber } from '../src/mocks/utils';
import * as TestDatasets from '../src/utils/data_samples/test_dataset';
import { KIBANA_METRICS } from '../src/utils/data_samples/test_dataset_kibana';
import { TEST_DATASET_DISCOVER } from '../src/utils/data_samples/test_dataset_discover_per_30s';
import { FilterPredicate } from '../src/chart_types/xy_chart/utils/specs';
import { getChartRotationKnob } from './common';

const dateFormatter = timeFormatter('HH:mm:ss');

const dataGen = new SeededDataGenerator();
function generateDataWithAdditional(num: number) {
  return [...dataGen.generateSimpleSeries(num), { x: num, y: 0.25, g: 0 }, { x: num + 1, y: 8, g: 0 }];
}
const frozenDataSmallVolume = generateDataWithAdditional(10);
const frozenDataMediumVolume = generateDataWithAdditional(50);
const frozenDataHighVolume = generateDataWithAdditional(1500);

const frozenData: { [key: string]: any[] } = {
  s: frozenDataSmallVolume,
  m: frozenDataMediumVolume,
  h: frozenDataHighVolume,
};

export default {
  title: 'Bar Chart',
  parameters: {
    info: {
      source: false,
    },
  },
};

export const basic = () => {
  const darkmode = boolean('darkmode', false);
  const className = darkmode ? 'story-chart-dark' : 'story-chart';
  const toggleSpec = boolean('toggle bar spec', true);
  const data1 = [
    { x: 0, y: 2 },
    { x: 1, y: 7 },
    { x: 2, y: 3 },
    { x: 3, y: 6 },
  ];
  const data2 = data1.map((datum) => ({ ...datum, y: datum.y - 1 }));
  const data = toggleSpec ? data1 : data2;
  const specId = toggleSpec ? 'bars1' : 'bars2';
  return (
    <Chart className={className}>
      <BarSeries
        id={getSpecId(specId)}
        name={'Simple bar series'}
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={data}
      />
    </Chart>
  );
};
basic.story = {
  name: 'basic',
};

export const withValueLabel = () => {
  const showValueLabel = boolean('show value label', true);
  const isAlternatingValueLabel = boolean('alternating value label', false);
  const isValueContainedInElement = boolean('contain value label within bar element', false);
  const hideClippedValue = boolean('hide clipped value', false);

  const displayValueSettings = {
    showValueLabel,
    isAlternatingValueLabel,
    isValueContainedInElement,
    hideClippedValue,
  };

  const debug = boolean('debug', false);

  const theme = {
    barSeriesStyle: {
      displayValue: {
        fontSize: number('value font size', 10),
        fontFamily: `'Open Sans', Helvetica, Arial, sans-serif`,
        fontStyle: 'normal',
        padding: 0,
        fill: color('value color', '#000'),
        offsetX: number('offsetX', 0),
        offsetY: number('offsetY', 0),
      },
    },
  };

  const dataSize = select(
    'data volume size',
    {
      'small volume': 's',
      'medium volume': 'm',
      'high volume': 'h',
    },
    's',
  );
  const data = frozenData[dataSize];

  const isSplitSeries = boolean('split series', false);
  const isStackedSeries = boolean('stacked series', false);

  const splitSeriesAccessors = isSplitSeries ? ['g'] : undefined;
  const stackAccessors = isStackedSeries ? ['x'] : undefined;
  return (
    <Chart renderer="canvas" className={'story-chart'}>
      <Settings theme={theme} debug={debug} rotation={getChartRotationKnob()} showLegend />
      <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'Bottom axis'} showOverlappingTicks={true} />
      <Axis
        id={getAxisId('left2')}
        title={'Left axis'}
        position={Position.Left}
        tickFormat={(d: any) => Number(d).toFixed(2)}
      />
      <BarSeries
        id={getSpecId('bars')}
        displayValueSettings={displayValueSettings}
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        splitSeriesAccessors={splitSeriesAccessors}
        stackAccessors={stackAccessors}
        data={data}
        yScaleToDataExtent={false}
      />
      <BarSeries
        id={getSpecId('bars2')}
        displayValueSettings={displayValueSettings}
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        stackAccessors={['x']}
        splitSeriesAccessors={['g']}
        data={[
          { x: 0, y: 2, g: 'a' },
          { x: 1, y: 7, g: 'a' },
          { x: 2, y: 3, g: 'a' },
          { x: 3, y: 6, g: 'a' },
          { x: 0, y: 4, g: 'b' },
          { x: 1, y: 5, g: 'b' },
          { x: 2, y: 8, g: 'b' },
          { x: 3, y: 2, g: 'b' },
        ]}
      />
    </Chart>
  );
};
withValueLabel.story = {
  name: 'with value label',
};

export const withAxis = () => {
  const darkmode = boolean('darkmode', false);
  const className = darkmode ? 'story-chart-dark' : 'story-chart';
  const defaultTheme = darkmode ? DARK_THEME : LIGHT_THEME;
  return (
    <Chart className={className}>
      <Settings theme={defaultTheme} />
      <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'Bottom axis'} showOverlappingTicks={true} />
      <Axis
        id={getAxisId('left2')}
        title={'Left axis'}
        position={Position.Left}
        tickFormat={(d: any) => Number(d).toFixed(2)}
      />

      <BarSeries
        id={getSpecId('bars')}
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={[
          { x: 0, y: 2 },
          { x: 1, y: 7 },
          { x: 2, y: 3 },
          { x: 3, y: 6 },
        ]}
      />
    </Chart>
  );
};
withAxis.story = {
  name: 'with axis',
};

export const withOrdinalXAxis = () => {
  return (
    <Chart className={'story-chart'}>
      <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'Bottom axis'} showOverlappingTicks={true} />
      <Axis
        id={getAxisId('left2')}
        title={'Left axis'}
        position={Position.Left}
        tickFormat={(d: any) => Number(d).toFixed(2)}
      />

      <BarSeries
        id={getSpecId('bars')}
        xScaleType={ScaleType.Ordinal}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={[
          { x: 'a', y: 2 },
          { x: 'b', y: 7 },
          { x: 'c', y: 3 },
          { x: 'd', y: 6 },
        ]}
      />
    </Chart>
  );
};
withOrdinalXAxis.story = {
  name: 'with ordinal x axis',
};

export const withLinearXAxis = () => {
  const theme = {
    ...LIGHT_THEME,
    scales: {
      histogramPadding: number('histogram padding', 0, {
        range: true,
        min: 0,
        max: 1,
        step: 0.01,
      }),
      barsPadding: number('bar padding', 0, {
        range: true,
        min: 0,
        max: 1,
        step: 0.01,
      }),
    },
  };
  return (
    <Chart className={'story-chart'}>
      <Settings rotation={getChartRotationKnob()} theme={theme} />
      <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'Bottom axis'} showOverlappingTicks={true} />
      <Axis
        id={getAxisId('left2')}
        title={'Left axis'}
        position={Position.Left}
        tickFormat={(d: any) => Number(d).toFixed(2)}
      />

      <BarSeries
        id={getSpecId('bars')}
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={[
          { x: 1, y: 2 },
          { x: 2, y: 7 },
          { x: 4, y: 3 },
          { x: 9, y: 6 },
        ]}
      />
    </Chart>
  );
};
withLinearXAxis.story = {
  name: 'with linear x axis',
};

export const withLinearXAxisNoLinearInterval = () => (
  <Chart className={'story-chart'}>
    <Settings xDomain={{ max: 100 }} />
    <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'Bottom axis'} showOverlappingTicks={true} />
    <Axis
      id={getAxisId('left2')}
      title={'Left axis'}
      position={Position.Left}
      tickFormat={(d: any) => Number(d).toFixed(2)}
    />

    <BarSeries
      id={getSpecId('bars')}
      xScaleType={ScaleType.Linear}
      yScaleType={ScaleType.Linear}
      xAccessor="x"
      yAccessors={['y']}
      data={[
        { x: 0, y: 2 },
        { x: 10, y: 7 },
        { x: 11.5, y: 9 },
        { x: 13.5, y: 3 },
        { x: 50, y: 6 },
        { x: 66, y: 13 },
        { x: 90, y: 4 },
      ]}
    />
  </Chart>
);
withLinearXAxisNoLinearInterval.story = {
  name: 'with linear x axis no linear interval',
};

export const withTimeXAxis = () => {
  const formatter = timeFormatter(niceTimeFormatByDay(1));
  return (
    <Chart className={'story-chart'}>
      <Settings debug={boolean('debug', false)} />
      <Axis
        id={getAxisId('bottom')}
        position={Position.Bottom}
        title={'Bottom axis'}
        showOverlappingTicks={boolean('showOverlappingTicks bottom axis', false)}
        showOverlappingLabels={boolean('showOverlappingLabels bottom axis', false)}
        tickFormat={formatter}
      />
      <Axis
        id={getAxisId('left2')}
        title={'Left axis'}
        position={Position.Left}
        tickFormat={(d: any) => Number(d).toFixed(2)}
      />

      <BarSeries
        id={getSpecId('bars')}
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        data={KIBANA_METRICS.metrics.kibana_os_load[0].data}
      />
    </Chart>
  );
};
withTimeXAxis.story = {
  name: 'with time x axis',
};

export const withLogYAxis = () => {
  return (
    <Chart className={'story-chart'}>
      <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'Bottom axis'} showOverlappingTicks={true} />
      <Axis
        id={getAxisId('left2')}
        title={'Left axis'}
        position={Position.Left}
        tickFormat={(d: any) => Number(d).toFixed(2)}
      />

      <BarSeries
        id={getSpecId('bars')}
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Log}
        xAccessor="x"
        yAccessors={['y']}
        data={[
          { x: 1, y: 0 },
          { x: 2, y: 1 },
          { x: 3, y: 2 },
          { x: 4, y: 3 },
          { x: 5, y: 4 },
          { x: 6, y: 5 },
          { x: 7, y: 6 },
          { x: 8, y: 7 },
        ]}
        yScaleToDataExtent={true}
      />
    </Chart>
  );
};
withLogYAxis.story = {
  name: 'with log y axis',
};

export const withStackedLogYAxis = () => {
  return (
    <Chart className={'story-chart'}>
      <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'Bottom axis'} showOverlappingTicks={true} />
      <Axis
        id={getAxisId('left2')}
        title={'Left axis'}
        position={Position.Left}
        tickFormat={(d: any) => Number(d).toFixed(2)}
      />

      <BarSeries
        id={getSpecId('bars')}
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Log}
        xAccessor="x"
        yAccessors={['y']}
        splitSeriesAccessors={['g']}
        stackAccessors={['x']}
        data={[
          { x: 1, y: 0, g: 'a' },
          { x: 1, y: 0, g: 'b' },
          { x: 2, y: 1, g: 'a' },
          { x: 2, y: 1, g: 'b' },
          { x: 3, y: 2, g: 'a' },
          { x: 3, y: 2, g: 'b' },
          { x: 4, y: 3, g: 'a' },
          { x: 4, y: 0, g: 'b' },
          { x: 5, y: 4, g: 'a' },
          { x: 5, y: 0.5, g: 'b' },
          { x: 6, y: 5, g: 'a' },
          { x: 6, y: 1, g: 'b' },
          { x: 7, y: 6, g: 'b' },
          { x: 8, y: 7, g: 'a' },
          { x: 8, y: 10, g: 'b' },
          { x: 9, y: 4, g: 'a' },
        ]}
        yScaleToDataExtent={true}
      />
    </Chart>
  );
};
withStackedLogYAxis.story = {
  name: 'with stacked log y axis',
};

export const withAxisAndLegend = () => {
  return (
    <Chart className={'story-chart'}>
      <Settings showLegend={true} legendPosition={Position.Right} />
      <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'Bottom axis'} showOverlappingTicks={true} />
      <Axis
        id={getAxisId('left2')}
        title={'Left axis'}
        position={Position.Left}
        tickFormat={(d: any) => Number(d).toFixed(2)}
      />

      <BarSeries
        id={getSpecId('bars')}
        name={'Simple bar series'}
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={[
          { x: 0, y: 2 },
          { x: 1, y: 7 },
          { x: 2, y: 3 },
          { x: 3, y: 6 },
        ]}
      />
    </Chart>
  );
};
withAxisAndLegend.story = {
  name: 'with axis and legend',
};

export const stackedWithAxisAndLegend = () => {
  return (
    <Chart className={'story-chart'}>
      <Settings showLegend={true} legendPosition={Position.Right} />
      <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'Bottom axis'} showOverlappingTicks={true} />
      <Axis
        id={getAxisId('left2')}
        title={'Left axis'}
        position={Position.Left}
        tickFormat={(d: any) => Number(d).toFixed(2)}
      />

      <BarSeries
        id={getSpecId('bars')}
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        stackAccessors={['x']}
        splitSeriesAccessors={['g']}
        data={[
          { x: 0, y: 2, g: 'a' },
          { x: 1, y: 7, g: 'a' },
          { x: 2, y: 3, g: 'a' },
          { x: 3, y: 6, g: 'a' },
          { x: 0, y: 4, g: 'b' },
          { x: 1, y: 5, g: 'b' },
          { x: 2, y: 8, g: 'b' },
          { x: 3, y: 2, g: 'b' },
        ]}
      />
    </Chart>
  );
};
stackedWithAxisAndLegend.story = {
  name: 'stacked with axis and legend',
};

export const stackedAsPercentage = () => {
  const stackedAsPercentage = boolean('stacked as percentage', true);
  const clusterBars = boolean('cluster', true);
  return (
    <Chart className={'story-chart'}>
      <Settings showLegend={true} legendPosition={Position.Right} />
      <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'Bottom axis'} showOverlappingTicks={true} />
      <Axis
        id={getAxisId('left2')}
        title={'Left axis'}
        position={Position.Left}
        tickFormat={(d: any) => (stackedAsPercentage && !clusterBars ? `${Number(d * 100).toFixed(0)} %` : d)}
      />

      <BarSeries
        id={getSpecId('bars')}
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        stackAccessors={clusterBars ? [] : ['x']}
        stackAsPercentage={clusterBars ? false : stackedAsPercentage}
        splitSeriesAccessors={['g']}
        data={[
          { x: 0, y: 2, g: 'a' },
          { x: 1, y: 7, g: 'a' },
          { x: 2, y: 3, g: 'a' },
          { x: 3, y: 6, g: 'a' },
          { x: 0, y: 4, g: 'b' },
          { x: 1, y: 5, g: 'b' },
          { x: 2, y: 8, g: 'b' },
          { x: 3, y: 2, g: 'b' },
        ]}
      />
    </Chart>
  );
};
stackedAsPercentage.story = {
  name: 'stacked as percentage',
};

export const clusteredWithAxisAndLegend = () => {
  const theme = {
    ...LIGHT_THEME,
    scales: {
      histogramPadding: number('histogram padding', 0.05, {
        range: true,
        min: 0,
        max: 1,
        step: 0.01,
      }),
      barsPadding: number('bar padding', 0.25, {
        range: true,
        min: 0,
        max: 1,
        step: 0.01,
      }),
    },
  };
  return (
    <Chart className={'story-chart'}>
      <Settings showLegend={true} legendPosition={Position.Right} theme={theme} rotation={getChartRotationKnob()} />
      <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'Bottom axis'} showOverlappingTicks={true} />
      <Axis
        id={getAxisId('left2')}
        title={'Left axis'}
        position={Position.Left}
        tickFormat={(d: any) => Number(d).toFixed(2)}
      />

      <BarSeries
        id={getSpecId('bars')}
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        splitSeriesAccessors={['g']}
        data={[
          { x: 0, y: 2, g: 'a' },
          { x: 1, y: 7, g: 'a' },
          { x: 2, y: 3, g: 'a' },
          { x: 3, y: 6, g: 'a' },
          { x: 0, y: 4, g: 'b' },
          { x: 1, y: 5, g: 'b' },
          { x: 2, y: 8, g: 'b' },
          { x: 3, y: 2, g: 'b' },
        ]}
      />
    </Chart>
  );
};
clusteredWithAxisAndLegend.story = {
  name: 'clustered with axis and legend',
};

export const clusteredMultipleSeriesSpecs = () => {
  return (
    <Chart className={'story-chart'}>
      <Settings showLegend={true} legendPosition={Position.Right} />
      <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'elements'} showOverlappingTicks={true} />
      <Axis
        id={getAxisId('left2')}
        title={'count'}
        position={Position.Left}
        tickFormat={(d: any) => Number(d).toFixed(2)}
      />

      <BarSeries
        id={getSpecId('bar series 1')}
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={[
          { x: 0, y: 2 },
          { x: 1, y: 7 },
          { x: 2, y: 3 },
          { x: 3, y: 6 },
        ]}
      />
      <BarSeries
        id={getSpecId('bar series 2')}
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={[
          { x: 0, y: 1 },
          { x: 1, y: 2 },
          { x: 2, y: 3 },
          { x: 3, y: 4 },
        ]}
      />
      <BarSeries
        id={getSpecId('bar series 3')}
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        splitSeriesAccessors={['g']}
        data={[
          { x: 0, y: 1, g: 'a' },
          { x: 1, y: 2, g: 'a' },
          { x: 2, y: 3, g: 'a' },
          { x: 3, y: 4, g: 'a' },
          { x: 0, y: 5, g: 'b' },
          { x: 1, y: 8, g: 'b' },
          { x: 2, y: 9, g: 'b' },
          { x: 3, y: 2, g: 'b' },
        ]}
      />
    </Chart>
  );
};
clusteredMultipleSeriesSpecs.story = {
  name: 'clustered multiple series specs',
};

export const timeClusteredUsingVariousSpecs = () => {
  const formatter = timeFormatter(niceTimeFormatByDay(1));
  return (
    <Chart className={'story-chart'}>
      <Settings debug={boolean('debug', false)} />
      <Axis
        id={getAxisId('bottom')}
        position={Position.Bottom}
        title={'Bottom axis'}
        showOverlappingTicks={boolean('showOverlappingTicks bottom axis', false)}
        showOverlappingLabels={boolean('showOverlappingLabels bottom axis', false)}
        tickFormat={formatter}
      />
      <Axis
        id={getAxisId('left2')}
        title={'Left axis'}
        position={Position.Left}
        tickFormat={(d: any) => Number(d).toFixed(2)}
      />

      <BarSeries
        id={getSpecId(KIBANA_METRICS.metrics.kibana_os_load[0].metric.label)}
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        data={KIBANA_METRICS.metrics.kibana_os_load[0].data}
      />
      <BarSeries
        id={getSpecId(KIBANA_METRICS.metrics.kibana_os_load[1].metric.label)}
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        data={KIBANA_METRICS.metrics.kibana_os_load[1].data}
      />
      <BarSeries
        id={getSpecId(KIBANA_METRICS.metrics.kibana_os_load[2].metric.label)}
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        data={KIBANA_METRICS.metrics.kibana_os_load[2].data}
      />
    </Chart>
  );
};
timeClusteredUsingVariousSpecs.story = {
  name: 'time clustered using various specs',
};

export const timeStackedUsingVariousSpecs = () => {
  const formatter = timeFormatter(niceTimeFormatByDay(1));
  return (
    <Chart className={'story-chart'}>
      <Settings debug={boolean('debug', false)} />
      <Axis
        id={getAxisId('bottom')}
        position={Position.Bottom}
        title={'Bottom axis'}
        showOverlappingTicks={boolean('showOverlappingTicks bottom axis', false)}
        showOverlappingLabels={boolean('showOverlappingLabels bottom axis', false)}
        tickFormat={formatter}
      />
      <Axis
        id={getAxisId('left2')}
        title={'Left axis'}
        position={Position.Left}
        tickFormat={(d: any) => Number(d).toFixed(2)}
      />

      <BarSeries
        id={getSpecId(KIBANA_METRICS.metrics.kibana_os_load[2].metric.label)}
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        stackAccessors={[0]}
        data={KIBANA_METRICS.metrics.kibana_os_load[2].data.slice(0, 20)}
      />
      <BarSeries
        id={getSpecId(KIBANA_METRICS.metrics.kibana_os_load[1].metric.label)}
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        stackAccessors={[0]}
        data={KIBANA_METRICS.metrics.kibana_os_load[1].data.slice(0, 20)}
      />
      <BarSeries
        id={getSpecId(KIBANA_METRICS.metrics.kibana_os_load[0].metric.label)}
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        stackAccessors={[0]}
        data={KIBANA_METRICS.metrics.kibana_os_load[0].data.slice(0, 20)}
      />
    </Chart>
  );
};
timeStackedUsingVariousSpecs.story = {
  name: 'time stacked using various specs',
};

export const barChart1y0g = () => {
  return (
    <Chart className={'story-chart'}>
      <Settings showLegend={true} legendPosition={Position.Right} />
      <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'Bottom axis'} showOverlappingTicks={true} />
      <Axis
        id={getAxisId('left2')}
        title={'Left axis'}
        position={Position.Left}
        tickFormat={(d: any) => Number(d).toFixed(2)}
      />

      <BarSeries
        id={getSpecId('bars1')}
        xScaleType={ScaleType.Ordinal}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={TestDatasets.BARCHART_1Y0G}
      />
    </Chart>
  );
};
barChart1y0g.story = {
  name: '1y0g',
};

export const barChart1y1g = () => {
  return (
    <Chart className={'story-chart'}>
      <Settings showLegend={true} legendPosition={Position.Right} />
      <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'Bottom axis'} showOverlappingTicks={true} />
      <Axis
        id={getAxisId('left2')}
        title={'Left axis'}
        position={Position.Left}
        tickFormat={(d: any) => Number(d).toFixed(2)}
      />

      <BarSeries
        id={getSpecId('bars1')}
        xScaleType={ScaleType.Ordinal}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        splitSeriesAccessors={['g']}
        data={TestDatasets.BARCHART_1Y1G}
      />
    </Chart>
  );
};
barChart1y1g.story = {
  name: '1y1g',
};

export const barChart1y2g = () => {
  return (
    <Chart className={'story-chart'}>
      <Settings showLegend={true} legendPosition={Position.Right} />
      <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'Bottom axis'} showOverlappingTicks={true} />
      <Axis
        id={getAxisId('left2')}
        title={'Left axis'}
        position={Position.Left}
        tickFormat={(d: any) => Number(d).toFixed(2)}
      />

      <BarSeries
        id={getSpecId('bars1')}
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        splitSeriesAccessors={['g1', 'g2']}
        data={TestDatasets.BARCHART_1Y2G}
      />
    </Chart>
  );
};
barChart1y2g.story = {
  name: '1y2g',
};

export const barChart2y0g = () => {
  return (
    <Chart className={'story-chart'}>
      <Settings showLegend={true} legendPosition={Position.Right} />
      <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'Bottom axis'} showOverlappingTicks={true} />
      <Axis
        id={getAxisId('left2')}
        title={'Left axis'}
        position={Position.Left}
        tickFormat={(d: any) => Number(d).toFixed(2)}
      />

      <BarSeries
        id={getSpecId('bars1')}
        xScaleType={ScaleType.Ordinal}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y1', 'y2']}
        data={TestDatasets.BARCHART_2Y0G}
      />
    </Chart>
  );
};
barChart2y0g.story = {
  name: '2y0g',
};

export const barChart2y1g = () => {
  return (
    <Chart className={'story-chart'}>
      <Settings showLegend={true} legendPosition={Position.Right} />
      <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'Bottom axis'} showOverlappingTicks={true} />
      <Axis
        id={getAxisId('left2')}
        title={'Left axis'}
        position={Position.Left}
        tickFormat={(d: any) => Number(d).toFixed(2)}
      />

      <BarSeries
        id={getSpecId('bars1')}
        xScaleType={ScaleType.Ordinal}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y1', 'y2']}
        splitSeriesAccessors={['g']}
        data={TestDatasets.BARCHART_2Y1G}
      />
    </Chart>
  );
};
barChart2y1g.story = {
  name: '2y1g',
};

export const barChart2y2g = () => {
  const isVisibleFunction: FilterPredicate = (series) => {
    return series.splitAccessors.size > 0
      ? series.specId === getSpecId('bars') &&
          series.yAccessor === 'y1' &&
          series.splitAccessors.get('g1') === 'cloudflare.com'
      : series.specId === getSpecId('bars') && series.yAccessor === 'y1';
  };

  return (
    <Chart className={'story-chart'}>
      <Settings showLegend={true} legendPosition={Position.Right} />
      <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'Bottom axis'} showOverlappingTicks={true} />
      <Axis
        id={getAxisId('left2')}
        title={'Left axis'}
        position={Position.Left}
        tickFormat={(d: any) => Number(d).toFixed(2)}
      />

      <BarSeries
        id={getSpecId('bars1')}
        xScaleType={ScaleType.Ordinal}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y1', 'y2']}
        splitSeriesAccessors={['g1', 'g2', 'g3']}
        data={TestDatasets.BARCHART_2Y2G}
        filterSeriesInTooltip={isVisibleFunction}
      />
    </Chart>
  );
};
barChart2y2g.story = {
  name: '2y2g',
};

export const tooltipSeriesVisibility = () => {
  const isVisibleFunction: FilterPredicate = (series) => {
    return series.splitAccessors.get('g1') === 'cloudflare.com';
  };
  return (
    <Chart className={'story-chart'}>
      <Settings showLegend={true} legendPosition={Position.Right} />
      <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'Bottom axis'} showOverlappingTicks={true} />
      <Axis
        id={getAxisId('left2')}
        title={'Left axis'}
        position={Position.Left}
        tickFormat={(d: any) => Number(d).toFixed(2)}
      />

      <BarSeries
        id={getSpecId('bars1')}
        xScaleType={ScaleType.Ordinal}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y1', 'y2']}
        splitSeriesAccessors={['g1', 'g2', 'g3']}
        data={TestDatasets.BARCHART_2Y2G}
        filterSeriesInTooltip={isVisibleFunction}
      />
    </Chart>
  );
};
tooltipSeriesVisibility.story = {
  name: 'tooltip series visibility',
};

export const withHighDataVolume = () => {
  const dg = new SeededDataGenerator();
  const data = dg.generateSimpleSeries(15000);
  const tooltipProps = {
    type: TooltipType.Follow,
  };
  return (
    <Chart className={'story-chart'}>
      <Settings tooltip={tooltipProps} />
      <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'Bottom axis'} />
      <Axis
        id={getAxisId('left2')}
        title={'Left axis'}
        position={Position.Left}
        tickFormat={(d: any) => Number(d).toFixed(2)}
      />

      <BarSeries
        id={getSpecId('bars')}
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        splitSeriesAccessors={['g']}
        data={data}
      />
    </Chart>
  );
};
withHighDataVolume.story = {
  name: 'with high data volume',
  info: {
    source: false,
  },
};

export const singleDataChartLinear = () => {
  const hasCustomDomain = boolean('has custom domain', false);
  const xDomain = hasCustomDomain
    ? {
        min: 0,
      }
    : undefined;

  const theme = {
    scales: {
      barsPadding: number('bars padding', 0.25, {
        range: true,
        min: 0,
        max: 1,
        step: 0.1,
      }),
    },
  };
  return (
    <Chart className={'story-chart'}>
      <Settings xDomain={xDomain} rotation={getChartRotationKnob()} theme={theme} />
      <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'Bottom axis'} />
      <Axis
        id={getAxisId('left2')}
        title={'Left axis'}
        position={Position.Left}
        tickFormat={(d: any) => Number(d).toFixed(2)}
      />

      <BarSeries
        id={getSpecId('bars')}
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        splitSeriesAccessors={['g']}
        data={[{ x: 1, y: 10 }]}
      />
    </Chart>
  );
};
singleDataChartLinear.story = {
  name: 'single data chart [linear]',
};

export const singleDataChartOrdinal = () => {
  const hasCustomDomain = boolean('has custom domain', false);
  const xDomain = hasCustomDomain ? ['a', 'b'] : undefined;

  const theme = {
    scales: {
      barsPadding: number('bars padding', 0.25, {
        range: true,
        min: 0,
        max: 1,
        step: 0.1,
      }),
    },
  };
  return (
    <Chart className={'story-chart'}>
      <Settings xDomain={xDomain} rotation={getChartRotationKnob()} theme={theme} />
      <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'Bottom axis'} />
      <Axis
        id={getAxisId('left2')}
        title={'Left axis'}
        position={Position.Left}
        tickFormat={(d: any) => Number(d).toFixed(2)}
      />

      <BarSeries
        id={getSpecId('bars')}
        xScaleType={ScaleType.Ordinal}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={[{ x: 'a', y: 10, g: 1 }]}
      />
    </Chart>
  );
};
singleDataChartOrdinal.story = {
  name: 'single data chart [ordinal]',
};

export const singleDataClusteredChart = () => {
  return (
    <Chart className={'story-chart'}>
      <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'Bottom axis'} />
      <Axis
        id={getAxisId('left2')}
        title={'Left axis'}
        position={Position.Left}
        tickFormat={(d: any) => Number(d).toFixed(2)}
      />

      <BarSeries
        id={getSpecId('bars')}
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        splitSeriesAccessors={['g']}
        data={[
          { x: 1, y: 10, g: 'a' },
          { x: 1, y: 5, g: 'b' },
          { x: 1, y: 3, g: 'c' },
          { x: 1, y: 10, g: 'd' },
        ]}
      />
    </Chart>
  );
};
singleDataClusteredChart.story = {
  name: 'single data clusterd chart',
};

export const singleDataStackedChart = () => {
  return (
    <Chart className={'story-chart'}>
      <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'Bottom axis'} />
      <Axis
        id={getAxisId('left2')}
        title={'Left axis'}
        position={Position.Left}
        tickFormat={(d: any) => Number(d).toFixed(2)}
      />

      <BarSeries
        id={getSpecId('bars')}
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        splitSeriesAccessors={['g']}
        stackAccessors={['x']}
        data={[
          { x: 1, y: 10, g: 'a' },
          { x: 1, y: 5, g: 'b' },
          { x: 1, y: 3, g: 'c' },
          { x: 1, y: 10, g: 'd' },
        ]}
      />
    </Chart>
  );
};
singleDataStackedChart.story = {
  name: 'single data stacked chart',
};

export const singldedatachartstackedtoextent = () => {
  return (
    <Chart className={'story-chart'}>
      <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'Bottom axis'} />
      <Axis
        id={getAxisId('left2')}
        title={'Left axis'}
        position={Position.Left}
        tickFormat={(d: any) => Number(d).toFixed(2)}
      />

      <BarSeries
        id={getSpecId('bars')}
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        splitSeriesAccessors={['g']}
        stackAccessors={['x']}
        data={[
          { x: 0, y: 10, g: 'a' },
          { x: 0, y: 20, g: 'b' },
          { x: 0, y: 30, g: 'c' },
        ]}
        yScaleToDataExtent={true}
      />
    </Chart>
  );
};
singldedatachartstackedtoextent.story = {
  name: 'single data stacked chart scale to extent',
};

export const singleDataClusteredChartScaleToExtent = () => {
  return (
    <Chart className={'story-chart'}>
      <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'Bottom axis'} />
      <Axis
        id={getAxisId('left2')}
        title={'Left axis'}
        position={Position.Left}
        tickFormat={(d: any) => Number(d).toFixed(2)}
      />

      <BarSeries
        id={getSpecId('bars')}
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        splitSeriesAccessors={['g']}
        data={[
          { x: 0, y: 10, g: 'a' },
          { x: 0, y: 20, g: 'b' },
          { x: 0, y: 30, g: 'c' },
        ]}
        yScaleToDataExtent={true}
      />
    </Chart>
  );
};
singleDataClusteredChartScaleToExtent.story = {
  name: 'single data clustered chart scale to extent',
};

export const negativeAndPositiveXValues = () => {
  return (
    <Chart className={'story-chart'}>
      <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'Bottom axis'} />
      <Axis
        id={getAxisId('left2')}
        title={'Left axis'}
        position={Position.Left}
        tickFormat={(d: any) => Number(d).toFixed(2)}
      />

      <BarSeries
        id={getSpecId('bars')}
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        splitSeriesAccessors={['g']}
        stackAccessors={['x']}
        data={[
          { x: -3, y: 1 },
          { x: 0, y: 4 },
          { x: -2, y: 2 },
          { x: 1, y: 3 },
          { x: 2, y: 2 },
          { x: -1, y: 3 },
          { x: 3, y: 1 },
        ]}
      />
    </Chart>
  );
};
negativeAndPositiveXValues.story = {
  name: 'negative and positive x values',
};

export const scaleToExtent = () => {
  const yScaleToDataExtent = boolean('yScaleDataToExtent', true);
  const mixed = [
    { x: 0, y: -4 },
    { x: 1, y: -3 },
    { x: 2, y: 2 },
    { x: 3, y: 1 },
  ];

  const allPositive = mixed.map((datum) => ({ x: datum.x, y: Math.abs(datum.y) }));
  const allNegative = mixed.map((datum) => ({ x: datum.x, y: Math.abs(datum.y) * -1 }));

  const dataChoice = select(
    'data',
    {
      mixed: 'mixed',
      allPositive: 'all positive',
      allNegative: 'all negative',
    },
    'all negative',
  );

  let data = mixed;
  switch (dataChoice) {
    case 'all positive':
      data = allPositive;
      break;
    case 'all negative':
      data = allNegative;
      break;
  }
  return (
    <Chart className={'story-chart'}>
      <Axis id={getAxisId('top')} position={Position.Top} title={'Top axis'} />
      <Axis
        id={getAxisId('left2')}
        title={'Left axis'}
        position={Position.Left}
        tickFormat={(d: any) => Number(d).toFixed(2)}
      />

      <BarSeries
        id={getSpecId('bars')}
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        splitSeriesAccessors={['g']}
        stackAccessors={['x']}
        data={data}
        yScaleToDataExtent={yScaleToDataExtent}
      />
    </Chart>
  );
};
scaleToExtent.story = {
  name: 'scale to extent',
};

export const bandBarChart = () => {
  const data = KIBANA_METRICS.metrics.kibana_os_load[0].data.map((d: any) => {
    return {
      x: d[0],
      max: d[1] + 4 + 4 * getRandomNumber(),
      min: d[1] - 4 - 4 * getRandomNumber(),
    };
  });
  const lineData = KIBANA_METRICS.metrics.kibana_os_load[0].data.map((d: any) => {
    return [d[0], d[1]];
  });
  const scaleToDataExtent = boolean('scale to extent', true);
  return (
    <Chart className={'story-chart'}>
      <Axis
        id={getAxisId('bottom')}
        title={'timestamp per 1 minute'}
        position={Position.Bottom}
        showOverlappingTicks={true}
        tickFormat={dateFormatter}
      />
      <Axis
        id={getAxisId('left')}
        title={KIBANA_METRICS.metrics.kibana_os_load[0].metric.title}
        position={Position.Left}
        tickFormat={(d: any) => Number(d).toFixed(2)}
      />

      <BarSeries
        id={getSpecId('bars')}
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        xAccessor={'x'}
        yAccessors={['max']}
        y0Accessors={['min']}
        data={data}
        // this is a temporary hack to display names for min and max values
        splitSeriesAccessors={['fake']}
        yScaleToDataExtent={scaleToDataExtent}
      />

      <LineSeries
        id={getSpecId('average')}
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        data={lineData}
        yScaleToDataExtent={scaleToDataExtent}
      />
    </Chart>
  );
};
bandBarChart.story = {
  name: 'band bar chart',
};

export const testLinear = () => {
  const data = [
    [1, 1],
    [2, 2],
    [3, 3],
    [4, 4],
    [5, 5],
    [6, 4],
    [7, 3],
    [8, 2],
    [9, 1],
  ];
  return (
    <Chart className={'story-chart'}>
      <Axis id={getAxisId('bottom')} title={'index'} position={Position.Bottom} />
      <Axis
        id={getAxisId('left')}
        title={KIBANA_METRICS.metrics.kibana_os_load[0].metric.title}
        position={Position.Left}
        tickFormat={(d: any) => Number(d).toFixed(2)}
      />
      <BarSeries
        id={getSpecId('lines')}
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        data={data}
      />
    </Chart>
  );
};
testLinear.story = {
  name: '[test] - linear',
};

export const testTime = () => {
  const start = DateTime.fromISO('2019-01-01T00:00:00.000', { zone: 'utc' });
  const data = [
    [start.toMillis(), 1],
    [start.plus({ minute: 1 }).toMillis(), 2],
    [start.plus({ minute: 2 }).toMillis(), 3],
    [start.plus({ minute: 3 }).toMillis(), 4],
    [start.plus({ minute: 4 }).toMillis(), 5],
    [start.plus({ minute: 5 }).toMillis(), 4],
    [start.plus({ minute: 6 }).toMillis(), 3],
    [start.plus({ minute: 7 }).toMillis(), 2],
    [start.plus({ minute: 8 }).toMillis(), 1],
  ];
  return (
    <Chart className={'story-chart'}>
      <Axis id={getAxisId('bottom')} title={'index'} position={Position.Bottom} tickFormat={dateFormatter} />
      <Axis
        id={getAxisId('left')}
        title={KIBANA_METRICS.metrics.kibana_os_load[0].metric.title}
        position={Position.Left}
        tickFormat={(d: any) => Number(d).toFixed(2)}
      />
      <BarSeries
        id={getSpecId('data')}
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        data={data}
      />
    </Chart>
  );
};
testTime.story = {
  name: '[test] - time',
};

export const testLinearClustered = () => {
  const data9 = [
    [1, 1, 3],
    [2, 2, 4],
    [3, 3, 5],
    [4, 4, 6],
    [5, 5, 7],
    [6, 4, 6],
    [7, 3, 5],
    [8, 2, 4],
    [9, 1, 3],
  ];
  return (
    <Chart className={'story-chart'}>
      <Axis id={getAxisId('bottom')} title={'index'} position={Position.Bottom} />
      <Axis
        id={getAxisId('left')}
        title={KIBANA_METRICS.metrics.kibana_os_load[0].metric.title}
        position={Position.Left}
        tickFormat={(d: any) => Number(d).toFixed(2)}
      />
      <BarSeries
        id={getSpecId('lines')}
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1, 2]}
        data={data9}
      />
    </Chart>
  );
};
testLinearClustered.story = {
  name: '[test] - linear clustered',
};

export const testTimeClustered = () => {
  const start = DateTime.fromISO('2019-01-01T00:00:00.000', { zone: 'utc' });
  const data = [
    [start.toMillis(), 1, 4],
    [start.plus({ minute: 1 }).toMillis(), 2, 5],
    [start.plus({ minute: 2 }).toMillis(), 3, 6],
    [start.plus({ minute: 3 }).toMillis(), 4, 7],
    [start.plus({ minute: 4 }).toMillis(), 5, 8],
    [start.plus({ minute: 5 }).toMillis(), 4, 7],
    [start.plus({ minute: 6 }).toMillis(), 3, 6],
    [start.plus({ minute: 7 }).toMillis(), 2, 5],
    [start.plus({ minute: 8 }).toMillis(), 1, 4],
  ];
  return (
    <Chart className={'story-chart'}>
      <Axis id={getAxisId('bottom')} title={'index'} position={Position.Bottom} tickFormat={dateFormatter} />
      <Axis
        id={getAxisId('left')}
        title={KIBANA_METRICS.metrics.kibana_os_load[0].metric.title}
        position={Position.Left}
        tickFormat={(d: any) => Number(d).toFixed(2)}
      />
      <BarSeries
        id={getSpecId('data')}
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1, 2]}
        data={data}
      />
    </Chart>
  );
};
testTimeClustered.story = {
  name: '[test] - time clustered',
};

export const testClusteredBarChartWithNullBars = () => {
  const data = [
    [1, 1, 3, 'a'],
    [2, null, 4, 'a'],
    [3, 3, 5, 'a'],
    [4, 4, 6, 'a'],
    [1, 1, 3, 'b'],
    [2, 2, 4, 'b'],
    [3, 3, 5, 'b'],
    [4, 4, 6, 'b'],
  ];
  return (
    <Chart className={'story-chart'}>
      <Axis id={getAxisId('bottom')} title={'index'} position={Position.Bottom} />
      <Axis
        id={getAxisId('left')}
        title={KIBANA_METRICS.metrics.kibana_os_load[0].metric.title}
        position={Position.Left}
        tickFormat={(d: any) => Number(d).toFixed(2)}
      />
      <BarSeries
        id={getSpecId('lines')}
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        splitSeriesAccessors={[3]}
        data={data}
      />
    </Chart>
  );
};
testClusteredBarChartWithNullBars.story = {
  name: '[test] - clustered bar chart with null bars',
};

export const testStackedBarChartWithNullBars = () => {
  const data = [
    [1, 1, 3, 'a'],
    [2, null, 4, 'a'],
    [3, 3, 5, 'a'],
    [4, 4, 6, 'a'],
    [1, 1, 3, 'b'],
    [2, 2, 4, 'b'],
    [3, null, 5, 'b'],
    [4, 4, 6, 'b'],
  ];
  return (
    <Chart className={'story-chart'}>
      <Axis id={getAxisId('bottom')} title={'index'} position={Position.Bottom} />
      <Axis
        id={getAxisId('left')}
        title={KIBANA_METRICS.metrics.kibana_os_load[0].metric.title}
        position={Position.Left}
        tickFormat={(d: any) => Number(d).toFixed(2)}
      />
      <BarSeries
        id={getSpecId('lines')}
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        splitSeriesAccessors={[3]}
        stackAccessors={[0]}
        data={data}
      />
    </Chart>
  );
};
testStackedBarChartWithNullBars.story = {
  name: '[test] - stacked bar chart with null bars',
};

export const testSwitchOrdinalLinearAxis = () => {
  return (
    <Chart className={'story-chart'}>
      <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'Bottom axis'} showOverlappingTicks={true} />
      <Axis
        id={getAxisId('left2')}
        title={'Left axis'}
        position={Position.Left}
        tickFormat={(d: any) => Number(d).toFixed(2)}
      />

      <BarSeries
        id={getSpecId('bars')}
        xScaleType={select(
          'scaleType',
          {
            linear: ScaleType.Linear,
            ordinal: ScaleType.Ordinal,
          },
          ScaleType.Linear,
        )}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={[
          { x: 0, y: 2 },
          { x: 1, y: 7 },
          { x: 2, y: 3 },
          { x: 3, y: 6 },
        ]}
      />
    </Chart>
  );
};
testSwitchOrdinalLinearAxis.story = {
  name: '[test] switch ordinal/linear x axis',
};

export const testHistogramModeLinear = () => {
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
        id={getSpecId('other-series')}
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={pointData}
        histogramModeAlignment={pointAlignment}
      />
    ) : (
      <AreaSeries
        id={getSpecId('other-series')}
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
    <Chart className={'story-chart'}>
      <Settings rotation={getChartRotationKnob()} theme={theme} debug={boolean('debug', true)} />
      <LineAnnotation
        id={'line-annotation'}
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
        id={'rect'}
      />
      <Axis id={getAxisId('discover-histogram-left-axis')} position={Position.Left} title={'left axis'} />
      <Axis id={getAxisId('discover-histogram-bottom-axis')} position={Position.Bottom} title={'bottom axis'} />
      {hasHistogramBarSeries && (
        <HistogramBarSeries
          id={getSpecId('histo')}
          xScaleType={ScaleType.Time}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          data={pointData}
          name={'histogram'}
        />
      )}
      <BarSeries
        id={getSpecId('bars-1')}
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={pointData}
        name={'bars 1'}
        enableHistogramMode={boolean('bars-1 enableHistogramMode', false)}
      />
      <BarSeries
        id={getSpecId('bars-2')}
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
testHistogramModeLinear.story = {
  name: '[test] histogram mode (linear)',
};

export const testHistogramModeOrdinal = () => {
  const data = [
    { x: 'a', y: 2 },
    { x: 'b', y: 7 },
    { x: 'c', y: 0 },
    { x: 'd', y: 6 },
  ];
  const theme = {
    scales: {
      barsPadding: number('bars padding', 0.25, {
        range: true,
        min: 0,
        max: 1,
        step: 0.1,
      }),
    },
  };

  const hasHistogramBarSeries = boolean('hasHistogramBarSeries', false);
  return (
    <Chart className={'story-chart'}>
      <Settings rotation={getChartRotationKnob()} theme={theme} debug={boolean('debug', true)} />
      <Axis id={getAxisId('discover-histogram-left-axis')} position={Position.Left} title={'left axis'} />
      <Axis id={getAxisId('discover-histogram-bottom-axis')} position={Position.Bottom} title={'bottom axis'} />
      {hasHistogramBarSeries && (
        <HistogramBarSeries
          id={getSpecId('histo')}
          xScaleType={ScaleType.Ordinal}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          data={data}
          name={'histogram'}
        />
      )}
      <BarSeries
        id={getSpecId('bars-1')}
        xScaleType={ScaleType.Ordinal}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={data}
        name={'bars 1'}
        enableHistogramMode={boolean('bars-1 enableHistogramMode', false)}
      />
      <BarSeries
        id={getSpecId('bars-2')}
        xScaleType={ScaleType.Ordinal}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={data}
        enableHistogramMode={boolean('bars-2 enableHistogramMode', false)}
      />
    </Chart>
  );
};
testHistogramModeOrdinal.story = {
  name: '[test] histogram mode (ordinal)',
};

export const testDiscover = () => {
  const data = TEST_DATASET_DISCOVER.series[0].values;

  const formatter = timeFormatter(niceTimeFormatByDay(1));

  const xDomain = {
    minInterval: 30000,
  };

  const useCustomMinInterval = boolean('use custom minInterval of 30s', true);
  return (
    <Chart className={'story-chart'}>
      <Settings xDomain={useCustomMinInterval ? xDomain : undefined} />
      <Axis
        id={getAxisId('discover-histogram-left-axis')}
        position={Position.Left}
        title={TEST_DATASET_DISCOVER.yAxisLabel}
      />
      <Axis
        id={getAxisId('discover-histogram-bottom-axis')}
        position={Position.Bottom}
        title={TEST_DATASET_DISCOVER.xAxisLabel}
        tickFormat={formatter}
      />

      <HistogramBarSeries
        id={getSpecId('discover-histogram')}
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={data}
        timeZone={'local'}
        name={'Count'}
      />
    </Chart>
  );
};
testDiscover.story = {
  name: '[test] discover',
};

export const testSingleHistogramBarChart = () => {
  const formatter = timeFormatter(niceTimeFormatByDay(1));

  const xDomain = {
    minInterval: 60000,
  };

  return (
    <Chart className={'story-chart'}>
      <Settings xDomain={xDomain} />
      <Axis
        id={getAxisId('bottom')}
        title={'timestamp per 1 minute'}
        position={Position.Bottom}
        showOverlappingTicks={true}
        tickFormat={formatter}
      />
      <Axis
        id={getAxisId('left')}
        title={KIBANA_METRICS.metrics.kibana_os_load[0].metric.title}
        position={Position.Left}
      />
      <HistogramBarSeries
        id={getSpecId('bars')}
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        data={KIBANA_METRICS.metrics.kibana_os_load[0].data.slice(0, 1)}
      />
    </Chart>
  );
};
testSingleHistogramBarChart.story = {
  name: '[test] single histogram bar chart',
};

export const MinHeight = () => {
  const minBarHeight = number('minBarHeight', 5);
  const data = [
    [1, 100000],
    [2, 10000],
    [3, 1000],
    [4, 100],
    [5, 10],
    [6, 1],
    [7, 0],
    [8, 1],
    [9, 0],
  ];
  return (
    <Chart className={'story-chart'}>
      <Axis id={getAxisId('bottom')} title="Bottom" position={Position.Bottom} />
      <Axis id={getAxisId('left')} title="Left" position={Position.Left} />
      <BarSeries
        id={getSpecId('bars')}
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        data={data}
        minBarHeight={minBarHeight}
      />
    </Chart>
  );
};
MinHeight.story = {
  name: 'Min Height',
};

export const testMinHeightPositiveAndNegativeValues = () => {
  const minBarHeight = number('minBarHeight', 10);
  const data = [
    [1, -100000],
    [2, -10000],
    [3, -1000],
    [4, -100],
    [5, -10],
    [6, -1],
    [7, 0],
    [8, -1],
    [9, 0],
    [10, 0],
    [11, 1],
    [12, 0],
    [13, 1],
    [14, 10],
    [15, 100],
    [16, 1000],
    [17, 10000],
    [18, 100000],
  ];
  return (
    <Chart className={'story-chart'}>
      <Axis id={getAxisId('bottom')} title="Bottom" position={Position.Bottom} />
      <Axis id={getAxisId('left')} title="Left" position={Position.Left} />
      <BarSeries
        id={getSpecId('bars')}
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        data={data}
        minBarHeight={minBarHeight}
      />
    </Chart>
  );
};
testMinHeightPositiveAndNegativeValues.story = {
  name: '[Test] Min Height - positive and negative values',
};

export const stackedOnlyGroupedAreas = () => {
  const data1 = [
    [1, 2],
    [2, 2],
    [3, 3],
    [4, 5],
    [5, 5],
    [6, 3],
    [7, 8],
    [8, 2],
    [9, 1],
  ];
  const data2 = [
    [1, 1],
    [2, 2],
    [3, 3],
    [4, 4],
    [5, 5],
    [6, 4],
    [7, 3],
    [8, 2],
    [9, 4],
  ];
  const data3 = [
    [1, 6],
    [2, 6],
    [3, 3],
    [4, 2],
    [5, 1],
    [6, 1],
    [7, 5],
    [8, 6],
    [9, 7],
  ];
  const data4 = [
    [1, 2],
    [2, 6],
    [3, 2],
    [4, 9],
    [5, 2],
    [6, 3],
    [7, 1],
    [8, 2],
    [9, 7],
  ];
  const data5 = [
    [1, 1],
    [2, 7],
    [3, 5],
    [4, 6],
    [5, 5],
    [6, 4],
    [7, 2],
    [8, 4],
    [9, 8],
  ];
  return (
    <Chart renderer="canvas" className={'story-chart'}>
      <Axis id={getAxisId('bottom')} title={'index'} position={Position.Bottom} />
      <Axis
        id={getAxisId('left')}
        title={KIBANA_METRICS.metrics.kibana_os_load[0].metric.title}
        position={Position.Left}
        tickFormat={(d: any) => Number(d).toFixed(2)}
        domain={{ min: 0, max: 15 }}
      />
      <Axis
        id={getAxisId('left group b')}
        groupId={getGroupId('gb')}
        title={KIBANA_METRICS.metrics.kibana_os_load[0].metric.title}
        position={Position.Left}
        tickFormat={(d: any) => Number(d).toFixed(2)}
        hide={true}
        domain={{ min: 0, max: 15 }}
      />
      <BarSeries
        id={getSpecId('stacked bar 1')}
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        stackAccessors={[0]}
        data={data1}
        yScaleToDataExtent={false}
      />
      <BarSeries
        id={getSpecId('stacked bar 2')}
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        stackAccessors={[0]}
        data={data2}
        yScaleToDataExtent={false}
      />

      <BarSeries
        id={getSpecId('stacked bar A')}
        groupId={getGroupId('gb')}
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        stackAccessors={[0]}
        data={data4}
        yScaleToDataExtent={false}
      />
      <BarSeries
        id={getSpecId('stacked bar B')}
        groupId={getGroupId('gb')}
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        stackAccessors={[0]}
        data={data5}
        yScaleToDataExtent={false}
      />
      <BarSeries
        id={getSpecId('non stacked bar')}
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        data={data3}
        yScaleToDataExtent={false}
      />
    </Chart>
  );
};
stackedOnlyGroupedAreas.story = {
  name: 'stacked only grouped areas',
};

export const testTooltipAndRotation = () => {
  return (
    <Chart className={'story-chart'}>
      <Settings rotation={getChartRotationKnob()} />
      <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'Bottom axis'} showOverlappingTicks={true} />
      <Axis
        id={getAxisId('left2')}
        title={'Left axis'}
        position={Position.Left}
        tickFormat={(d: any) => Number(d).toFixed(2)}
      />

      <BarSeries
        id={getSpecId('bars1')}
        xScaleType={ScaleType.Ordinal}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y1', 'y2']}
        splitSeriesAccessors={['g']}
        data={TestDatasets.BARCHART_2Y1G}
      />
    </Chart>
  );
};
testTooltipAndRotation.story = {
  name: '[test] tooltip and rotation',
};
