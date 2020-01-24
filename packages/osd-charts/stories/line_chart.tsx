import { boolean } from '@storybook/addon-knobs';
import React from 'react';
import {
  Axis,
  Chart,
  CurveType,
  getAxisId,
  getSpecId,
  LineSeries,
  niceTimeFormatByDay,
  Position,
  ScaleType,
  Settings,
  timeFormatter,
} from '../src/';
import { KIBANA_METRICS } from '../src/utils/data_samples/test_dataset_kibana';
import { TSVB_DATASET } from '../src/utils/data_samples/test_dataset_tsvb';
import { getChartRotationKnob } from './common';

const dateFormatter = timeFormatter(niceTimeFormatByDay(1));

export default {
  title: 'Line Chart',
  parameters: {
    info: {
      source: false,
    },
  },
};

export const basic = () => {
  const toggleSpec = boolean('toggle line spec', true);
  const data1 = KIBANA_METRICS.metrics.kibana_os_load[0].data;
  const data2 = data1.map((datum) => [datum[0], datum[1] - 1]);
  const data = toggleSpec ? data1 : data2;
  const specId = toggleSpec ? 'lines1' : 'lines2';

  return (
    <Chart className={'story-chart'}>
      <LineSeries
        id={getSpecId(specId)}
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        data={data}
      />
    </Chart>
  );
};
basic.story = {
  name: 'basic',
};

export const wAxis = () => {
  return (
    <Chart className={'story-chart'}>
      <Axis
        id={getAxisId('bottom')}
        position={Position.Bottom}
        showOverlappingTicks={true}
        tickFormat={dateFormatter}
      />
      <Axis
        id={getAxisId('left')}
        title={KIBANA_METRICS.metrics.kibana_os_load[0].metric.title}
        position={Position.Left}
        tickFormat={(d) => `${Number(d).toFixed(2)}%`}
      />
      <LineSeries
        id={getSpecId('lines')}
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        data={KIBANA_METRICS.metrics.kibana_os_load[0].data.slice(0, 5)}
      />
    </Chart>
  );
};
wAxis.story = {
  name: 'w axis',
};

export const ordinalWAxis = () => {
  return (
    <Chart className={'story-chart'}>
      <Settings rotation={getChartRotationKnob()} />
      <Axis
        id={getAxisId('bottom')}
        position={Position.Bottom}
        showOverlappingTicks={true}
        tickFormat={dateFormatter}
      />
      <Axis
        id={getAxisId('left')}
        title={KIBANA_METRICS.metrics.kibana_os_load[0].metric.title}
        position={Position.Left}
        tickFormat={(d) => `${Number(d).toFixed(2)}%`}
      />
      <LineSeries
        id={getSpecId('lines')}
        xScaleType={ScaleType.Ordinal}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        data={KIBANA_METRICS.metrics.kibana_os_load[0].data.slice(0, 5)}
      />
    </Chart>
  );
};
ordinalWAxis.story = {
  name: 'ordinal w axis',
};

export const linearWAxis = () => {
  return (
    <Chart className={'story-chart'}>
      <Axis
        id={getAxisId('bottom')}
        position={Position.Bottom}
        showOverlappingTicks={true}
        tickFormat={dateFormatter}
      />
      <Axis
        id={getAxisId('left')}
        title={KIBANA_METRICS.metrics.kibana_os_load[0].metric.title}
        position={Position.Left}
        tickFormat={(d) => `${Number(d).toFixed(2)}%`}
      />
      <LineSeries
        id={getSpecId('lines')}
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        data={KIBANA_METRICS.metrics.kibana_os_load[0].data.slice(0, 5)}
      />
    </Chart>
  );
};
linearWAxis.story = {
  name: 'linear w axis',
};

export const wAxisAndLegend = () => {
  return (
    <Chart className={'story-chart'}>
      <Settings showLegend={true} legendPosition={Position.Right} />
      <Axis
        id={getAxisId('bottom')}
        position={Position.Bottom}
        showOverlappingTicks={true}
        tickFormat={dateFormatter}
      />
      <Axis
        id={getAxisId('left')}
        title={KIBANA_METRICS.metrics.kibana_os_load[0].metric.title}
        position={Position.Left}
        tickFormat={(d) => `${Number(d).toFixed(0)}%`}
      />
      <LineSeries
        id={getSpecId('lines')}
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        data={KIBANA_METRICS.metrics.kibana_os_load[0].data}
      />
    </Chart>
  );
};
wAxisAndLegend.story = {
  name: 'w axis and legend',
};

export const curvedwaxisandlegend = () => {
  return (
    <Chart className={'story-chart'}>
      <Settings showLegend={true} legendPosition={Position.Right} />
      <Axis
        id={getAxisId('bottom')}
        position={Position.Bottom}
        showOverlappingTicks={true}
        tickFormat={dateFormatter}
      />
      <Axis
        id={getAxisId('left')}
        title={KIBANA_METRICS.metrics.kibana_os_load[0].metric.title}
        position={Position.Left}
        tickFormat={(d) => `${Number(d).toFixed(0)}%`}
      />

      <LineSeries
        id={getSpecId('monotone x')}
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        data={KIBANA_METRICS.metrics.kibana_os_load[0].data}
        curve={CurveType.CURVE_MONOTONE_X}
      />
      <LineSeries
        id={getSpecId('basis')}
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        data={KIBANA_METRICS.metrics.kibana_os_load[0].data}
        curve={CurveType.CURVE_BASIS}
      />
      <LineSeries
        id={getSpecId('cardinal')}
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        data={KIBANA_METRICS.metrics.kibana_os_load[0].data}
        curve={CurveType.CURVE_CARDINAL}
      />
      <LineSeries
        id={getSpecId('catmull rom')}
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        data={KIBANA_METRICS.metrics.kibana_os_load[0].data}
        curve={CurveType.CURVE_CATMULL_ROM}
      />
      <LineSeries
        id={getSpecId('natural')}
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        data={KIBANA_METRICS.metrics.kibana_os_load[0].data}
        curve={CurveType.CURVE_NATURAL}
      />
      <LineSeries
        id={getSpecId('linear')}
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        data={KIBANA_METRICS.metrics.kibana_os_load[0].data}
        curve={CurveType.LINEAR}
      />
    </Chart>
  );
};
curvedwaxisandlegend.story = {
  name: 'curved w axis and legend',
};

export const multiplewaxisandlegend = () => {
  return (
    <Chart className={'story-chart'}>
      <Settings showLegend={true} legendPosition={Position.Right} />
      <Axis
        id={getAxisId('bottom')}
        position={Position.Bottom}
        showOverlappingTicks={true}
        tickFormat={dateFormatter}
      />
      <Axis
        id={getAxisId('left')}
        title={KIBANA_METRICS.metrics.kibana_os_load[0].metric.title}
        position={Position.Left}
        tickFormat={(d) => `${Number(d).toFixed(0)}%`}
      />

      <LineSeries
        id={getSpecId(KIBANA_METRICS.metrics.kibana_os_load[0].metric.label)}
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        data={KIBANA_METRICS.metrics.kibana_os_load[0].data}
        curve={CurveType.LINEAR}
      />
      <LineSeries
        id={getSpecId(KIBANA_METRICS.metrics.kibana_os_load[1].metric.label)}
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        data={KIBANA_METRICS.metrics.kibana_os_load[1].data}
        curve={CurveType.LINEAR}
      />
      <LineSeries
        id={getSpecId(KIBANA_METRICS.metrics.kibana_os_load[2].metric.label)}
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        data={KIBANA_METRICS.metrics.kibana_os_load[2].data}
        curve={CurveType.LINEAR}
      />
    </Chart>
  );
};
multiplewaxisandlegend.story = {
  name: 'multiple w axis and legend',
};

export const stackedwaxisandlegend = () => {
  return (
    <Chart className={'story-chart'}>
      <Settings showLegend={true} legendPosition={Position.Right} />
      <Axis
        id={getAxisId('bottom')}
        position={Position.Bottom}
        showOverlappingTicks={true}
        tickFormat={dateFormatter}
      />
      <Axis
        id={getAxisId('left')}
        title={KIBANA_METRICS.metrics.kibana_os_load[0].metric.title}
        position={Position.Left}
        tickFormat={(d) => `${Number(d).toFixed(0)}%`}
      />
      <LineSeries
        id={getSpecId(KIBANA_METRICS.metrics.kibana_os_load[2].metric.label)}
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        data={KIBANA_METRICS.metrics.kibana_os_load[2].data}
        curve={CurveType.LINEAR}
        stackAccessors={[0]}
      />
      <LineSeries
        id={getSpecId(KIBANA_METRICS.metrics.kibana_os_load[1].metric.label)}
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        data={KIBANA_METRICS.metrics.kibana_os_load[1].data}
        curve={CurveType.LINEAR}
        stackAccessors={[0]}
      />
      <LineSeries
        id={getSpecId(KIBANA_METRICS.metrics.kibana_os_load[0].metric.label)}
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        data={KIBANA_METRICS.metrics.kibana_os_load[0].data}
        curve={CurveType.LINEAR}
        stackAccessors={[0]}
      />
    </Chart>
  );
};
stackedwaxisandlegend.story = {
  name: 'stacked w axis and legend',
};

export const multiserieswithlogvalues = () => {
  return (
    <Chart className={'story-chart'}>
      <Settings showLegend={true} legendPosition={Position.Right} />
      <Axis
        id={getAxisId('bottom')}
        position={Position.Bottom}
        showOverlappingTicks={true}
        tickFormat={dateFormatter}
      />
      <Axis
        id={getAxisId('left')}
        title={KIBANA_METRICS.metrics.kibana_os_load[0].metric.title}
        position={Position.Left}
        tickFormat={(d) => `${Number(d).toFixed(0)}%`}
      />
      {TSVB_DATASET.series.map((series) => {
        return (
          <LineSeries
            key={series.id}
            id={getSpecId(series.label)}
            xScaleType={ScaleType.Time}
            yScaleType={ScaleType.Log}
            xAccessor={0}
            yAccessors={[1]}
            data={series.data}
            curve={CurveType.CURVE_MONOTONE_X}
          />
        );
      })}
    </Chart>
  );
};
multiserieswithlogvalues.story = {
  name: 'multi series with log values (limit 0 or negative values)',
};
