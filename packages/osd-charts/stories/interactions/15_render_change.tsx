import { action } from '@storybook/addon-actions';
import React from 'react';
import { Axis, BarSeries, Chart, Position, ScaleType, Settings } from '../../src/';

const onRenderChange = action('onRenderChange');

export const example = () => {
  return (
    <Chart className="story-chart">
      <Settings showLegend showLegendExtra legendPosition={Position.Right} onRenderChange={onRenderChange} />
      <Axis id="bottom" position={Position.Bottom} title="Bottom axis" showOverlappingTicks={true} />
      <Axis id="left2" title="Left axis" position={Position.Left} tickFormat={(d) => Number(d).toFixed(2)} />

      <BarSeries
        id="bars"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={[
          { x: 0, y: 2 },
          { x: 1, y: 7 },
          { x: 2, y: 3 },
          { x: 3, y: 6 },
        ]}
      />
    </Chart>
  );
};

example.story = {
  parameters: {
    info: {
      text: `Sends an event every time the chart render state changes. This is provided to bind attributes to the chart for visulaization loading checks.`,
    },
  },
};
