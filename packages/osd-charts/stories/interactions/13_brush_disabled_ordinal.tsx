import { action } from '@storybook/addon-actions';
import React from 'react';
import { Axis, Chart, LineSeries, Position, ScaleType, Settings } from '../../src/';

import { getChartRotationKnob } from '../utils/knobs';

export const example = () => {
  return (
    <Chart className="story-chart">
      <Settings onBrushEnd={action('onBrushEnd')} rotation={getChartRotationKnob()} />
      <Axis id="bottom" position={Position.Bottom} title="bottom" showOverlappingTicks={true} />
      <Axis id="left" title="left" position={Position.Left} />
      <LineSeries
        id="lines"
        xScaleType={ScaleType.Ordinal}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={[
          { x: 'a', y: 2 },
          { x: 'b', y: 7 },
          { x: 'c', y: 3 },
          { x: 'd', y: 6 },
        ]}
      />
    </Chart>
  );
};
