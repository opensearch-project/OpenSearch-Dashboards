import React, { Fragment } from 'react';
import {
  Axis,
  Chart,
  getAxisId,
  getSpecId,
  Position,
  ScaleType,
  Settings,
  BarSeries,
  LineSeries,
  AreaSeries,
} from '../src';

export class Playground extends React.Component {
  render() {
    return (
      <Fragment>
        <div className="chart">
          <Chart className="story-chart">
            <Settings
              theme={{
                areaSeriesStyle: {
                  point: {
                    visible: true,
                  },
                },
              }}
              xDomain={{
                max: 3.8,
              }}
            />
            <Axis
              id={getAxisId('bottom')}
              position={Position.Bottom}
              title={'Bottom axis'}
              showOverlappingTicks={true}
            />
            <Axis
              id={getAxisId('left')}
              title={'Left axis'}
              position={Position.Left}
              domain={{
                max: 5,
              }}
            />

            <BarSeries
              id={getSpecId('bar')}
              xScaleType={ScaleType.Linear}
              yScaleType={ScaleType.Linear}
              xAccessor={0}
              yAccessors={[1]}
              data={[[0, 1], [1, 2], [2, 10], [3, 4], [4, 5]]}
            />

            <LineSeries
              id={getSpecId('line')}
              xScaleType={ScaleType.Linear}
              yScaleType={ScaleType.Linear}
              xAccessor={0}
              yAccessors={[1]}
              data={[[0, 1], [1, 2], [2, 10], [3, 4], [4, 5]]}
            />

            <AreaSeries
              id={getSpecId('area')}
              xScaleType={ScaleType.Linear}
              yScaleType={ScaleType.Linear}
              xAccessor={0}
              yAccessors={[1]}
              data={[[0, 1], [1, 2], [2, 10], [3, 4], [4, 5]]}
            />
          </Chart>
        </div>
      </Fragment>
    );
  }
}
