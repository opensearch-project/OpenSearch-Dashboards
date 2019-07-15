import React from 'react';

import {
  Axis,
  Chart,
  getAxisId,
  getSpecId,
  LineSeries,
  niceTimeFormatter,
  Position,
  ScaleType,
  Settings,
  mergeWithDefaultTheme,
} from '../src';
import { KIBANA_METRICS } from '../src/lib/series/utils/test_dataset_kibana';

export class Playground extends React.Component {
  render() {
    return <>{this.renderChart(Position.Right)}</>;
  }
  renderChart(legendPosition: Position) {
    const theme = mergeWithDefaultTheme({
      lineSeriesStyle: {
        // area: {
        //   fill: 'green',
        //   opacity:0.2
        // },
        line: {
          stroke: 'violet',
          strokeWidth: 4,
        },
        point: {
          fill: 'yellow',
          stroke: 'black',
          strokeWidth: 2,
          radius: 6,
        },
      },
    });
    console.log(theme.areaSeriesStyle);
    return (
      <div className="chart">
        <Chart>
          <Settings debug={false} showLegend={true} legendPosition={legendPosition} rotation={0} theme={theme} />
          <Axis
            id={getAxisId('timestamp')}
            title="timestamp"
            position={Position.Bottom}
            tickFormat={niceTimeFormatter([1555819200000, 1555905600000])}
          />
          <Axis id={getAxisId('count')} title="count" position={Position.Left} tickFormat={(d) => d.toFixed(2)} />
          <LineSeries
            id={getSpecId('dataset A with long title')}
            xScaleType={ScaleType.Time}
            yScaleType={ScaleType.Linear}
            data={KIBANA_METRICS.metrics.kibana_os_load[0].data.slice(0, 15)}
            xAccessor={0}
            lineSeriesStyle={{
              line: {
                stroke: 'red',
                opacity: 1,
              },
            }}
            yAccessors={[1]}
          />
          <LineSeries
            id={getSpecId('dataset B')}
            xScaleType={ScaleType.Time}
            yScaleType={ScaleType.Linear}
            data={KIBANA_METRICS.metrics.kibana_os_load[1].data.slice(0, 15)}
            xAccessor={0}
            yAccessors={[1]}
            stackAccessors={[0]}
          />
        </Chart>
      </div>
    );
  }
}
