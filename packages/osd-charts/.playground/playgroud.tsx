import React from 'react';

import {
  Axis,
  Chart,
  getAxisId,
  getSpecId,
  niceTimeFormatter,
  Position,
  ScaleType,
  Settings,
  mergeWithDefaultTheme,
  AreaSeries,
} from '../src';
import { KIBANA_METRICS } from '../src/utils/data_samples/test_dataset_kibana';

export class Playground extends React.Component {
  render() {
    return <>{this.renderChart(Position.Right)}</>;
  }
  renderChart(legendPosition: Position) {
    const theme = mergeWithDefaultTheme({
      lineSeriesStyle: {
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

          <AreaSeries
            id={getSpecId('dataset B')}
            xScaleType={ScaleType.Time}
            yScaleType={ScaleType.Linear}
            data={KIBANA_METRICS.metrics.kibana_os_load[1].data.slice(0, 15)}
            xAccessor={0}
            yAccessors={[1]}
            stackAccessors={[0]}
            areaSeriesStyle={{
              line: {
                // opacity:1,
                strokeWidth: 10,
              },
              point: {
                visible: true,
                strokeWidth: 3,
                radius: 10,
              },
            }}
          />
          <AreaSeries
            id={getSpecId('dataset C')}
            xScaleType={ScaleType.Time}
            yScaleType={ScaleType.Linear}
            data={KIBANA_METRICS.metrics.kibana_os_load[1].data.slice(0, 15)}
            xAccessor={0}
            yAccessors={[1]}
            stackAccessors={[0]}
            areaSeriesStyle={{
              line: {
                // opacity:1,
                strokeWidth: 10,
              },
              point: {
                visible: true,
                strokeWidth: 3,
                radius: 10,
              },
            }}
          />
          <AreaSeries
            id={getSpecId('dataset A with long title')}
            xScaleType={ScaleType.Time}
            yScaleType={ScaleType.Linear}
            data={KIBANA_METRICS.metrics.kibana_os_load[0].data.slice(0, 15)}
            xAccessor={0}
            areaSeriesStyle={{
              point: {
                visible: true,
                strokeWidth: 3,
                radius: 10,
              },
              line: {
                strokeWidth: 10,
              },
            }}
            yAccessors={[1]}
          />
        </Chart>
      </div>
    );
  }
}
