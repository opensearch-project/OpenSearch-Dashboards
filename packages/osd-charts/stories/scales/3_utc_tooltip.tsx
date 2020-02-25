import { DateTime } from 'luxon';
import React from 'react';
import { Axis, Chart, LineSeries, Position, ScaleType } from '../../src';
import { SB_SOURCE_PANEL } from '../utils/storybook';

const UTC_DATE = DateTime.fromISO('2019-01-01T00:00:00.000Z').toMillis();
const DAY_INCREMENT_1 = 1000 * 60 * 60 * 24;
const UTC_DATASET = new Array(10).fill(0).map((d, i) => {
  return [UTC_DATE + DAY_INCREMENT_1 * i, i % 5];
});

export const example = () => {
  return (
    <Chart className="story-chart">
      <Axis
        id="time"
        position={Position.Bottom}
        tickFormat={(d) => {
          return DateTime.fromMillis(d)
            .toUTC()
            .toFormat('yyyy-MM-dd HH:mm:ss');
        }}
      />
      <Axis id="y" position={Position.Left} />
      <LineSeries
        id="lines"
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        timeZone="utc"
        xAccessor={0}
        yAccessors={[1]}
        data={UTC_DATASET}
      />
    </Chart>
  );
};

example.story = {
  parameters: {
    options: { selectedPanel: SB_SOURCE_PANEL },
    info: {
      text: `The default timezone is UTC. If you want to visualize data in UTC,
      but you are in a different timezone, remember to format the millis from \`tickFormat\`
      to UTC. In this example be able to see the first value on \`2019-01-01  00:00:00.000 \``,
    },
  },
};
