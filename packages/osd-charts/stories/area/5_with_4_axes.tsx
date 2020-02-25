import React from 'react';
import { AreaSeries, Axis, Chart, Position, ScaleType, Settings, timeFormatter } from '../../src';
import { KIBANA_METRICS } from '../../src/utils/data_samples/test_dataset_kibana';
import { SB_SOURCE_PANEL } from '../utils/storybook';

const dateFormatter = timeFormatter('HH:mm');

export const example = () => {
  return (
    <Chart className="story-chart">
      <Settings debug={false} />
      <Axis
        id="bottom"
        title="timestamp per 1 minute"
        position={Position.Bottom}
        showOverlappingTicks={true}
        tickFormat={dateFormatter}
      />
      <Axis
        id="left"
        title={KIBANA_METRICS.metrics.kibana_os_load[0].metric.title}
        position={Position.Left}
        tickFormat={(d) => `${Number(d).toFixed(0)}%`}
      />
      <Axis id="top" position={Position.Top} showOverlappingTicks={true} tickFormat={timeFormatter('HH:mm:ss')} />
      <Axis
        id="right"
        title={KIBANA_METRICS.metrics.kibana_os_load[0].metric.title}
        position={Position.Right}
        tickFormat={(d) => `${Number(d).toFixed(0)} %`}
      />

      <AreaSeries
        id={KIBANA_METRICS.metrics.kibana_os_load[0].metric.label}
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        data={KIBANA_METRICS.metrics.kibana_os_load[0].data}
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
