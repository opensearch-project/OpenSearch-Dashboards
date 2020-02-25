import { boolean } from '@storybook/addon-knobs';
import React from 'react';
import { Axis, BarSeries, Chart, RectAnnotation, ScaleType, Settings } from '../../../src';
import { getChartRotationKnob } from '../../utils/knobs';
import { Position } from '../../../src/utils/commons';

export const example = () => {
  const debug = boolean('debug', false);
  const rotation = getChartRotationKnob();

  const dataValues = [
    {
      coordinates: {
        x0: 'a',
        x1: 'b',
      },
      details: 'details about this annotation',
    },
  ];

  return (
    <Chart className="story-chart">
      <Settings debug={debug} rotation={rotation} />
      <RectAnnotation dataValues={dataValues} id="rect" />
      <Axis id="bottom" position={Position.Bottom} title="x-domain axis" />
      <Axis id="left" title="y-domain axis" position={Position.Left} />
      <BarSeries
        id="bars"
        xScaleType={ScaleType.Ordinal}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={[
          { x: 'a', y: 2 },
          { x: 'b', y: 7 },
          { x: 'c', y: 0 },
          { x: 'd', y: 6 },
        ]}
      />
    </Chart>
  );
};
