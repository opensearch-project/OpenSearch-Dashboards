import { action } from '@storybook/addon-actions';
import { storiesOf } from '@storybook/react';
import React from 'react';
import { Axis, BarSeries, Chart, getAxisId, getSpecId, Position, ScaleType, Settings } from '..';

import { boolean } from '@storybook/addon-knobs';
import { DateTime } from 'luxon';
import { AreaSeries, LineSeries } from '../specs';
import { niceTimeFormatter } from '../utils/data/formatters';
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
      <Chart renderer="canvas" size={[500, 300]} className={'story-chart'}>
        <Settings showLegend={true} legendPosition={Position.Right} {...onElementListeners} />
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
          data={[{ x: 0, y: 2 }, { x: 1, y: 7 }, { x: 2, y: 3 }, { x: 3, y: 6 }]}
          yScaleToDataExtent={false}
        />
      </Chart>
    );
  })
  .add('area point clicks and hovers', () => {
    return (
      <Chart renderer="canvas" size={[500, 300]} className={'story-chart'}>
        <Settings showLegend={true} legendPosition={Position.Right} {...onElementListeners} />
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
          data={[{ x: 0, y: 2 }, { x: 1, y: 7 }, { x: 2, y: 3 }, { x: 3, y: 6 }]}
          yScaleToDataExtent={false}
        />
      </Chart>
    );
  })
  .add('line point clicks and hovers', () => {
    return (
      <Chart renderer="canvas" size={[500, 300]} className={'story-chart'}>
        <Settings showLegend={true} legendPosition={Position.Right} {...onElementListeners} />
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
          data={[{ x: 0, y: 2 }, { x: 1, y: 7 }, { x: 2, y: 3 }, { x: 3, y: 6 }]}
          yScaleToDataExtent={false}
        />
      </Chart>
    );
  })
  .add('click/hovers on legend items (TO DO)', () => <h1>TO DO</h1>)
  .add('brush selection tool on linear', () => {
    return (
      <Chart renderer="canvas" size={[500, 300]} className={'story-chart'}>
        <Settings onBrushEnd={action('onBrushEnd')} />
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
  .add('brush selection tool on time charts', () => {
    const now = DateTime.fromISO('2019-01-11T00:00:00.000').toMillis();
    const oneDay = 1000 * 60 * 60 * 24;
    return (
      <Chart renderer="canvas" size={[500, 300]} className={'story-chart'}>
        <Settings debug={boolean('debug', false)} onBrushEnd={action('onBrushEnd')} />
        <Axis
          id={getAxisId('bottom')}
          position={Position.Bottom}
          title={'bottom'}
          showOverlappingTicks={true}
          tickFormat={niceTimeFormatter([now, now + oneDay * 5])}
        />
        <Axis
          id={getAxisId('left')}
          title={'left'}
          position={Position.Left}
          tickFormat={(d) => Number(d).toFixed(2)}
        />

        <BarSeries
          id={getSpecId('bars')}
          xScaleType={ScaleType.Time}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          data={[
            { x: now, y: 2 },
            { x: now + oneDay, y: 7 },
            { x: now + oneDay * 2, y: 3 },
            { x: now + oneDay * 5, y: 6 },
          ]}
          yScaleToDataExtent={false}
        />
      </Chart>
    );
  })
  .add('brush disabled on ordinal x axis', () => {
    return (
      <Chart renderer="canvas" size={[500, 300]} className={'story-chart'}>
        <Settings onBrushEnd={action('onBrushEnd')} />
        <Axis
          id={getAxisId('bottom')}
          position={Position.Bottom}
          title={'bottom'}
          showOverlappingTicks={true}
        />
        <Axis id={getAxisId('left')} title={'left'} position={Position.Left} />
        <LineSeries
          id={getSpecId('lines')}
          xScaleType={ScaleType.Ordinal}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          data={[{ x: 'a', y: 2 }, { x: 'b', y: 7 }, { x: 'c', y: 3 }, { x: 'd', y: 6 }]}
          yScaleToDataExtent={false}
        />
      </Chart>
    );
  });
