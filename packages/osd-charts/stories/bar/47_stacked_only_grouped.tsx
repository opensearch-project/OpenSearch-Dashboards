import React from 'react';

import { Axis, BarSeries, Chart, Position, ScaleType } from '../../src';
import { KIBANA_METRICS } from '../../src/utils/data_samples/test_dataset_kibana';
import { SB_SOURCE_PANEL } from '../utils/storybook';

export const example = () => {
  const data1 = [
    [1, 2],
    [2, 2],
    [3, 3],
    [4, 5],
    [5, 5],
    [6, 3],
    [7, 8],
    [8, 2],
    [9, 1],
  ];
  const data2 = [
    [1, 1],
    [2, 2],
    [3, 3],
    [4, 4],
    [5, 5],
    [6, 4],
    [7, 3],
    [8, 2],
    [9, 4],
  ];
  const data3 = [
    [1, 6],
    [2, 6],
    [3, 3],
    [4, 2],
    [5, 1],
    [6, 1],
    [7, 5],
    [8, 6],
    [9, 7],
  ];
  const data4 = [
    [1, 2],
    [2, 6],
    [3, 2],
    [4, 9],
    [5, 2],
    [6, 3],
    [7, 1],
    [8, 2],
    [9, 7],
  ];
  const data5 = [
    [1, 1],
    [2, 7],
    [3, 5],
    [4, 6],
    [5, 5],
    [6, 4],
    [7, 2],
    [8, 4],
    [9, 8],
  ];
  return (
    <Chart renderer="canvas" className="story-chart">
      <Axis id="bottom" title="index" position={Position.Bottom} />
      <Axis
        id="left"
        title={KIBANA_METRICS.metrics.kibana_os_load[0].metric.title}
        position={Position.Left}
        tickFormat={(d: any) => Number(d).toFixed(2)}
        domain={{ min: 0, max: 15 }}
      />
      <Axis
        id="left group b"
        groupId="gb"
        title={KIBANA_METRICS.metrics.kibana_os_load[0].metric.title}
        position={Position.Left}
        tickFormat={(d: any) => Number(d).toFixed(2)}
        hide={true}
        domain={{ min: 0, max: 15 }}
      />
      <BarSeries
        id="stacked bar 1"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        stackAccessors={[0]}
        data={data1}
        yScaleToDataExtent={false}
      />
      <BarSeries
        id="stacked bar 2"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        stackAccessors={[0]}
        data={data2}
        yScaleToDataExtent={false}
      />

      <BarSeries
        id="stacked bar A"
        groupId="gb"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        stackAccessors={[0]}
        data={data4}
        yScaleToDataExtent={false}
      />
      <BarSeries
        id="stacked bar B"
        groupId="gb"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        stackAccessors={[0]}
        data={data5}
        yScaleToDataExtent={false}
      />
      <BarSeries
        id="non stacked bar"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        data={data3}
        yScaleToDataExtent={false}
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
