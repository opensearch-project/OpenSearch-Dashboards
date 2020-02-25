import React from 'react';
import { Axis, BarSeries, Chart, niceTimeFormatter, Position, ScaleType, Settings } from '../../src/';

import { button } from '@storybook/addon-knobs';
import { KIBANA_METRICS } from '../../src/utils/data_samples/test_dataset_kibana';
import { SB_KNOBS_PANEL } from '../utils/storybook';

export const example = () => {
  /**
   * The handler section of this story demonstrates the PNG export functionality
   */
  const data = KIBANA_METRICS.metrics.kibana_os_load[0].data.slice(0, 100);
  const label = 'Export PNG';
  const chartRef: React.RefObject<Chart> = React.createRef();
  const handler = () => {
    if (!chartRef.current) {
      return;
    }
    const snapshot = chartRef.current.getPNGSnapshot({
      // you can set the background and pixel ratio for the PNG export
      backgroundColor: 'white',
      pixelRatio: 2,
    });
    if (!snapshot) {
      return;
    }
    // will save as chart.png
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
  const groupId = '';
  button(label, handler, groupId);
  return (
    <Chart className="story-chart" ref={chartRef}>
      <Settings showLegend showLegendExtra />
      <Axis
        id="time"
        position={Position.Bottom}
        tickFormat={niceTimeFormatter([data[0][0], data[data.length - 1][0]])}
      />
      <Axis id="count" position={Position.Left} />

      <BarSeries
        id="series bars chart"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        data={data}
        yScaleToDataExtent={true}
      />
    </Chart>
  );
};

// storybook configuration
example.story = {
  parameters: {
    options: { selectedPanel: SB_KNOBS_PANEL },
    info: {
      text: `Generate a PNG of the chart by clicking on the Export PNG button in the knobs section. In this example, the button handler is setting the PNG background to white with a pixel ratio of 2. If the browser is detected to be IE11, msSaveBlob will be used instead of a PNG capture.`,
    },
  },
};
