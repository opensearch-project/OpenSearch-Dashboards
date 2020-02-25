import React from 'react';
import { Axis, BarSeries, Chart, Position, ScaleType, Settings } from '../../src/';
import * as TestDatasets from '../../src/utils/data_samples/test_dataset';
import { SB_SOURCE_PANEL } from '../utils/storybook';

export const example = () => {
  const yAccessors = ['y1', 'y2'];
  const splitSeriesAccessors = ['g1', 'g2'];

  return (
    <Chart className="story-chart">
      <Settings showLegend showLegendExtra legendPosition={Position.Right} />
      <Axis id="bottom" position={Position.Bottom} title="Bottom axis" showOverlappingTicks={true} />
      <Axis id="left2" title="Left axis" position={Position.Left} tickFormat={(d) => Number(d).toFixed(2)} />

      <BarSeries
        id="bars"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={yAccessors}
        splitSeriesAccessors={splitSeriesAccessors}
        data={TestDatasets.BARCHART_2Y2G}
        hideInLegend={false}
      />
    </Chart>
  );
};

// storybook configuration
example.story = {
  parameters: {
    options: { selectedPanel: SB_SOURCE_PANEL },
  },
};
