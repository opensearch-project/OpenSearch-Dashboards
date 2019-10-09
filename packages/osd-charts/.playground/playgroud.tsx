import React, { Fragment } from 'react';
import { Axis, Chart, getAxisId, getSpecId, Position, ScaleType, Settings, AreaSeries } from '../src';

export class Playground extends React.Component {
  render() {
    return (
      <Fragment>
        <div className="chart">
          <Chart>
            <Settings showLegend theme={{ areaSeriesStyle: { point: { visible: true } } }} />
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
              tickFormat={(d: any) => Number(d).toFixed(2)}
            />
            <AreaSeries
              id={getSpecId('bars1')}
              xScaleType={ScaleType.Linear}
              yScaleType={ScaleType.Linear}
              xAccessor="x"
              yAccessors={['y']}
              stackAccessors={['x']}
              splitSeriesAccessors={['g']}
              // curve={CurveType.CURVE_MONOTONE_X}
              data={[
                { x: 0, y: 2, g: 'a' },
                { x: 1, y: 7, g: 'a' },
                { x: 2, y: 3, g: 'a' },
                { x: 3, y: 6, g: 'a' },
                { x: 0, y: 4, g: 'b' },
                { x: 1, y: 5, g: 'b' },
                { x: 2, y: 8, g: 'b' },
                { x: 3, y: 2, g: 'b' },
                { x: 4, y: 6, g: 'b' },
                { x: 5, y: 7, g: 'a' },
                { x: 5, y: 7, g: 'b' },
                { x: 6, y: 7, g: 'a' },
                { x: 6, y: 7, g: 'b' },
              ]}
            />
            <AreaSeries
              id={getSpecId('area2')}
              xScaleType={ScaleType.Linear}
              yScaleType={ScaleType.Linear}
              xAccessor="x"
              yAccessors={['y']}
              stackAccessors={['x']}
              splitSeriesAccessors={['g']}
              // curve={CurveType.CURVE_MONOTONE_X}
              data={[
                { x: 1, y: 7, g: 'a' },
                { x: 2, y: 3, g: 'a' },
                { x: 3, y: 6, g: 'a' },
                { x: 0, y: 4, g: 'b' },
                { x: 1, y: 5, g: 'b' },
                { x: 2, y: 8, g: 'b' },
                { x: 3, y: 2, g: 'b' },
                { x: 4, y: 6, g: 'b' },
              ]}
            />
          </Chart>
        </div>
      </Fragment>
    );
  }
}
