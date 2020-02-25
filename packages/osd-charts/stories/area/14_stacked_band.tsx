import { boolean } from '@storybook/addon-knobs';
import React from 'react';
import { AreaSeries, Axis, Chart, Position, ScaleType, Settings, timeFormatter } from '../../src';
import { KIBANA_METRICS } from '../../src/utils/data_samples/test_dataset_kibana';

const dateFormatter = timeFormatter('HH:mm');

export const example = () => {
  const data = KIBANA_METRICS.metrics.kibana_os_load[0].data;
  const data2 = KIBANA_METRICS.metrics.kibana_os_load[0].data.map((d) => [d[0], 20, 10]);
  const scaleToDataExtent = boolean('scale to extent', false);

  return (
    <Chart className="story-chart">
      <Settings showLegend showLegendExtra />
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
        tickFormat={(d) => Number(d).toFixed(2)}
      />

      <AreaSeries
        id="area"
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        y0Accessors={[2]}
        data={data}
        stackAccessors={[0]}
        yScaleToDataExtent={scaleToDataExtent}
      />

      <AreaSeries
        id="fixed band"
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        y0Accessors={[2]}
        data={data2}
        stackAccessors={[0]}
        yScaleToDataExtent={scaleToDataExtent}
      />
    </Chart>
  );
};
