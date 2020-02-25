import { DateTime } from 'luxon';
import React from 'react';
import { Axis, Chart, LineSeries, Position, ScaleType } from '../../src';
import { SB_SOURCE_PANEL } from '../utils/storybook';

export const example = () => {
  return (
    <Chart className="story-chart">
      <Axis
        id="time"
        position={Position.Bottom}
        tickFormat={(d) => {
          return DateTime.fromMillis(d, { zone: 'utc-6' }).toISO();
        }}
      />
      <Axis id="y" position={Position.Left} />
      <LineSeries
        id="lines"
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        xAccessor={1}
        yAccessors={[2]}
        timeZone="utc-6"
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
};

example.story = {
  parameters: {
    options: { selectedPanel: SB_SOURCE_PANEL },
    info: {
      text: `You can visualize data in a different timezone than your local or UTC zones.
      Specify the \`timeZone={'utc-6'}\` property with the correct timezone and
      remember to apply the same timezone also to each formatted tick in \`tickFormat\``,
    },
  },
};
