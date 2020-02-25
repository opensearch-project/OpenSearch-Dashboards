import { boolean, select } from '@storybook/addon-knobs';
import React from 'react';

import { Axis, Chart, LineSeries, Position, ScaleType } from '../../src';
import { SeededDataGenerator } from '../../src/mocks/utils';

export const example = () => {
  const dg = new SeededDataGenerator();
  const base = dg.generateBasicSeries(100, 0, 50);
  const positive = base.map(({ x, y }) => ({ x, y: y + 1000 }));
  const both = base.map(({ x, y }) => ({ x, y: y - 100 }));
  const negative = base.map(({ x, y }) => ({ x, y: y - 1000 }));

  const dataTypes = {
    positive,
    both,
    negative,
  };
  const dataKey = select<'positive' | 'negative' | 'both'>(
    'dataset',
    {
      'Positive values only': 'positive',
      'Positive and negative': 'both',
      'Negtive values only': 'negative',
    },
    'both',
  );

  const dataset = dataTypes[dataKey];
  const fit = boolean('fit domain to data', true);

  return (
    <Chart className="story-chart">
      <Axis id="bottom" title="index" position={Position.Bottom} />
      <Axis
        domain={{ fit }}
        id="left"
        title="Value"
        position={Position.Left}
        tickFormat={(d) => Number(d).toFixed(2)}
      />

      <LineSeries
        id="lines"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={dataset}
      />
    </Chart>
  );
};
