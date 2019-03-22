import { storiesOf } from '@storybook/react';
import { DateTime } from 'luxon';
import React from 'react';
import {
  AreaSeries,
  Axis,
  Chart,
  CurveType,
  getAxisId,
  getSpecId,
  Position,
  ScaleType,
  Settings,
  timeFormatter,
} from '../src';
import { KIBANA_METRICS } from '../src/lib/series/utils/test_dataset_kibana';
const dateFormatter = timeFormatter('HH:mm');

storiesOf('Area Chart', module)
  .add('basic', () => {
    return (
      <Chart renderer="canvas" className={'story-chart'}>
        <AreaSeries
          id={getSpecId('lines')}
          xScaleType={ScaleType.Time}
          yScaleType={ScaleType.Linear}
          xAccessor={0}
          yAccessors={[1]}
          data={KIBANA_METRICS.metrics.kibana_os_load[0].data}
          yScaleToDataExtent={false}
        />
      </Chart>
    );
  })
  .add('with time x axis', () => {
    return (
      <Chart renderer="canvas" className={'story-chart'}>
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
          tickFormat={(d) => Number(d).toFixed(2)}
        />

        <AreaSeries
          id={getSpecId('lines')}
          xScaleType={ScaleType.Time}
          yScaleType={ScaleType.Linear}
          xAccessor={0}
          yAccessors={[1]}
          data={KIBANA_METRICS.metrics.kibana_os_load[0].data}
          yScaleToDataExtent={false}
        />
      </Chart>
    );
  })
  .add('with linear x axis', () => {
    const start = KIBANA_METRICS.metrics.kibana_os_load[0].data[0][0];
    const data = KIBANA_METRICS.metrics.kibana_os_load[0].data.slice(0, 20).map((d) => {
      return [(d[0] - start) / 30000, d[1]];
    });
    return (
      <Chart renderer="canvas" className={'story-chart'}>
        <Axis id={getAxisId('bottom')} title={'index'} position={Position.Bottom} />
        <Axis
          id={getAxisId('left')}
          title={KIBANA_METRICS.metrics.kibana_os_load[0].metric.title}
          position={Position.Left}
          tickFormat={(d) => Number(d).toFixed(2)}
        />

        <AreaSeries
          id={getSpecId('lines')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor={0}
          yAccessors={[1]}
          data={data}
          curve={CurveType.CURVE_MONOTONE_X}
          yScaleToDataExtent={false}
        />
      </Chart>
    );
  })
  .add('with 4 axes', () => {
    return (
      <Chart renderer="canvas" className={'story-chart'}>
        <Settings debug={false} />
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
          tickFormat={(d) => `${Number(d).toFixed(0)}%`}
        />
        <Axis
          id={getAxisId('top')}
          position={Position.Top}
          showOverlappingTicks={true}
          tickFormat={timeFormatter('HH:mm:ss')}
        />
        <Axis
          id={getAxisId('right')}
          title={KIBANA_METRICS.metrics.kibana_os_load[0].metric.title}
          position={Position.Right}
          tickFormat={(d) => `${Number(d).toFixed(0)} %`}
        />

        <AreaSeries
          id={getSpecId(KIBANA_METRICS.metrics.kibana_os_load[0].metric.label)}
          xScaleType={ScaleType.Time}
          yScaleType={ScaleType.Linear}
          xAccessor={0}
          yAccessors={[1]}
          data={KIBANA_METRICS.metrics.kibana_os_load[0].data}
          yScaleToDataExtent={false}
        />
      </Chart>
    );
  })
  .add('w axis and legend', () => {
    return (
      <Chart renderer="canvas" className={'story-chart'}>
        <Settings showLegend={true} legendPosition={Position.Right} />
        <Axis
          id={getAxisId('bottom')}
          title={'timestamp per 1 minute'}
          position={Position.Bottom}
          showOverlappingTicks={true}
          tickFormat={dateFormatter}
        />
        <Axis
          title={KIBANA_METRICS.metrics.kibana_os_load[0].metric.title}
          position={Position.Left}
          tickFormat={(d) => Number(d).toFixed(2)}
        />

        <AreaSeries
          id={getSpecId(KIBANA_METRICS.metrics.kibana_os_load[0].metric.label)}
          xScaleType={ScaleType.Time}
          yScaleType={ScaleType.Linear}
          xAccessor={0}
          yAccessors={[1]}
          data={KIBANA_METRICS.metrics.kibana_os_load[0].data}
          yScaleToDataExtent={false}
        />
      </Chart>
    );
  })
  .add('stacked w axis and legend', () => {
    const data1 = KIBANA_METRICS.metrics.kibana_os_load[0].data.map((d) => {
      return [...d, KIBANA_METRICS.metrics.kibana_os_load[0].metric.label];
    });
    const data2 = KIBANA_METRICS.metrics.kibana_os_load[1].data.map((d) => {
      return [...d, KIBANA_METRICS.metrics.kibana_os_load[1].metric.label];
    });
    const data3 = KIBANA_METRICS.metrics.kibana_os_load[2].data.map((d) => {
      return [...d, KIBANA_METRICS.metrics.kibana_os_load[2].metric.label];
    });
    const allMetrics = [...data3, ...data2, ...data1];
    return (
      <Chart renderer="canvas" className={'story-chart'}>
        <Settings showLegend={true} legendPosition={Position.Right} />
        <Axis
          id={getAxisId('bottom')}
          position={Position.Bottom}
          title={'timestamp per 1 minute'}
          showOverlappingTicks={true}
          tickFormat={dateFormatter}
        />
        <Axis
          title={KIBANA_METRICS.metrics.kibana_os_load[0].metric.title}
          position={Position.Left}
          tickFormat={(d) => Number(d).toFixed(2)}
        />
        <AreaSeries
          id={getSpecId(KIBANA_METRICS.metrics.kibana_os_load[0].metric.label)}
          xScaleType={ScaleType.Time}
          yScaleType={ScaleType.Linear}
          xAccessor={0}
          yAccessors={[1]}
          stackAccessors={[0]}
          splitSeriesAccessors={[2]}
          data={allMetrics}
          yScaleToDataExtent={false}
        />
      </Chart>
    );
  })
  .add('stacked with separated specs', () => {
    return (
      <Chart renderer="canvas" className={'story-chart'}>
        <Settings showLegend={true} legendPosition={Position.Right} />
        <Axis
          id={getAxisId('bottom')}
          position={Position.Bottom}
          title={'timestamp per 1 minute'}
          showOverlappingTicks={true}
          tickFormat={dateFormatter}
        />
        <Axis
          title={KIBANA_METRICS.metrics.kibana_os_load[0].metric.title}
          position={Position.Left}
          tickFormat={(d) => Number(d).toFixed(2)}
        />
        <AreaSeries
          id={getSpecId(KIBANA_METRICS.metrics.kibana_os_load[2].metric.label)}
          xScaleType={ScaleType.Time}
          yScaleType={ScaleType.Linear}
          xAccessor={0}
          yAccessors={[1]}
          stackAccessors={[0]}
          data={KIBANA_METRICS.metrics.kibana_os_load[2].data}
          yScaleToDataExtent={false}
        />
        <AreaSeries
          id={getSpecId(KIBANA_METRICS.metrics.kibana_os_load[1].metric.label)}
          xScaleType={ScaleType.Time}
          yScaleType={ScaleType.Linear}
          xAccessor={0}
          yAccessors={[1]}
          stackAccessors={[0]}
          data={KIBANA_METRICS.metrics.kibana_os_load[1].data}
          yScaleToDataExtent={false}
        />
        <AreaSeries
          id={getSpecId(KIBANA_METRICS.metrics.kibana_os_load[0].metric.label)}
          xScaleType={ScaleType.Time}
          yScaleType={ScaleType.Linear}
          xAccessor={0}
          yAccessors={[1]}
          stackAccessors={[0]}
          data={KIBANA_METRICS.metrics.kibana_os_load[0].data}
          yScaleToDataExtent={false}
        />
      </Chart>
    );
  })
  .add('[test] - linear', () => {
    const data = [[1, 1], [2, 2], [3, 3], [4, 4], [5, 5], [6, 4], [7, 3], [8, 2], [9, 1]];
    return (
      <Chart renderer="canvas" className={'story-chart'}>
        <Axis id={getAxisId('bottom')} title={'index'} position={Position.Bottom} />
        <Axis
          id={getAxisId('left')}
          title={KIBANA_METRICS.metrics.kibana_os_load[0].metric.title}
          position={Position.Left}
          tickFormat={(d) => Number(d).toFixed(2)}
        />
        <AreaSeries
          id={getSpecId('lines')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor={0}
          yAccessors={[1]}
          data={data}
          yScaleToDataExtent={false}
        />
      </Chart>
    );
  })
  .add('[test] - time', () => {
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
      <Chart renderer="canvas" className={'story-chart'}>
        <Axis
          id={getAxisId('bottom')}
          title={'index'}
          position={Position.Bottom}
          tickFormat={dateFormatter}
        />
        <Axis
          id={getAxisId('left')}
          title={KIBANA_METRICS.metrics.kibana_os_load[0].metric.title}
          position={Position.Left}
          tickFormat={(d) => Number(d).toFixed(2)}
        />
        <AreaSeries
          id={getSpecId('data')}
          xScaleType={ScaleType.Time}
          yScaleType={ScaleType.Linear}
          xAccessor={0}
          yAccessors={[1]}
          data={data}
          yScaleToDataExtent={false}
        />
      </Chart>
    );
  });
