import { action } from '@storybook/addon-actions';
import React from 'react';
import { Axis, BarSeries, Chart, Position, ScaleType, Settings } from '../../src/';

import { getChartRotationKnob } from '../utils/knobs';

export const example = () => {
  return (
    <Chart className="story-chart">
      <Settings onBrushEnd={action('onBrushEnd')} rotation={getChartRotationKnob()} />
      <Axis id="bottom" position={Position.Bottom} title="bottom" showOverlappingTicks={true} />
      <Axis id="left" title="left" position={Position.Left} tickFormat={(d) => Number(d).toFixed(2)} />
      <Axis id="top" position={Position.Top} title="top" showOverlappingTicks={true} />
      <Axis id="right" title="right" position={Position.Right} tickFormat={(d) => Number(d).toFixed(2)} />

      <BarSeries
        id="lines"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={[
          { x: 1, y: 2 },
          { x: 2, y: 7 },
          { x: 3, y: 3 },
        ]}
      />
    </Chart>
  );
};
