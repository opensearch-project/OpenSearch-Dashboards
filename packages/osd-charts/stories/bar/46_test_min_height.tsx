import { number } from '@storybook/addon-knobs';
import React from 'react';

import { Axis, BarSeries, Chart, Position, ScaleType } from '../../src';
import { SB_SOURCE_PANEL } from '../utils/storybook';

// for testing purposes only
export const example = () => {
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
    <Chart className="story-chart">
      <Axis id="bottom" title="Bottom" position={Position.Bottom} />
      <Axis id="left" title="Left" position={Position.Left} />
      <BarSeries
        id="bars"
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

// storybook configuration
example.story = {
  parameters: {
    options: { selectedPanel: SB_SOURCE_PANEL },
  },
};
