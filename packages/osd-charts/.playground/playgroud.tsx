import React from 'react';
import {
  Axis,
  Chart,
  getAxisId,
  getSpecId,
  Position,
  ScaleType,
  Settings,
  LIGHT_THEME,
  niceTimeFormatter,
  LineAnnotation,
  AnnotationDomainTypes,
  BarSeries,
  RectAnnotation,
  TooltipType,
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
    const data = KIBANA_METRICS.metrics.kibana_os_load[0].data.slice(0, 7);

    return (
      <>
        <button onClick={this.onSnapshot}>Snapshot</button>
        <div className="chart">
          <Chart ref={this.chartRef}>
            <Settings theme={LIGHT_THEME} showLegend={true} tooltip={TooltipType.Crosshairs} />
            <Axis
              id={getAxisId('time')}
              position={Position.Bottom}
              tickFormat={niceTimeFormatter([data[0][0], data[data.length - 1][0]])}
            />
            <Axis id={getAxisId('count')} position={Position.Left} />
            <LineAnnotation
              id="line annotation"
              dataValues={[
                {
                  dataValue: data[5][0],
                  details: 'hello tooltip',
                },
              ]}
              domainType={AnnotationDomainTypes.XDomain}
              marker={<div style={{ width: 10, height: 10, background: 'red' }} />}
            />
            <RectAnnotation
              id="rect annotation"
              dataValues={[
                {
                  coordinates: {
                    x1: data[3][0],
                  },
                  details: 'hello',
                },
              ]}
            />
            <BarSeries
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
