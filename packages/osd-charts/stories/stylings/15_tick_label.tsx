import { boolean, color, number } from '@storybook/addon-knobs';
import React from 'react';

import { AreaSeries, Axis, Chart, PartialTheme, Position, ScaleType, Settings } from '../../src';

function range(title: string, min: number, max: number, value: number, groupId?: string, step = 1) {
  return number(
    title,
    value,
    {
      range: true,
      min,
      max,
      step,
    },
    groupId,
  );
}

export const example = () => {
  const theme: PartialTheme = {
    axes: {
      tickLabelStyle: {
        fill: color('tickFill', '#333', 'Tick Label'),
        fontSize: range('tickFontSize', 0, 40, 10, 'Tick Label'),
        fontFamily: `'Open Sans', Helvetica, Arial, sans-serif`,
        fontStyle: 'normal',
        padding: number('Tick Label Padding Theme', 1, {}, 'Tick Label'),
      },
    },
  };
  const customStyle = {
    tickLabelPadding: number('Tick Label Padding Axis Spec', 0),
  };
  return (
    <Chart className="story-chart">
      <Settings theme={theme} debug={boolean('debug', true)} />
      <Axis
        id="bottom"
        position={Position.Bottom}
        title="Bottom axis"
        showOverlappingTicks={true}
        style={customStyle}
      />
      <Axis id="left2" title="Left axis" position={Position.Left} tickFormat={(d) => Number(d).toFixed(2)} />
      <AreaSeries
        id="lines"
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
