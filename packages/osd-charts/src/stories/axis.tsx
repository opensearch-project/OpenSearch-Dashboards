import { boolean, number } from '@storybook/addon-knobs';
import { storiesOf } from '@storybook/react';
import React from 'react';
import {
  AreaSeries,
  Axis,
  BarSeries,
  Chart,
  getAxisId,
  getGroupId,
  getSpecId,
  Position,
  ScaleType,
  Settings,
} from '..';
import { LineSeries } from '../specs';

storiesOf('Axis', module)
  .add('basic', () => {
    return (
      <Chart renderer="canvas" size={[500, 300]} className={'story-chart'}>
        <Settings debug={boolean('debug', false)} />
        <Axis
          id={getAxisId('bottom')}
          position={Position.Bottom}
          title={'Bottom axis'}
          showOverlappingTicks={true}
        />
        <Axis
          id={getAxisId('left2')}
          title={'Left axis'}
          position={Position.Left}
          tickFormat={(d) => Number(d).toFixed(2)}
        />

        <AreaSeries
          id={getSpecId('lines')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          data={[{ x: 0, y: 2 }, { x: 1, y: 7 }, { x: 2, y: 3 }, { x: 3, y: 6 }]}
          yScaleToDataExtent={false}
        />
      </Chart>
    );
  })
  .add('tick label rotation', () => {
    return (
      <Chart renderer="canvas" size={[500, 300]} className={'story-chart'}>
        <Axis
          id={getAxisId('bottom')}
          position={Position.Bottom}
          title={'Bottom axis'}
          showOverlappingTicks={true}
          tickLabelRotation={number('bottom axis tick label rotation', 0, {
            range: true,
            min: -90,
            max: 90,
            step: 1,
          })}
        />
        <Axis
          id={getAxisId('left')}
          title={'Bar axis'}
          position={Position.Left}
          tickLabelRotation={number('left axis tick label rotation', 0, {
            range: true,
            min: -90,
            max: 90,
            step: 1,
          })}
          tickFormat={(d) => Number(d).toFixed(2)}
        />
        <Axis
          id={getAxisId('top')}
          title={'Bar axis'}
          position={Position.Top}
          tickLabelRotation={number('top axis tick label rotation', 0, {
            range: true,
            min: -90,
            max: 90,
            step: 1,
          })}
          tickFormat={(d) => Number(d).toFixed(2)}
        />
        <Axis
          id={getAxisId('right')}
          title={'Bar axis'}
          position={Position.Right}
          tickLabelRotation={number('right axis tick label rotation', 0, {
            range: true,
            min: -90,
            max: 90,
            step: 1,
          })}
          tickFormat={(d) => Number(d).toFixed(2)}
        />
        <AreaSeries
          id={getSpecId('lines')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          data={[{ x: 0, y: 2 }, { x: 1, y: 7 }, { x: 2, y: 3 }, { x: 3, y: 6 }]}
          yScaleToDataExtent={false}
        />
        <Settings debug={boolean('debug', false)} />
      </Chart>
    );
  })
  .add('4 axes', () => {
    return (
      <Chart renderer="canvas" size={[500, 300]} className={'story-chart'}>
        <Axis
          id={getAxisId('bottom')}
          position={Position.Bottom}
          title={'bottom'}
          showOverlappingTicks={true}
        />
        <Axis
          id={getAxisId('left')}
          title={'left'}
          position={Position.Left}
          tickFormat={(d) => Number(d).toFixed(2)}
        />
        <Axis
          id={getAxisId('top')}
          position={Position.Top}
          title={'top'}
          showOverlappingTicks={true}
        />
        <Axis
          id={getAxisId('right')}
          title={'right'}
          position={Position.Right}
          tickFormat={(d) => Number(d).toFixed(2)}
        />

        <AreaSeries
          id={getSpecId('lines')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          data={[{ x: 0, y: 2 }, { x: 1, y: 7 }, { x: 2, y: 3 }, { x: 3, y: 6 }]}
          yScaleToDataExtent={false}
        />
      </Chart>
    );
  })
  .add('with multi axis (TO FIX)', () => {
    return (
      <Chart renderer="canvas" size={[500, 300]} className={'story-chart'}>
        <Settings showLegend={false} />
        <Axis
          id={getAxisId('bottom')}
          position={Position.Bottom}
          title={'Bottom axis'}
          showOverlappingTicks={true}
        />
        <Axis
          id={getAxisId('left1')}
          title={'First left axis'}
          position={Position.Left}
          tickFormat={(d) => Number(d).toFixed(2)}
        />
        <Axis
          id={getAxisId('left2')}
          title={'Second left axis'}
          groupId={getGroupId('group2')}
          position={Position.Left}
          tickFormat={(d) => Number(d).toFixed(2)}
        />
        <BarSeries
          id={getSpecId('barseries1')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          data={[{ x: 0, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 3 }, { x: 3, y: 4 }]}
        />
        <BarSeries
          id={getSpecId('barseries2')}
          groupId={getGroupId('group2')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          data={[{ x: 0, y: 8 }, { x: 1, y: 7 }, { x: 2, y: 6 }, { x: 3, y: 5 }]}
        />
      </Chart>
    );
  })
  .add('with multi axis bar/lines', () => {
    return (
      <Chart renderer="canvas" size={[500, 300]} className={'story-chart'}>
        <Settings showLegend={false} />
        <Axis
          id={getAxisId('bottom')}
          position={Position.Bottom}
          title={'Bottom axis'}
          showOverlappingTicks={true}
        />
        <Axis
          id={getAxisId('left')}
          title={'Bar axis'}
          position={Position.Left}
          tickFormat={(d) => Number(d).toFixed(2)}
        />
        <Axis
          id={getAxisId('right')}
          title={'Line axis'}
          groupId={getGroupId('group2')}
          position={Position.Right}
          tickFormat={(d) => Number(d).toFixed(2)}
        />
        <BarSeries
          id={getSpecId('bars')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          data={[{ x: 0, y: 2 }, { x: 1, y: 7 }, { x: 2, y: 3 }, { x: 3, y: 6 }]}
          yScaleToDataExtent={false}
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
          yScaleToDataExtent={false}
        />
      </Chart>
    );
  });
