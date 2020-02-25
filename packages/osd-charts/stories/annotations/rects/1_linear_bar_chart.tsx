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
        x0: 0,
        x1: 1,
        y0: 0,
        y1: 7,
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
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={[
          { x: 0, y: 2 },
          { x: 1, y: 7 },
          { x: 3, y: 6 },
        ]}
      />
    </Chart>
  );
};
