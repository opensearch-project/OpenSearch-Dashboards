import React from 'react';
import { Chart, LineSeries, ScaleType, Settings, Position, Axis, BarSeries, HistogramBarSeries } from '../src';
export class Playground extends React.Component<{}, { isSunburstShown: boolean }> {
  chartRef: React.RefObject<Chart> = React.createRef();
  state = {
    isSunburstShown: true,
  };
  onBrushEnd = (min: number, max: number) => {
    // eslint-disable-next-line no-console
    console.log({ min, max });
  };

  render() {
    return (
      <>
        <div className="chart">
          <Chart ref={this.chartRef}>
            <Settings rotation={90} onBrushEnd={this.onBrushEnd} />
            <Axis id="y" position={Position.Left} title={'y'} />
            <Axis id="x" position={Position.Bottom} title={'x'} />
            <LineSeries
              id={'aaa'}
              xScaleType={ScaleType.Linear}
              xAccessor={0}
              yAccessors={[1]}
              data={[
                [0, 1],
                [1, 2],
                [2, 5],
                [3, 5],
                [4, 2],
                [5, 6],
              ]}
            />
          </Chart>
        </div>
        <div className="chart">
          <Chart ref={this.chartRef}>
            <Settings rotation={0} onBrushEnd={this.onBrushEnd} theme={{ chartMargins: { left: 30 } }} />
            <Axis id="x" position={Position.Bottom} title={'x'} />
            <Axis id="y" position={Position.Left} title={'y'} />
            <LineSeries
              id={'aaa'}
              xScaleType={ScaleType.Linear}
              xAccessor={0}
              yAccessors={[1]}
              data={[
                [0, 1],
                [1, 2],
                [2, 5],
                [3, 5],
                [4, 2],
                [5, 6],
              ]}
            />
          </Chart>
        </div>
        <div className="chart">
          <Chart ref={this.chartRef}>
            <Settings rotation={90} onBrushEnd={this.onBrushEnd} theme={{ chartMargins: { left: 30 } }} />
            <Axis id="x" position={Position.Bottom} title={'x'} />
            <Axis id="y" position={Position.Left} title={'y'} />
            <BarSeries
              id={'aaa'}
              xScaleType={ScaleType.Linear}
              xAccessor={0}
              yAccessors={[1]}
              data={[
                [0, 1],
                [1, 2],
                [2, 5],
                [3, 5],
                // [4, 2],
                [5, 6],
              ]}
            />
            <LineSeries
              id={'aaa1'}
              xScaleType={ScaleType.Linear}
              xAccessor={0}
              yAccessors={[1]}
              data={[
                [0, 1],
                [1, 2],
                [2, 5],
                [3, 5],
                // [4, 2],
                [5, 6],
              ]}
            />
          </Chart>
        </div>
        <div className="chart">
          <Chart ref={this.chartRef}>
            <Settings rotation={90} onBrushEnd={this.onBrushEnd} theme={{ chartMargins: { left: 30 } }} />
            <Axis id="x" position={Position.Bottom} title={'x'} />
            <Axis id="y" position={Position.Left} title={'y'} />
            <HistogramBarSeries
              id={'aaa'}
              xScaleType={ScaleType.Linear}
              xAccessor={0}
              yAccessors={[1]}
              data={[
                [0, 1],
                [1, 2],
                [2, 5],
                [3, 5],
                [4, 2],
                [5, 6],
              ]}
            />
          </Chart>
        </div>
      </>
    );
  }
}
