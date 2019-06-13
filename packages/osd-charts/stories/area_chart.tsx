import { boolean } from '@storybook/addon-knobs';
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
  LineSeries,
  Position,
  ScaleType,
  Settings,
  timeFormatter,
} from '../src';
import { KIBANA_METRICS } from '../src/lib/series/utils/test_dataset_kibana';
const dateFormatter = timeFormatter('HH:mm');

storiesOf('Area Chart', module)
  .add('basic', () => {
    const toggleSpec = boolean('toggle area spec', true);
    const data1 = KIBANA_METRICS.metrics.kibana_os_load[0].data;
    const data2 = data1.map((datum) => [datum[0], datum[1] - 1]);
    const data = toggleSpec ? data1 : data2;
    const specId = toggleSpec ? 'areas1' : 'areas2';

    return (
      <Chart className={'story-chart'}>
        <AreaSeries
          id={getSpecId(specId)}
          xScaleType={ScaleType.Time}
          yScaleType={ScaleType.Linear}
          xAccessor={0}
          yAccessors={[1]}
          data={data}
        />
      </Chart>
    );
  })
  .add('with time x axis', () => {
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
          tickFormat={(d) => Number(d).toFixed(2)}
        />

        <AreaSeries
          id={getSpecId('area')}
          xScaleType={ScaleType.Time}
          yScaleType={ScaleType.Linear}
          xAccessor={0}
          yAccessors={[1]}
          data={KIBANA_METRICS.metrics.kibana_os_load[0].data}
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
      <Chart className={'story-chart'}>
        <Axis id={getAxisId('bottom')} title={'index'} position={Position.Bottom} />
        <Axis
          id={getAxisId('left')}
          title={KIBANA_METRICS.metrics.kibana_os_load[0].metric.title}
          position={Position.Left}
          tickFormat={(d) => Number(d).toFixed(2)}
        />

        <AreaSeries
          id={getSpecId('areas')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor={0}
          yAccessors={[1]}
          data={data}
          curve={CurveType.CURVE_MONOTONE_X}
        />
      </Chart>
    );
  })
  .add('with log y axis', () => {
    const data = KIBANA_METRICS.metrics.kibana_os_load[0].data.map((d) => {
      return d[1] < 7 ? [d[0], null] : [d[0], d[1] - 10];
    });
    return (
      <Chart className={'story-chart'}>
        <Axis id={getAxisId('bottom')} title={'index'} position={Position.Bottom} tickFormat={dateFormatter} />
        <Axis
          id={getAxisId('left')}
          title={KIBANA_METRICS.metrics.kibana_os_load[0].metric.title}
          position={Position.Left}
          tickFormat={(d) => Number(d).toFixed(2)}
        />

        <AreaSeries
          id={getSpecId('areas')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Log}
          xAccessor={0}
          yAccessors={[1]}
          data={data}
          curve={CurveType.CURVE_MONOTONE_X}
        />
      </Chart>
    );
  })
  .add('with 4 axes', () => {
    return (
      <Chart className={'story-chart'}>
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
        />
      </Chart>
    );
  })
  .add('w axis and legend', () => {
    return (
      <Chart className={'story-chart'}>
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
      <Chart className={'story-chart'}>
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
        />
      </Chart>
    );
  })
  .add('stacked with separated specs', () => {
    return (
      <Chart className={'story-chart'}>
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
          id={getSpecId('1')}
          name={KIBANA_METRICS.metrics.kibana_os_load[2].metric.label}
          xScaleType={ScaleType.Time}
          yScaleType={ScaleType.Linear}
          xAccessor={0}
          yAccessors={[1]}
          stackAccessors={[0]}
          data={KIBANA_METRICS.metrics.kibana_os_load[2].data}
        />
        <AreaSeries
          id={getSpecId('2')}
          name={KIBANA_METRICS.metrics.kibana_os_load[1].metric.label}
          xScaleType={ScaleType.Time}
          yScaleType={ScaleType.Linear}
          xAccessor={0}
          yAccessors={[1]}
          stackAccessors={[0]}
          data={KIBANA_METRICS.metrics.kibana_os_load[1].data}
        />
        <AreaSeries
          id={getSpecId('3')}
          name={KIBANA_METRICS.metrics.kibana_os_load[0].metric.label}
          xScaleType={ScaleType.Time}
          yScaleType={ScaleType.Linear}
          xAccessor={0}
          yAccessors={[1]}
          stackAccessors={[0]}
          data={KIBANA_METRICS.metrics.kibana_os_load[0].data}
        />
      </Chart>
    );
  })
  .add('stacked with separated specs - same naming', () => {
    return (
      <Chart className={'story-chart'}>
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
          id={getSpecId('1')}
          name={'Count'}
          xScaleType={ScaleType.Time}
          yScaleType={ScaleType.Linear}
          xAccessor={0}
          yAccessors={[1]}
          stackAccessors={[0]}
          data={KIBANA_METRICS.metrics.kibana_os_load[2].data}
        />
        <AreaSeries
          id={getSpecId('2')}
          name={'Count'}
          xScaleType={ScaleType.Time}
          yScaleType={ScaleType.Linear}
          xAccessor={0}
          yAccessors={[1]}
          stackAccessors={[0]}
          data={KIBANA_METRICS.metrics.kibana_os_load[1].data}
        />
        <AreaSeries
          id={getSpecId('3')}
          name={'Count'}
          xScaleType={ScaleType.Time}
          yScaleType={ScaleType.Linear}
          xAccessor={0}
          yAccessors={[1]}
          stackAccessors={[0]}
          data={KIBANA_METRICS.metrics.kibana_os_load[0].data}
        />
      </Chart>
    );
  })
  .add('[test] - linear', () => {
    const data = [[1, 1], [2, 2], [3, 3], [4, 4], [5, 5], [6, 4], [7, 3], [8, 2], [9, 1]];
    return (
      <Chart className={'story-chart'}>
        <Axis id={getAxisId('bottom')} title={'index'} position={Position.Bottom} />
        <Axis
          id={getAxisId('left')}
          title={KIBANA_METRICS.metrics.kibana_os_load[0].metric.title}
          position={Position.Left}
          tickFormat={(d) => Number(d).toFixed(2)}
        />
        <AreaSeries
          id={getSpecId('areas')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor={0}
          yAccessors={[1]}
          data={data}
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
      <Chart className={'story-chart'}>
        <Axis id={getAxisId('bottom')} title={'index'} position={Position.Bottom} tickFormat={dateFormatter} />
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
        />
      </Chart>
    );
  })
  .add('band area chart', () => {
    const data = KIBANA_METRICS.metrics.kibana_os_load[0].data.map((d) => {
      return {
        x: d[0],
        max: d[1] + 4 + 4 * Math.random(),
        min: d[1] - 4 - 4 * Math.random(),
      };
    });
    const lineData = KIBANA_METRICS.metrics.kibana_os_load[0].data.map((d) => {
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
          tickFormat={(d) => Number(d).toFixed(2)}
        />

        <AreaSeries
          id={getSpecId('area')}
          xScaleType={ScaleType.Time}
          yScaleType={ScaleType.Linear}
          xAccessor={'x'}
          yAccessors={['max']}
          y0Accessors={['min']}
          data={data}
          yScaleToDataExtent={scaleToDataExtent}
          curve={CurveType.CURVE_MONOTONE_X}
        />

        <LineSeries
          id={getSpecId('average')}
          xScaleType={ScaleType.Time}
          yScaleType={ScaleType.Linear}
          xAccessor={0}
          yAccessors={[1]}
          data={lineData}
          yScaleToDataExtent={scaleToDataExtent}
          curve={CurveType.CURVE_MONOTONE_X}
        />
      </Chart>
    );
  })
  .add('stacked band area chart', () => {
    const data = KIBANA_METRICS.metrics.kibana_os_load[0].data;
    const data2 = KIBANA_METRICS.metrics.kibana_os_load[0].data.map((d) => {
      return [d[0], 20, 10];
    });
    const scaleToDataExtent = boolean('scale to extent', false);
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
          tickFormat={(d) => Number(d).toFixed(2)}
        />

        <AreaSeries
          id={getSpecId('area')}
          xScaleType={ScaleType.Time}
          yScaleType={ScaleType.Linear}
          xAccessor={0}
          yAccessors={[1]}
          y0Accessors={[2]}
          data={data}
          stackAccessors={[0]}
          yScaleToDataExtent={scaleToDataExtent}
        />

        <AreaSeries
          id={getSpecId('fixed band')}
          xScaleType={ScaleType.Time}
          yScaleType={ScaleType.Linear}
          xAccessor={0}
          yAccessors={[1]}
          y0Accessors={[2]}
          data={data2}
          stackAccessors={[0]}
          yScaleToDataExtent={scaleToDataExtent}
        />
      </Chart>
    );
  })
  .add('stacked only grouped areas', () => {
    const data1 = [[1, 2], [2, 2], [3, 3], [4, 5], [5, 5], [6, 3], [7, 8], [8, 2], [9, 1]];
    const data2 = [[1, 1], [2, 2], [3, 3], [4, 4], [5, 5], [6, 4], [7, 3], [8, 2], [9, 4]];
    const data3 = [[1, 6], [2, 6], [3, 3], [4, 2], [5, 1], [6, 1], [7, 5], [8, 6], [9, 7]];
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
          id={getSpecId('stacked area 1')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor={0}
          yAccessors={[1]}
          stackAccessors={[0]}
          data={data1}
          yScaleToDataExtent={false}
        />
        <AreaSeries
          id={getSpecId('stacked area 2')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor={0}
          yAccessors={[1]}
          stackAccessors={[0]}
          data={data2}
          yScaleToDataExtent={false}
        />
        <AreaSeries
          id={getSpecId('non stacked area')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor={0}
          yAccessors={[1]}
          data={data3}
          yScaleToDataExtent={false}
        />
      </Chart>
    );
  });
