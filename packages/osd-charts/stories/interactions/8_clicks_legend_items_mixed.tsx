import { action } from '@storybook/addon-actions';
import React from 'react';
import { Axis, BarSeries, Chart, LineSeries, Position, ScaleType, Settings } from '../../src/';

export const example = () => {
  return (
    <Chart className="story-chart">
      <Settings
        showLegend
        showLegendExtra
        legendPosition={Position.Right}
        onLegendItemClick={action('onLegendItemClick')}
        onLegendItemOver={action('onLegendItemOver')}
        onLegendItemOut={action('onLegendItemOut')}
      />
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
      <LineSeries
        id="lines"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        stackAccessors={['x']}
        splitSeriesAccessors={['g']}
        data={[
          { x: 0, y: 3 },
          { x: 1, y: 2 },
          { x: 2, y: 4 },
          { x: 3, y: 10 },
        ]}
      />
    </Chart>
  );
};
