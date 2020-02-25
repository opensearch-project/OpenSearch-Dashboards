import { boolean } from '@storybook/addon-knobs';
import React from 'react';
import { Axis, Chart, LineSeries, Position, ScaleType, Settings } from '../../src';

export const example = () => {
  return (
    <Chart className="story-chart">
      <Settings hideDuplicateAxes={boolean('hideDuplicateAxes', true)} />
      <Axis id="bottom" position={Position.Bottom} />
      <Axis id="y1" position={Position.Left} tickFormat={(d) => `${d}%`} />
      <Axis id="y2" position={Position.Left} tickFormat={(d) => `${d}%`} />
      <Axis title="Axis - Different title" id="y3" position={Position.Left} tickFormat={(d) => `${d}%`} />
      <Axis domain={{ min: 0 }} id="y4" position={Position.Left} tickFormat={(d) => `${d}%`} />
      <LineSeries
        id="lines"
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        timeZone="utc-6"
        data={[
          [1, 62],
          [2, 56],
          [3, 41],
          [4, 62],
          [5, 90],
        ]}
      />
    </Chart>
  );
};

example.story = {
  parameters: {
    info: {
      text: `hideDuplicateAxes will remove redundant axes that have the same min and max labels and position`,
    },
  },
};
