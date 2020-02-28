import { boolean, number } from '@storybook/addon-knobs';
import React from 'react';

import {
  AreaSeries,
  Axis,
  BarSeries,
  Chart,
  LineSeries,
  Position,
  ScaleType,
  Settings,
  RecursivePartial,
  BarSeriesStyle,
  PointStyle,
  BarStyleAccessor,
  PointStyleAccessor,
} from '../../src';

export const example = () => {
  const hasThreshold = boolean('threshold', true);
  const threshold = number('min threshold', 3);
  const barStyle: RecursivePartial<BarSeriesStyle> = {
    rect: {
      opacity: 0.5,
      fill: 'red',
    },
  };
  const pointStyle: RecursivePartial<PointStyle> = {
    fill: 'red',
    radius: 10,
  };
  const barStyleAccessor: BarStyleAccessor = (d, g) => (g.specId === 'bar' && d.y1! > threshold ? barStyle : null);
  const pointStyleAccessor: PointStyleAccessor = (d, g) =>
    (g.specId === 'line' || g.specId === 'area') && d.y1! > threshold ? pointStyle : null;

  return (
    <Chart className="story-chart">
      <Settings
        theme={{
          areaSeriesStyle: {
            point: {
              visible: true,
            },
          },
        }}
      />
      <Axis id="bottom" position={Position.Bottom} title="Bottom axis" showOverlappingTicks={true} />
      <Axis id="left" title="Left axis" position={Position.Left} tickFormat={(d: any) => Number(d).toFixed(2)} />

      <BarSeries
        id="bar"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        styleAccessor={hasThreshold ? barStyleAccessor : undefined}
        data={[
          { x: 0, y: 2 },
          { x: 1, y: 7 },
          { x: 2, y: 3 },
          { x: 3, y: 6 },
        ]}
      />

      <LineSeries
        id="line"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        pointStyleAccessor={hasThreshold ? pointStyleAccessor : undefined}
        data={[
          { x: 0, y: 1 },
          { x: 1, y: 6 },
          { x: 2, y: 2 },
          { x: 3, y: 5 },
        ]}
      />

      <AreaSeries
        id="area"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        pointStyleAccessor={hasThreshold ? pointStyleAccessor : undefined}
        data={[
          { x: 0, y: 0.5 },
          { x: 1, y: 4 },
          { x: 2, y: 1 },
          { x: 3, y: 4 },
        ]}
      />
    </Chart>
  );
};
