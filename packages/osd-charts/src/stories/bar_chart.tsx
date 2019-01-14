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
import { niceTimeFormatter, timeFormatter } from '../utils/data/formatters';
import './stories.scss';

storiesOf('Bar Chart', module)
  .add('basic', () => {
    return (
      <Chart renderer="canvas" size={[500, 300]}>
        <BarSeries
          id={getSpecId('bars')}
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
          id={getSpecId('bars')}
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
  .add('with ordinal x axis', () => {
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
          id={getSpecId('bars')}
          xScaleType={ScaleType.Ordinal}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          data = {[
            { x: 'a', y: 2 },
            { x: 'b', y: 7 },
            { x: 'c', y: 3 },
            { x: 'd', y: 6 },
          ]}
          yScaleToDataExtent ={false}
        />
    </Chart>);
  })
  .add('with linear x axis', () => {
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
          id={getSpecId('bars')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          data = {[
            { x: 1, y: 2 },
            { x: 2, y: 7 },
            { x: 4, y: 3 },
            { x: 9, y: 6 },
          ]}
          yScaleToDataExtent ={false}
        />
    </Chart>);
  })
  .add('with time x axis', () => {
    const now = new Date().getTime();
    const max = now + 1000 * 60 * 60 * 24 * 90;
    return (
      <Chart renderer="canvas" size={[500, 300]}>
        <Axis
          id={getAxisId('bottom')}
          position={Position.Bottom}
          title={'Bottom axis'}
          showOverlappingTicks={true}
          tickFormat={niceTimeFormatter([now, max])}
        />
        <Axis
          id={getAxisId('left2')}
          title={'Left axis'}
          position={Position.Left}
          tickFormat={(d) => Number(d).toFixed(2)}
        />

        <BarSeries
          id={getSpecId('bars')}
          xScaleType={ScaleType.Time}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          data = {[
            { x: now, y: 2 },
            { x: now + 36000000000, y: 7 },
            { x: now + 36000000000 * 2, y: 3 },
            { x: now + 36000000000 * 5, y: 6 },
          ]}
          yScaleToDataExtent ={false}
        />
    </Chart>);
  })
  .add('with log y axis (TO FIX)', () => {
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
          id={getSpecId('bars')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Log}
          xAccessor="x"
          yAccessors={['y']}
          data = {[
            { x: 1, y: 2 },
            { x: 2, y: 7 },
            { x: 4, y: 3 },
            { x: 9, y: 6 },
          ]}
          yScaleToDataExtent ={true}
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
          id={getSpecId('bars')}
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
          id={getSpecId('bars')}
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
          id={getSpecId('bars')}
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
  })
  .add('clustered multi series', () => {
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
          id={getSpecId('bars1')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          splitSeriesAccessors={['g']}
          data = {[
            { x: 0, y: 2 },
            { x: 1, y: 7 },
            { x: 2, y: 3 },
            { x: 3, y: 6 },
          ]}
          yScaleToDataExtent ={false}
        />
        <BarSeries
          id={getSpecId('bars2')}
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          splitSeriesAccessors={['g']}
          data = {[
            { x: 0, y: 1 },
            { x: 1, y: 2 },
            { x: 2, y: 3 },
            { x: 3, y: 4 },
          ]}
          yScaleToDataExtent ={false}
        />
    </Chart>);
  });
