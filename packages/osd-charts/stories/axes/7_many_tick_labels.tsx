import { number } from '@storybook/addon-knobs';
import React from 'react';

import { AreaSeries, Axis, Chart, Position, ScaleType, Settings } from '../../src';
import { SeededDataGenerator } from '../../src/mocks/utils';

export const example = () => {
  const dg = new SeededDataGenerator();
  const data = dg.generateSimpleSeries(31);
  const customStyle = {
    tickLabelPadding: number('Tick Label Padding', 0),
  };

  return (
    <Chart className="story-chart">
      <Settings debug={true} />
      <Axis
        id="bottom"
        position={Position.Bottom}
        title="Bottom axis"
        showOverlappingTicks={true}
        style={customStyle}
      />
      <AreaSeries
        id="lines"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={data}
      />
    </Chart>
  );
};
