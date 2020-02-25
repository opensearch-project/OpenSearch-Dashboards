import React from 'react';
import { AreaSeries, Axis, Chart, CurveType, Position, ScaleType, timeFormatter } from '../../src';
import { KIBANA_METRICS } from '../../src/utils/data_samples/test_dataset_kibana';
import { SB_SOURCE_PANEL } from '../utils/storybook';

const dateFormatter = timeFormatter('HH:mm');

export const example = () => {
  const data = KIBANA_METRICS.metrics.kibana_os_load[0].data.map((d) => {
    return d[1] < 7 ? [d[0], null] : [d[0], d[1] - 10];
  });
  return (
    <Chart className="story-chart">
      <Axis id="bottom" title="index" position={Position.Bottom} tickFormat={dateFormatter} />
      <Axis
        id="left"
        title={KIBANA_METRICS.metrics.kibana_os_load[0].metric.title}
        position={Position.Left}
        tickFormat={(d) => Number(d).toFixed(2)}
      />

      <AreaSeries
        id="areas"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Log}
        xAccessor={0}
        yAccessors={[1]}
        data={data}
        curve={CurveType.CURVE_MONOTONE_X}
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
