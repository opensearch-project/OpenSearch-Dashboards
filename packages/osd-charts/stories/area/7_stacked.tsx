import React from 'react';
import { AreaSeries, Axis, Chart, Position, ScaleType, Settings, timeFormatter } from '../../src';
import { KIBANA_METRICS } from '../../src/utils/data_samples/test_dataset_kibana';
import { SB_SOURCE_PANEL } from '../utils/storybook';

const dateFormatter = timeFormatter('HH:mm');

export const example = () => {
  const data1 = KIBANA_METRICS.metrics.kibana_os_load[0].data.map((d) => {
    return [...d, KIBANA_METRICS.metrics.kibana_os_load[0].metric.label];
  });
  const data2 = KIBANA_METRICS.metrics.kibana_os_load[1].data.map((d) => {
    return [...d, KIBANA_METRICS.metrics.kibana_os_load[1].metric.label];
  });
  const data3 = KIBANA_METRICS.metrics.kibana_os_load[2].data.map((d) => {
    return [...d, KIBANA_METRICS.metrics.kibana_os_load[2].metric.label];
  });
  const allMetrics = [...data3, ...data2, ...data1];
  return (
    <Chart className="story-chart">
      <Settings showLegend showLegendExtra legendPosition={Position.Right} />
      <Axis
        id="bottom"
        position={Position.Bottom}
        title="timestamp per 1 minute"
        showOverlappingTicks={true}
        tickFormat={dateFormatter}
      />
      <Axis
        id="left"
        title={KIBANA_METRICS.metrics.kibana_os_load[0].metric.title}
        position={Position.Left}
        tickFormat={(d) => Number(d).toFixed(2)}
      />
      <AreaSeries
        id={KIBANA_METRICS.metrics.kibana_os_load[0].metric.label}
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        stackAccessors={[0]}
        splitSeriesAccessors={[2]}
        data={allMetrics}
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
