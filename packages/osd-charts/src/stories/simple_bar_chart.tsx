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

storiesOf('Bar Chart', module)
  .add('basic', () => {
    return (
      <Chart renderer="canvas" size={[500, 300]}>
        <BarSeries
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
  .add('with axis', () => {
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

        <BarSeries
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
  .add('with axis and legend', () => {
    return (
      <Chart renderer="canvas" size={[500, 300]}>
        <Settings
          showLegend={true}
          legendPosition={Position.Right}
        />
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

        <BarSeries
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
  .add('stacked with axis and legend', () => {
    return (
      <Chart renderer="canvas" size={[500, 300]}>
        <Settings
          showLegend={true}
          legendPosition={Position.Right}
        />
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

        <BarSeries
          id={getSpecId('lines')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          stackAccessors={['x']}
          splitSeriesAccessors={['g']}
          data = {[
            { x: 0, y: 2, g: 'a' },
            { x: 1, y: 7, g: 'a' },
            { x: 2, y: 3, g: 'a' },
            { x: 3, y: 6, g: 'a' },
            { x: 0, y: 4, g: 'b' },
            { x: 1, y: 5, g: 'b' },
            { x: 2, y: 8, g: 'b' },
            { x: 3, y: 2, g: 'b' },
          ]}
          yScaleToDataExtent ={false}
        />
    </Chart>);
  })
  .add('clustered with axis and legend', () => {
    return (
      <Chart renderer="canvas" size={[500, 300]}>
        <Settings
          showLegend={true}
          legendPosition={Position.Right}
        />
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

        <BarSeries
          id={getSpecId('lines')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          splitSeriesAccessors={['g']}
          data = {[
            { x: 0, y: 2, g: 'a' },
            { x: 1, y: 7, g: 'a' },
            { x: 2, y: 3, g: 'a' },
            { x: 3, y: 6, g: 'a' },
            { x: 0, y: 4, g: 'b' },
            { x: 1, y: 5, g: 'b' },
            { x: 2, y: 8, g: 'b' },
            { x: 3, y: 2, g: 'b' },
          ]}
          yScaleToDataExtent ={false}
        />
    </Chart>);
  });
