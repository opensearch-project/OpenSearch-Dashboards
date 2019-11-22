import React from 'react';
import {
  Axis,
  Chart,
  getAxisId,
  getSpecId,
  Position,
  ScaleType,
  HistogramBarSeries,
  Settings,
  LIGHT_THEME,
  niceTimeFormatter,
} from '../src';
import { KIBANA_METRICS } from '../src/utils/data_samples/test_dataset_kibana';
export class Playground extends React.Component {
  chartRef: React.RefObject<Chart> = React.createRef();
  onSnapshot = () => {
    if (!this.chartRef.current) {
      return;
    }
    const snapshot = this.chartRef.current.getPNGSnapshot({
      backgroundColor: 'white',
      pixelRatio: 1,
    });
    if (!snapshot) {
      return;
    }
    const fileName = 'chart.png';
    switch (snapshot.browser) {
      case 'IE11':
        return navigator.msSaveBlob(snapshot.blobOrDataUrl, fileName);
      default:
        const link = document.createElement('a');
        link.download = fileName;
        link.href = snapshot.blobOrDataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };
  render() {
    const data = KIBANA_METRICS.metrics.kibana_os_load[0].data.slice(0, 100);

    return (
      <>
        <button onClick={this.onSnapshot}>Snapshot</button>
        <div className="chart">
          <Chart ref={this.chartRef}>
            <Settings theme={LIGHT_THEME} showLegend={true} />
            <Axis
              id={getAxisId('time')}
              position={Position.Bottom}
              tickFormat={niceTimeFormatter([data[0][0], data[data.length - 1][0]])}
            />
            <Axis id={getAxisId('count')} position={Position.Left} />

            <HistogramBarSeries
              id={getSpecId('series bars chart')}
              xScaleType={ScaleType.Linear}
              yScaleType={ScaleType.Linear}
              xAccessor={0}
              yAccessors={[1]}
              data={data}
              yScaleToDataExtent={true}
            />
          </Chart>
        </div>
      </>
    );
  }
}
