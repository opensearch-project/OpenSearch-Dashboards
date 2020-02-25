import { boolean } from '@storybook/addon-knobs';
import React from 'react';

import { Axis, BarSeries, Chart, niceTimeFormatByDay, Position, ScaleType, Settings, timeFormatter } from '../../src';
import { KIBANA_METRICS } from '../../src/utils/data_samples/test_dataset_kibana';

export const example = () => {
  const formatter = timeFormatter(niceTimeFormatByDay(1));
  return (
    <Chart className="story-chart">
      <Settings debug={boolean('debug', false)} />
      <Axis
        id="bottom"
        position={Position.Bottom}
        title="Bottom axis"
        showOverlappingTicks={boolean('showOverlappingTicks bottom axis', false)}
        showOverlappingLabels={boolean('showOverlappingLabels bottom axis', false)}
        tickFormat={formatter}
      />
      <Axis id="left2" title="Left axis" position={Position.Left} tickFormat={(d: any) => Number(d).toFixed(2)} />

      <BarSeries
        id={KIBANA_METRICS.metrics.kibana_os_load[0].metric.label}
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        data={KIBANA_METRICS.metrics.kibana_os_load[0].data}
      />
      <BarSeries
        id={KIBANA_METRICS.metrics.kibana_os_load[1].metric.label}
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        data={KIBANA_METRICS.metrics.kibana_os_load[1].data}
      />
      <BarSeries
        id={KIBANA_METRICS.metrics.kibana_os_load[2].metric.label}
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        data={KIBANA_METRICS.metrics.kibana_os_load[2].data}
      />
    </Chart>
  );
};
