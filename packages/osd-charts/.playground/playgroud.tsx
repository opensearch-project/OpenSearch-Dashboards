import React from 'react';
import { Chart, Settings, TooltipType, AreaSeries, PointerEvent } from '../src';
import { KIBANA_METRICS } from '../src/utils/data_samples/test_dataset_kibana';
export class Playground extends React.Component {
  chartRef: React.RefObject<Chart> = React.createRef();
  chartRef2: React.RefObject<Chart> = React.createRef();
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
  onPointerUpdate = (event: PointerEvent) => {
    if (this.chartRef && this.chartRef.current) {
      this.chartRef.current.dispatchExternalPointerEvent(event);
    }
    if (this.chartRef2 && this.chartRef2.current) {
      this.chartRef2.current.dispatchExternalPointerEvent(event);
    }
  };
  render() {
    return (
      <>
        <button onClick={this.onSnapshot}>Snapshot</button>
        <div className="chart">
          <Chart ref={this.chartRef}>
            <Settings
              tooltip={{ type: TooltipType.VerticalCursor }}
              showLegend
              onPointerUpdate={this.onPointerUpdate}
            />
            <AreaSeries
              id="lines"
              xAccessor={0}
              yAccessors={[1]}
              stackAccessors={[0]}
              data={KIBANA_METRICS.metrics.kibana_os_load[0].data.slice(0, 5)}
            />
          </Chart>
        </div>
        <div className="chart">
          <Chart ref={this.chartRef2}>
            <Settings
              tooltip={{ type: TooltipType.VerticalCursor }}
              showLegend
              onPointerUpdate={this.onPointerUpdate}
            />
            <AreaSeries
              id="lines"
              xAccessor={0}
              yAccessors={[1]}
              stackAccessors={[0]}
              data={KIBANA_METRICS.metrics.kibana_os_load[0].data.slice(0, 5)}
            />
          </Chart>
        </div>
      </>
    );
  }
}
