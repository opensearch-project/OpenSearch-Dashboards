import { storiesOf } from '@storybook/react';
import { select, number } from '@storybook/addon-knobs';
import { DateTime } from 'luxon';
import React from 'react';

import {
  AreaSeries,
  Axis,
  BarSeries,
  Chart,
  CurveType,
  getAxisId,
  getSpecId,
  LineSeries,
  Position,
  ScaleType,
  Settings,
} from '../src/';
import { timeFormatter } from '../src/utils/data/formatters';
import { Fit, SeriesTypes } from '../src/chart_types/xy_chart/utils/specs';

storiesOf('Mixed Charts', module)
  .add('bar and lines', () => {
    return (
      <Chart className={'story-chart'}>
        <Settings showLegend={true} legendPosition={Position.Right} />
        <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'Bottom axis'} />
        <Axis
          id={getAxisId('left2')}
          title={'Left axis'}
          position={Position.Left}
          tickFormat={(d) => Number(d).toFixed(2)}
        />

        <BarSeries
          id={getSpecId('bars')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          data={[{ x: 0, y: 2 }, { x: 1, y: 7 }, { x: 2, y: 3 }, { x: 3, y: 6 }]}
        />
        <LineSeries
          id={getSpecId('line')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          data={[{ x: 0, y: 3 }, { x: 1, y: 2 }, { x: 2, y: 4 }, { x: 3, y: 10 }]}
        />
      </Chart>
    );
  })
  .add('lines and areas', () => {
    return (
      <Chart className={'story-chart'}>
        <Settings showLegend={true} legendPosition={Position.Right} />
        <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'Bottom axis'} showOverlappingTicks={true} />
        <Axis
          id={getAxisId('left2')}
          title={'Left axis'}
          position={Position.Left}
          tickFormat={(d) => Number(d).toFixed(2)}
        />

        <AreaSeries
          id={getSpecId('areas')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          data={[{ x: 0, y: 2.5 }, { x: 1, y: 7 }, { x: 2, y: 3 }, { x: 3, y: 6 }]}
        />
        <LineSeries
          id={getSpecId('lines')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          stackAccessors={['x']}
          data={[{ x: 0, y: 2.8 }, { x: 1, y: 2 }, { x: 2, y: 4 }, { x: 3, y: 10 }]}
        />
      </Chart>
    );
  })
  .add('areas and bars', () => {
    return (
      <Chart renderer="canvas" className={'story-chart'}>
        <Settings showLegend={true} legendPosition={Position.Right} />
        <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'Bottom axis'} showOverlappingTicks={true} />
        <Axis
          id={getAxisId('left2')}
          title={'Left axis'}
          position={Position.Left}
          tickFormat={(d) => Number(d).toFixed(2)}
        />
        <Axis id={getAxisId('top')} position={Position.Top} title={'Top axis'} showOverlappingTicks={true} />
        <Axis
          id={getAxisId('right')}
          title={'Right axis'}
          position={Position.Right}
          tickFormat={(d) => Number(d).toFixed(2)}
        />
        <BarSeries
          id={getSpecId('bars')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          splitSeriesAccessors={['g']}
          stackAccessors={['x']}
          data={[{ x: 0, y: 2 }, { x: 1, y: 7 }, { x: 2, y: 3 }, { x: 3, y: 6 }]}
          yScaleToDataExtent={false}
        />
        <AreaSeries
          id={getSpecId('areas')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          curve={CurveType.CURVE_MONOTONE_X}
          data={[{ x: 0, y: 2.5 }, { x: 1, y: 7 }, { x: 2, y: 3 }, { x: 3, y: 6 }]}
          yScaleToDataExtent={false}
        />
      </Chart>
    );
  })
  .add('[test] - bar/lines linear', () => {
    const data1 = [[1, 1], [2, 2], [3, 3], [4, 4], [5, 5], [6, 4], [7, 3], [8, 2], [9, 1]];
    const data2 = [[1, 5], [2, 4], [3, 3], [4, 2], [5, 1], [6, 2], [7, 3], [8, 4], [9, 5]];

    return (
      <Chart className={'story-chart'}>
        <Settings showLegend={true} legendPosition={Position.Right} />
        <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'Bottom axis'} showOverlappingTicks={true} />
        <Axis
          id={getAxisId('left2')}
          title={'Left axis'}
          position={Position.Left}
          tickFormat={(d) => Number(d).toFixed(2)}
        />

        <BarSeries
          id={getSpecId('data1')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor={0}
          yAccessors={[1]}
          data={data1}
        />
        <LineSeries
          id={getSpecId('data2')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor={0}
          yAccessors={[1]}
          data={data2}
        />
      </Chart>
    );
  })
  .add('[test] - bar/lines time', () => {
    const start = DateTime.fromISO('2019-01-01T00:00:00.000', { zone: 'utc' });
    const data1 = [
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
    const data2 = [
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
    const dateFormatter = timeFormatter('HH:mm:ss');

    return (
      <Chart className={'story-chart'}>
        <Settings showLegend={true} legendPosition={Position.Right} />
        <Axis
          id={getAxisId('bottom')}
          position={Position.Bottom}
          title={'Bottom axis'}
          showOverlappingTicks={true}
          tickFormat={dateFormatter}
        />
        <Axis
          id={getAxisId('left2')}
          title={'Left axis'}
          position={Position.Left}
          tickFormat={(d) => Number(d).toFixed(2)}
        />

        <BarSeries
          id={getSpecId('data1')}
          xScaleType={ScaleType.Time}
          yScaleType={ScaleType.Linear}
          xAccessor={0}
          yAccessors={[1]}
          data={data1}
        />
        <LineSeries
          id={getSpecId('data2')}
          xScaleType={ScaleType.Time}
          yScaleType={ScaleType.Linear}
          xAccessor={0}
          yAccessors={[2]}
          data={data2}
        />
      </Chart>
    );
  })
  .add('Fitting functions - non-stacked series', () => {
    const dataTypes = {
      isolated: [
        { x: 0, y: 3 },
        { x: 1, y: 5 },
        { x: 2, y: null },
        { x: 3, y: 4 },
        { x: 4, y: null },
        { x: 5, y: 5 },
        { x: 6, y: null },
        { x: 7, y: 12 },
        { x: 8, y: null },
        { x: 9, y: 10 },
        { x: 10, y: 7 },
      ],
      successive: [
        { x: 0, y: 3 },
        { x: 1, y: 5 },
        { x: 2, y: null },
        { x: 4, y: null },
        { x: 6, y: null },
        { x: 8, y: null },
        { x: 9, y: 10 },
        { x: 10, y: 7 },
      ],
      endPoints: [
        { x: 0, y: null },
        { x: 1, y: 5 },
        { x: 3, y: 4 },
        { x: 5, y: 5 },
        { x: 7, y: 12 },
        { x: 9, y: 10 },
        { x: 10, y: null },
      ],
      ordinal: [
        { x: 'a', y: null },
        { x: 'b', y: 3 },
        { x: 'c', y: 5 },
        { x: 'd', y: null },
        { x: 'e', y: 4 },
        { x: 'f', y: null },
        { x: 'g', y: 5 },
        { x: 'h', y: 6 },
        { x: 'i', y: null },
        { x: 'j', y: null },
        { x: 'k', y: null },
        { x: 'l', y: 12 },
        { x: 'm', y: null },
      ],
      all: [
        { x: 0, y: null },
        { x: 1, y: 3 },
        { x: 2, y: 5 },
        { x: 3, y: null },
        { x: 4, y: 4 },
        { x: 5, y: null },
        { x: 6, y: 5 },
        { x: 7, y: 6 },
        { x: 8, y: null },
        { x: 9, y: null },
        { x: 10, y: null },
        { x: 11, y: 12 },
        { x: 12, y: null },
      ],
    };

    const seriesType = select<string>(
      'seriesType',
      {
        Area: SeriesTypes.Area,
        Line: SeriesTypes.Line,
      },
      SeriesTypes.Area,
    );
    const dataKey = select<string>(
      'dataset',
      {
        'Isolated Points': 'isolated',
        'Successive null Points': 'successive',
        'null end points': 'endPoints',
        'Ordinal x values': 'ordinal',
        'All edge cases': 'all',
      },
      'all',
    );
    // @ts-ignore
    const dataset = dataTypes[dataKey];
    const fit = select(
      'fitting function',
      {
        None: Fit.None,
        Carry: Fit.Carry,
        Lookahead: Fit.Lookahead,
        Nearest: Fit.Nearest,
        Average: Fit.Average,
        Linear: Fit.Linear,
        Zero: Fit.Zero,
        Explicit: Fit.Explicit,
      },
      Fit.Average,
    );
    const curve = select<CurveType>(
      'Curve',
      {
        'Curve cardinal': CurveType.CURVE_CARDINAL,
        'Curve natural': CurveType.CURVE_NATURAL,
        'Curve monotone x': CurveType.CURVE_MONOTONE_X,
        'Curve monotone y': CurveType.CURVE_MONOTONE_Y,
        'Curve basis': CurveType.CURVE_BASIS,
        'Curve catmull rom': CurveType.CURVE_CATMULL_ROM,
        'Curve step': CurveType.CURVE_STEP,
        'Curve step after': CurveType.CURVE_STEP_AFTER,
        'Curve step before': CurveType.CURVE_STEP_BEFORE,
        Linear: CurveType.LINEAR,
      },
      0,
    );
    const endValue = select<number | 'none' | 'nearest'>(
      'End value',
      {
        None: 'none',
        nearest: 'nearest',
        '0': 0,
        '2': 2,
      },
      'none',
    );
    const parsedEndValue: number | 'nearest' = Number.isNaN(Number(endValue)) ? 'nearest' : Number(endValue);
    const value = number('Explicit valuve (using Fit.Explicit)', 5);
    const xScaleType = dataKey === 'ordinal' ? ScaleType.Ordinal : ScaleType.Linear;

    return (
      <Chart className="story-chart">
        <Settings
          theme={{
            areaSeriesStyle: {
              point: {
                visible: true,
              },
            },
          }}
        />
        <Axis id={getAxisId('bottom')} position={Position.Bottom} title={'Bottom axis'} showOverlappingTicks={true} />
        <Axis id={getAxisId('left')} title={'Left axis'} position={Position.Left} />
        {seriesType === SeriesTypes.Area ? (
          <AreaSeries
            id={getSpecId('test')}
            xScaleType={xScaleType}
            yScaleType={ScaleType.Linear}
            xAccessor={'x'}
            yAccessors={['y']}
            curve={curve}
            fit={{
              type: fit,
              value: fit === Fit.Explicit ? value : undefined,
              endValue: endValue === 'none' ? undefined : parsedEndValue,
            }}
            data={dataset}
          />
        ) : (
          <LineSeries
            id={getSpecId('test')}
            xScaleType={xScaleType}
            yScaleType={ScaleType.Linear}
            xAccessor={'x'}
            yAccessors={['y']}
            curve={curve}
            fit={{
              type: fit,
              value: fit === Fit.Explicit ? value : undefined,
              endValue: endValue === 'none' ? undefined : parsedEndValue,
            }}
            data={dataset}
          />
        )}
      </Chart>
    );
  });
