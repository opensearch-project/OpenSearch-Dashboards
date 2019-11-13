import React from 'react';
import { Axis, Chart, getAxisId, getSpecId, Position, ScaleType, Settings, LineSeries } from '../src';
import { Fit } from '../src/chart_types/xy_chart/utils/specs';

const data = [
  { x: 0, y: null },
  { x: 1, y: 3 },
  { x: 2, y: 5 },
  { x: 3, y: null },
  { x: 4, y: 4 },
  { x: 5, y: null },
  { x: 6, y: 5 },
  { x: 7, y: 6 },
  { x: 8, y: null },
  { x: 9, y: null },
  { x: 10, y: null },
  { x: 11, y: 12 },
  { x: 12, y: null },
];

export class Playground extends React.Component {
  render() {
    return (
      <>
        <div className="chart">
          <Chart className="story-chart">
            <Settings
              showLegend
              theme={{
                areaSeriesStyle: {
                  point: {
                    visible: true,
                  },
                },
              }}
            />
            <Axis
              id={getAxisId('bottom')}
              position={Position.Bottom}
              title={'Bottom axis'}
              showOverlappingTicks={true}
            />
            <Axis id={getAxisId('left')} title={'Left axis'} position={Position.Left} />
            <LineSeries
              id={getSpecId('test')}
              xScaleType={ScaleType.Linear}
              yScaleType={ScaleType.Linear}
              xAccessor={'x'}
              yAccessors={['y']}
              // curve={2}
              // splitSeriesAccessors={['g']}
              // stackAccessors={['x']}
              fit={Fit.Linear}
              data={data}
              // fit={{
              //   type: Fit.Average,
              //   endValue: 0,
              // }}
              // data={data}
            />
          </Chart>
        </div>
      </>
    );
  }
}
