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
          <Chart>
            <Settings
              showLegend={true}
              xDomain={{
                min: 0.5,
                max: 4.5,
              }}
            />
            <Axis
              id={getAxisId('y')}
              position={Position.Left}
              domain={{
                min: 50,
                max: 250,
              }}
            />
            <Axis id={getAxisId('x')} position={Position.Bottom} />
            <BarSeries
              id={getSpecId('bar')}
              yScaleType={ScaleType.Linear}
              xScaleType={ScaleType.Linear}
              xAccessor={0}
              yAccessors={[1]}
              data={[[0, 100], [1, 50], [3, 400], [4, 250], [5, 235]]}
            />
          </Chart>
        </div>
        <div className="chart">
          <Chart>
            <Settings
              showLegend={true}
              xDomain={{
                min: 0.5,
                max: 4.5,
              }}
            />
            <Axis
              id={getAxisId('y')}
              position={Position.Left}
              domain={{
                min: 50,
                max: 450,
              }}
            />
            <Axis id={getAxisId('x')} position={Position.Bottom} />
            <LineSeries
              id={getSpecId('line')}
              yScaleType={ScaleType.Linear}
              xScaleType={ScaleType.Linear}
              xAccessor={0}
              yAccessors={[1]}
              stackAccessors={[0]}
              data={[[0.25, 100], [1, 50], [3, 400], [4, 250], [5, 235]]}
            />
            <LineSeries
              id={getSpecId('line2')}
              yScaleType={ScaleType.Linear}
              xScaleType={ScaleType.Linear}
              xAccessor={0}
              yAccessors={[1]}
              stackAccessors={[0]}
              data={[[0.25, 100], [0.5, 100], [1, 50], [3, 400], [4, 250], [4.5, 220], [5, 235]]}
            />
          </Chart>
        </div>
        <div className="chart">
          <Chart>
            <Settings
              showLegend={true}
              xDomain={{
                min: 0.5,
                max: 4.5,
              }}
            />
            <Axis
              id={getAxisId('y')}
              position={Position.Left}
              domain={{
                min: 50,
                max: 250,
              }}
            />
            <Axis id={getAxisId('x')} position={Position.Bottom} />
            <AreaSeries
              id={getSpecId('line')}
              yScaleType={ScaleType.Linear}
              xScaleType={ScaleType.Linear}
              xAccessor={0}
              yAccessors={[1]}
              data={[[0, 100], [1, 50], [3, 400], [4, 250], [5, 235]]}
            />
          </Chart>
        </div>
      </Fragment>
    );
  }
}
