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
  Rotation,
  ScaleType,
  Settings,
} from '..';
import './stories.scss';

storiesOf('Axis', module)
  .add('basic', () => {
    return (
      <Chart renderer="canvas" size={[500, 300]}>
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
          data = {[
            { x: 0, y: 2 },
            { x: 1, y: 7 },
            { x: 2, y: 3 },
            { x: 3, y: 6 },
          ]}
          yScaleToDataExtent ={false}
        />
    </Chart>);
  })
  .add('4 axes', () => {
    return (
      <Chart renderer="canvas" size={[500, 300]}>
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
          data = {[
            { x: 0, y: 2 },
            { x: 1, y: 7 },
            { x: 2, y: 3 },
            { x: 3, y: 6 },
          ]}
          yScaleToDataExtent ={false}
        />
    </Chart>);
  })
  .add('with multi axis', () => {
    return (
      <Chart renderer="canvas" size={[500, 300]}>
        <Settings
          showLegend={false}
        />
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
          data = {[
            { x: 0, y: 1 },
            { x: 1, y: 2 },
            { x: 2, y: 3 },
            { x: 3, y: 4 },
          ]}
        />
        <BarSeries
          id={getSpecId('barseries2')}
          groupId={getGroupId('group2')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          data = {[
            { x: 0, y: 8 },
            { x: 1, y: 7 },
            { x: 2, y: 6 },
            { x: 3, y: 5 },
          ]}
        />
    </Chart>);
  });
