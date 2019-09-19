import { select, boolean } from '@storybook/addon-knobs';
import { storiesOf } from '@storybook/react';
import { DateTime } from 'luxon';
import React from 'react';
import { Axis, Chart, getAxisId, getSpecId, LineSeries, Position, ScaleType, Settings } from '../src';

const today = new Date().getTime();
const UTC_DATE = DateTime.fromISO('2019-01-01T00:00:00.000Z').toMillis();
const UTC_PLUS8_DATE = DateTime.fromISO('2019-01-01T00:00:00.000+08:00', {
  setZone: true,
}).toMillis();
const UTC_MINUS8_DATE = DateTime.fromISO('2019-01-01T00:00:00.000-08:00', {
  setZone: true,
}).toMillis();
const DAY_INCREMENT_1 = 1000 * 60 * 60 * 24;
const UTC_DATASET = new Array(10).fill(0).map((d, i) => {
  return [UTC_DATE + DAY_INCREMENT_1 * i, i % 5];
});
const CURRENT_TIMEZONE_DATASET = new Array(10).fill(0).map((d, i) => {
  return [today + DAY_INCREMENT_1 * i, i % 5];
});
const OTHER_PLUS8_TIMEZONE_DATASET = new Array(10).fill(0).map((d, i) => {
  return [UTC_PLUS8_DATE + DAY_INCREMENT_1 * i, i % 5];
});
const OTHER_MINUS8_TIMEZONE_DATASET = new Array(10).fill(0).map((d, i) => {
  return [UTC_MINUS8_DATE + DAY_INCREMENT_1 * i, i % 5];
});

storiesOf('Scales', module)
  .add('line chart with different timezones', () => {
    const timezones = {
      utc: 'utc',
      local: 'local',
      utcplus8: 'utc+8',
      utcminus8: 'utc-8',
    };
    const datasetSelected = select('dataset', timezones, 'utc');
    const tooltipSelected = select('tooltip', timezones, 'utc');

    let data;
    switch (datasetSelected) {
      case 'utc':
        data = UTC_DATASET;
        break;
      case 'local':
        data = CURRENT_TIMEZONE_DATASET;
        break;
      case 'utc+8':
        data = OTHER_PLUS8_TIMEZONE_DATASET;
        break;
      case 'utc-8':
        data = OTHER_MINUS8_TIMEZONE_DATASET;
        break;
    }
    let tooltipFn: (d: number) => string;
    switch (tooltipSelected) {
      case 'local':
        tooltipFn = (d: number) => {
          return DateTime.fromMillis(d).toFormat('yyyy-MM-dd HH:mm:ss');
        };
        break;
      case 'utc+8':
        tooltipFn = (d: number) => {
          return DateTime.fromMillis(d, { zone: 'utc+8' }).toFormat('yyyy-MM-dd HH:mm:ss');
        };
        break;
      case 'utc-8':
        tooltipFn = (d: number) => {
          return DateTime.fromMillis(d, { zone: 'utc-8' }).toFormat('yyyy-MM-dd HH:mm:ss');
        };
        break;
      default:
      case 'utc':
        tooltipFn = (d: number) => {
          return DateTime.fromMillis(d)
            .toUTC()
            .toFormat('yyyy-MM-dd HH:mm:ss');
        };
        break;
    }
    return (
      <Chart className={'story-chart'}>
        <Axis id={getAxisId('time')} position={Position.Bottom} tickFormat={tooltipFn} />
        <Axis id={getAxisId('y')} position={Position.Left} />
        <LineSeries
          id={getSpecId('lines')}
          xScaleType={ScaleType.Time}
          yScaleType={ScaleType.Linear}
          timeZone={tooltipSelected}
          xAccessor={0}
          yAccessors={[1]}
          data={data}
        />
      </Chart>
    );
  })
  .add(
    'x scale: UTC Time zone - local tooltip',
    () => {
      return (
        <Chart className={'story-chart'}>
          <Axis
            id={getAxisId('time')}
            position={Position.Bottom}
            tickFormat={(d) => {
              return DateTime.fromMillis(d).toFormat('yyyy-MM-dd HH:mm:ss');
            }}
          />
          <Axis id={getAxisId('y')} position={Position.Left} />
          <LineSeries
            id={getSpecId('lines')}
            xScaleType={ScaleType.Time}
            yScaleType={ScaleType.Linear}
            timeZone={'local'}
            xAccessor={0}
            yAccessors={[1]}
            data={UTC_DATASET}
          />
        </Chart>
      );
    },
    {
      info: {
        text: `If your data is in UTC timezone, your tooltip and axis labels can
        be configured to visualize the time translated to your local timezone. You should
        be able to see the first value on \`2019-01-01  01:00:00.000 \``,
      },
    },
  )
  .add(
    'x scale: UTC Time zone - UTC tooltip',
    () => {
      return (
        <Chart className={'story-chart'}>
          <Axis
            id={getAxisId('time')}
            position={Position.Bottom}
            tickFormat={(d) => {
              return DateTime.fromMillis(d)
                .toUTC()
                .toFormat('yyyy-MM-dd HH:mm:ss');
            }}
          />
          <Axis id={getAxisId('y')} position={Position.Left} />
          <LineSeries
            id={getSpecId('lines')}
            xScaleType={ScaleType.Time}
            yScaleType={ScaleType.Linear}
            timeZone={'utc'}
            xAccessor={0}
            yAccessors={[1]}
            data={UTC_DATASET}
          />
        </Chart>
      );
    },
    {
      info: {
        text: `The default timezone is UTC. If you want to visualize data in UTC,
        but you are in a different timezone, remember to format the millis from \`tickFormat\`
        to UTC. In this example be able to see the first value on \`2019-01-01  00:00:00.000 \``,
      },
    },
  )
  .add(
    'x scale year scale: custom timezone - same zone tooltip',
    () => {
      return (
        <Chart className={'story-chart'}>
          <Axis
            id={getAxisId('time')}
            position={Position.Bottom}
            tickFormat={(d) => {
              return DateTime.fromMillis(d, { zone: 'utc-6' }).toISO();
              // return DateTime.fromMillis(d, { zone: 'utc-6' }).toISO();
            }}
          />
          <Axis id={getAxisId('y')} position={Position.Left} />
          <LineSeries
            id={getSpecId('lines')}
            xScaleType={ScaleType.Time}
            yScaleType={ScaleType.Linear}
            xAccessor={1}
            yAccessors={[2]}
            timeZone={'utc-6'}
            data={[
              ['2014-01-01T00:00:00.000-06:00', 1388556000000, 6206],
              ['2015-01-01T00:00:00.000-06:00', 1420092000000, 5674],
              ['2016-01-01T00:00:00.000-06:00', 1451628000000, 4148],
              ['2017-01-01T00:00:00.000-06:00', 1483250400000, 6206],
              ['2018-01-01T00:00:00.000-06:00', 1514786400000, 3698],
            ]}
          />
        </Chart>
      );
    },
    {
      info: {
        text: `You can visualize data in a different timezone than your local or UTC zones.
        Specify the \`timeZone={'utc-6'}\` property with the correct timezone and
        remember to apply the same timezone also to each formatted tick in \`tickFormat\` `,
      },
    },
  )
  .add(
    'Remove duplicate scales',
    () => {
      return (
        <Chart className={'story-chart'}>
          <Settings hideDuplicateAxes={boolean('hideDuplicateAxes', true)} />
          <Axis id={getAxisId('bottom')} position={Position.Bottom} />
          <Axis id={getAxisId('y1')} position={Position.Left} tickFormat={(d) => `${d}%`} />
          <Axis id={getAxisId('y2')} position={Position.Left} tickFormat={(d) => `${d}%`} />
          <Axis
            title="Axis - Different title"
            id={getAxisId('y3')}
            position={Position.Left}
            tickFormat={(d) => `${d}%`}
          />
          <Axis domain={{ min: 0 }} id={getAxisId('y4')} position={Position.Left} tickFormat={(d) => `${d}%`} />
          <LineSeries
            id={getSpecId('lines')}
            xScaleType={ScaleType.Time}
            yScaleType={ScaleType.Linear}
            xAccessor={0}
            yAccessors={[1]}
            timeZone={'utc-6'}
            data={[[1, 62], [2, 56], [3, 41], [4, 62], [5, 90]]}
          />
        </Chart>
      );
    },
    {
      info: {
        text: '`hideDuplicateAxes` will remove redundant axes that have the same min and max labels and position',
      },
    },
  );
