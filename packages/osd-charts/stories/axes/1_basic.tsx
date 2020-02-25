import { boolean, number } from '@storybook/addon-knobs';
import React from 'react';
import { AreaSeries, Axis, Chart, Position, ScaleType, Settings, niceTimeFormatter } from '../../src';
import { KIBANA_METRICS } from '../../src/utils/data_samples/test_dataset_kibana';

export const example = () => {
  const customStyle = {
    tickLabelPadding: number('Tick Label Padding', 0, {
      range: true,
      min: 2,
      max: 30,
      step: 1,
    }),
  };
  const data = KIBANA_METRICS.metrics.kibana_os_load[0].data.slice(0, 60);
  return (
    <Chart className="story-chart">
      <Settings debug={boolean('debug', false)} />
      <Axis
        id="bottom"
        position={Position.Bottom}
        title="Bottom axis"
        style={customStyle}
        showOverlappingLabels={boolean('Bottom overlap labels', false, 'Bottom Axis')}
        showOverlappingTicks={boolean('Bottom overlap ticks', true, 'Bottom Axis')}
        ticks={number(
          'Number of ticks on bottom',
          10,
          {
            range: true,
            min: 2,
            max: 20,
            step: 1,
          },
          'Bottom Axis',
        )}
        tickFormat={niceTimeFormatter([data[0][0], data[data.length - 1][0]])}
      />
      <Axis
        id="left2"
        title="Left axis"
        position={Position.Left}
        tickFormat={(d) => Number(d).toFixed(2)}
        style={customStyle}
        showOverlappingLabels={boolean('Left overlap labels', false, 'Left Axis')}
        showOverlappingTicks={boolean('Left overlap ticks', true, 'Left Axis')}
        ticks={number(
          'Number of ticks on left',
          10,
          {
            range: true,
            min: 2,
            max: 20,
            step: 1,
          },
          'Left Axis',
        )}
      />

      <AreaSeries
        id="lines"
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        data={data}
      />
    </Chart>
  );
};
