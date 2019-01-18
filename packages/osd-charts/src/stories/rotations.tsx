import { storiesOf } from '@storybook/react';
import React from 'react';
import {
  Axis,
  BarSeries,
  Chart,
  getAxisId,
  getSpecId,
  Position,
  ScaleType,
  Settings,
} from '..';
import './stories.scss';

storiesOf('Rotations', module)
  .add('default', () => {
    return (
      <Chart
        renderer="canvas"
        size={[500, 300]}
        className={'story-chart'}
      >
        <Settings
          showLegend={true}
          legendPosition={Position.Right}
          rotation={0}
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
  .add('default linear', () => {
    return (
      <Chart
        renderer="canvas"
        size={[500, 300]}
        className={'story-chart'}
      >
        <Settings
          showLegend={true}
          legendPosition={Position.Right}
          rotation={0}
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
  .add('90 degree (TO FIX)', () => {
    return (
      <Chart
        renderer="canvas"
        size={[500, 300]}
        className={'story-chart'}
      >
        <Settings
          showLegend={true}
          legendPosition={Position.Right}
          rotation={90}
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
  .add('-90 degree (TO FIX)', () => {
    return (
      <Chart
        renderer="canvas"
        size={[500, 300]}
        className={'story-chart'}
      >
        <Settings
          showLegend={true}
          legendPosition={Position.Right}
          rotation={-90}
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
  .add('180 degree ordinal (TO FIX)', () => {
    return (
      <Chart
        renderer="canvas"
        size={[500, 300]}
        className={'story-chart'}
      >
        <Settings
          showLegend={true}
          legendPosition={Position.Right}
          rotation={180}
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
  .add('180 degree x linear (TO FIX)', () => {
    return (
      <Chart
        renderer="canvas"
        size={[500, 300]}
        className={'story-chart'}
      >
        <Settings
          showLegend={true}
          legendPosition={Position.Right}
          rotation={180}
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
  });
