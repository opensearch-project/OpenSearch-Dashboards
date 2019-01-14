import { action } from '@storybook/addon-actions';
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

import { AreaSeries, LineSeries } from '../specs';
import './stories.scss';

// const onValueClick = action('onValueClick');
const onElementListeners = {
  onElementClick: action('onElementClick'),
  onElementOver: action('onElementOver'),
  onElementOut: action('onElementOut'),
};

storiesOf('Interactions', module)
  .add('bar clicks and hovers', () => {
    return (
      <Chart renderer="canvas"  size={[500, 300]} className={'story-chart'}>
        <Settings
          showLegend={true}
          legendPosition={Position.Right}
          {...onElementListeners}
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
  .add('area point clicks and hovers', () => {
    return (
      <Chart renderer="canvas"  size={[500, 300]} className={'story-chart'}>
        <Settings
          showLegend={true}
          legendPosition={Position.Right}
          {...onElementListeners}
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

        <AreaSeries
          id={getSpecId('area')}
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
  .add('line point clicks and hovers', () => {
    return (
      <Chart renderer="canvas"  size={[500, 300]} className={'story-chart'}>
        <Settings
          showLegend={true}
          legendPosition={Position.Right}
          {...onElementListeners}
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

        <LineSeries
          id={getSpecId('line')}
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
