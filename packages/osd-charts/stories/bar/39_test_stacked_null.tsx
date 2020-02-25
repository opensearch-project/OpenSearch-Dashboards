import React from 'react';

import { Axis, BarSeries, Chart, Position, ScaleType } from '../../src';
import { KIBANA_METRICS } from '../../src/utils/data_samples/test_dataset_kibana';
import { SB_SOURCE_PANEL } from '../utils/storybook';

// for testing purposes only
export const example = () => {
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
    <Chart className="story-chart">
      <Axis id="bottom" title="index" position={Position.Bottom} />
      <Axis
        id="left"
        title={KIBANA_METRICS.metrics.kibana_os_load[0].metric.title}
        position={Position.Left}
        tickFormat={(d: any) => Number(d).toFixed(2)}
      />
      <BarSeries
        id="lines"
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

// storybook configuration
example.story = {
  parameters: {
    options: { selectedPanel: SB_SOURCE_PANEL },
  },
};
