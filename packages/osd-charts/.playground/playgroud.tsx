import React, { Fragment } from 'react';
import { Axis, Settings, Chart, getAxisId, getSpecId, Position, ScaleType, AreaSeries, CurveType } from '../src';

export class Playground extends React.Component {
  render() {
    const data = [
      { x: 7.053400039672852, y: 1.019049570549345 },
      { x: 16.8664653595564, y: 1.5285743558240172 },
      { x: 26.67953067943995, y: 0.5095247852746725 },
      { x: 36.4925959993235, y: 0.12998767296647204 },
      { x: 74.95778185805996, y: 0.3718786139686189 },
      { x: 88.40302934524654, y: 0.14487824285108267 },
      { x: 122.9147676270215, y: 0.07890686802154025 },
      { x: 186.28060795710638, y: 0.4344198127360625 },
      { x: 197.79021192408248, y: 0.47910304703632484 },
      { x: 208.22638015747071, y: 0.15180409193531094 },
      { x: 241.16356871580467, y: 0.0778711327650822 },
      { x: 305.3722147500643, y: 0.05038552439310782 },
      { x: 404.60706563679923, y: 0.04950569918337908 },
      { x: 505.60553818596964, y: 0.010256529428346779 },
      { x: 993.0998738606771, y: 0.06490505477669992 },
      { x: 1070.1354763603908, y: 0 },
    ];
    return (
      <Fragment>
        <div className="chart">
          <Chart>
            <Settings />
            <Axis id={getAxisId('bottom')} position={Position.Bottom} tickFormat={(d) => d.toFixed(0)} ticks={5} />
            <Axis id={getAxisId('left')} position={Position.Left} tickFormat={(d) => d.toFixed(1)} hide={true} />
            <AreaSeries
              id={getSpecId('aaa')}
              name={'aaa'}
              xScaleType={ScaleType.Linear}
              yScaleType={ScaleType.Linear}
              xAccessor="x"
              yAccessors={['y']}
              data={data}
              curve={CurveType.CURVE_STEP_AFTER}
            />
          </Chart>
        </div>
      </Fragment>
    );
  }
}
