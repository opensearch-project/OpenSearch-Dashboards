import { boolean, color, number } from '@storybook/addon-knobs';
import { storiesOf } from '@storybook/react';
import React from 'react';
import {
  Axis,
  BarSeries,
  Chart,
  getAxisId,
  getGroupId,
  getSpecId,
  GridLineConfig,
  LineSeries,
  Position,
  ScaleType,
  Settings,
} from '../src/';

function generateGridLineConfig(group: string, gridColor: string = 'purple'): GridLineConfig {
  const groupId = `${group} axis`;

  return {
    stroke: color(`${groupId} grid line stroke color`, gridColor, groupId),
    strokeWidth: number(
      `${groupId} grid line stroke width`,
      1,
      {
        range: true,
        min: 0,
        max: 10,
        step: 1,
      },
      groupId,
    ),
    opacity: number(
      `${groupId} grid line stroke opacity`,
      1,
      {
        range: true,
        min: 0,
        max: 1,
        step: 0.01,
      },
      groupId,
    ),
    dash: [
      number(
        `${groupId} grid line dash length`,
        1,
        {
          range: true,
          min: 0,
          max: 10,
          step: 1,
        },
        groupId,
      ),
      number(
        `${groupId} grid line dash spacing`,
        1,
        {
          range: true,
          min: 0,
          max: 10,
          step: 1,
        },
        groupId,
      ),
    ],
  };
}

storiesOf('Grids', module)
  .add('basic', () => {
    const leftAxisGridLineConfig = generateGridLineConfig(Position.Left, 'lightblue');
    const rightAxisGridLineConfig = generateGridLineConfig(Position.Right, 'red');
    const topAxisGridLineConfig = generateGridLineConfig(Position.Top, 'teal');
    const bottomAxisGridLineConfig = generateGridLineConfig(Position.Bottom, 'blue');
    const toggleBottomAxisGridLineStyle = boolean('use axis gridLineStyle vertically', false, 'bottom axis');
    const toggleHorizontalAxisGridLineStyle = boolean('use axis gridLineStyle horizontally', false, 'left axis');
    const bottomAxisThemeGridLineConfig = generateGridLineConfig('Vertical Axis Theme', 'violet');
    const leftAxisThemeGridLineConfig = generateGridLineConfig('Horizontal Axis Theme', 'hotpink');
    const theme = {
      axes: {
        gridLineStyle: { vertical: leftAxisThemeGridLineConfig, horizontal: bottomAxisThemeGridLineConfig },
      },
    };
    const integersOnlyLeft = boolean('left axis show only integer values', false, 'left axis');
    const integersOnlyRight = boolean('right axis show only intger values', false, 'right axis');
    return (
      <Chart className={'story-chart'}>
        <Settings debug={boolean('debug', false)} theme={theme} />
        <Axis
          id={getAxisId('bottom')}
          position={Position.Bottom}
          title={'Bottom axis'}
          showOverlappingTicks={true}
          showGridLines={boolean('show bottom axis grid lines', false, 'bottom axis')}
          gridLineStyle={toggleBottomAxisGridLineStyle ? bottomAxisGridLineConfig : undefined}
          integersOnly={boolean('bottom axis show only integer values', false, 'bottom axis')}
        />
        <Axis
          id={getAxisId('left1')}
          position={Position.Left}
          title={'Left axis 1'}
          tickFormat={integersOnlyLeft ? (d) => Number(d).toFixed(0) : (d) => Number(d).toFixed(2)}
          showGridLines={boolean('show left axis grid lines', false, 'left axis')}
          gridLineStyle={toggleHorizontalAxisGridLineStyle ? leftAxisGridLineConfig : undefined}
          integersOnly={integersOnlyLeft}
        />
        <Axis
          id={getAxisId('top')}
          position={Position.Top}
          title={'Top axis'}
          showOverlappingTicks={true}
          showGridLines={boolean('show top axis grid lines', false, 'top axis')}
          gridLineStyle={topAxisGridLineConfig}
          integersOnly={boolean('top axis show only integer values', false, 'top axis')}
        />
        <Axis
          id={getAxisId('right')}
          title={'Right axis'}
          position={Position.Right}
          tickFormat={integersOnlyRight ? (d) => Number(d).toFixed(0) : (d) => Number(d).toFixed(2)}
          showGridLines={boolean('show right axis grid lines', false, 'right axis')}
          gridLineStyle={rightAxisGridLineConfig}
          integersOnly={integersOnlyRight}
        />
        <BarSeries
          id={getSpecId('bars')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          data={[{ x: 0, y: 2 }, { x: 1, y: 7 }, { x: 2, y: 3 }, { x: 3, y: 6 }]}
        />
        <LineSeries
          id={getSpecId('lines')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          groupId={getGroupId('group2')}
          xAccessor="x"
          yAccessors={['y']}
          stackAccessors={['x']}
          splitSeriesAccessors={['g']}
          data={[{ x: 0, y: 3 }, { x: 1, y: 2 }, { x: 2, y: 4 }, { x: 3, y: 10 }]}
        />
      </Chart>
    );
  })
  .add('multiple axes with the same position', () => {
    const leftAxisGridLineConfig = generateGridLineConfig(Position.Left);
    const leftAxisGridLineConfig2 = generateGridLineConfig(`${Position.Left}2`);

    return (
      <Chart size={[500, 300]} className={'story-chart'}>
        <Settings debug={boolean('debug', false)} />
        <Axis
          id={getAxisId('left1')}
          title={'Left axis 1'}
          position={Position.Left}
          tickFormat={(d) => Number(d).toFixed(2)}
          showGridLines={boolean('show left axis grid lines', false, 'left axis')}
          gridLineStyle={leftAxisGridLineConfig}
        />
        <Axis
          id={getAxisId('left2')}
          title={'Left axis 2'}
          groupId={getGroupId('group2')}
          position={Position.Left}
          tickFormat={(d) => Number(d).toFixed(2)}
          showGridLines={boolean('show left axis 2 grid lines', false, 'left2 axis')}
          gridLineStyle={leftAxisGridLineConfig2}
        />
        <BarSeries
          id={getSpecId('bars')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          data={[{ x: 0, y: 2 }, { x: 1, y: 7 }, { x: 2, y: 3 }, { x: 3, y: 6 }]}
        />
        <LineSeries
          id={getSpecId('lines')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          groupId={getGroupId('group2')}
          xAccessor="x"
          yAccessors={['y']}
          stackAccessors={['x']}
          splitSeriesAccessors={['g']}
          data={[{ x: 0, y: 3 }, { x: 1, y: 2 }, { x: 2, y: 4 }, { x: 3, y: 10 }]}
        />
      </Chart>
    );
  });
