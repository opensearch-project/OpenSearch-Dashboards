import React, { Fragment } from 'react';
import { Axis, Chart, getAxisId, getSpecId, Position, ScaleType, Settings, BarSeries } from '../src';

export class Playground extends React.Component {
  render() {
    return (
      <Fragment>
        <div className="chart">
          <Chart>
            <Settings
              showLegend={true}
              theme={{
                axes: {
                  gridLineStyle: {
                    horizontal: {
                      stroke: 'red',
                      strokeWidth: 0.5,
                      opacity: 1,
                      dash: [0, 0],
                    },
                    vertical: {
                      stroke: 'blue',
                      strokeWidth: 0.5,
                      opacity: 1,
                      dash: [4, 4],
                    },
                  },
                },
              }}
            />
            <Axis
              id={getAxisId('y')}
              position={Position.Left}
              domain={{
                min: 50,
                max: 250,
              }}
              showGridLines
            />
            <Axis showGridLines id={getAxisId('x')} position={Position.Bottom} />
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
      </Fragment>
    );
  }
}
