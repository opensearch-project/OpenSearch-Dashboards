import { boolean, select } from '@storybook/addon-knobs';
import React from 'react';

import { Axis, BarSeries, Chart, Position, ScaleType } from '../../src';

export const example = () => {
  const yScaleToDataExtent = boolean('yScaleDataToExtent', true);
  const mixed = [
    { x: 0, y: -4 },
    { x: 1, y: -3 },
    { x: 2, y: 2 },
    { x: 3, y: 1 },
  ];

  const allPositive = mixed.map((datum) => ({ x: datum.x, y: Math.abs(datum.y) }));
  const allNegative = mixed.map((datum) => ({ x: datum.x, y: Math.abs(datum.y) * -1 }));

  const dataChoice = select(
    'data',
    {
      mixed: 'mixed',
      allPositive: 'all positive',
      allNegative: 'all negative',
    },
    'all negative',
  );

  let data = mixed;
  switch (dataChoice) {
    case 'all positive':
      data = allPositive;
      break;
    case 'all negative':
      data = allNegative;
      break;
  }
  return (
    <Chart className="story-chart">
      <Axis id="top" position={Position.Top} title="Top axis" />
      <Axis id="left2" title="Left axis" position={Position.Left} tickFormat={(d: any) => Number(d).toFixed(2)} />

      <BarSeries
        id="bars"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        splitSeriesAccessors={['g']}
        stackAccessors={['x']}
        data={data}
        yScaleToDataExtent={yScaleToDataExtent}
      />
    </Chart>
  );
};
