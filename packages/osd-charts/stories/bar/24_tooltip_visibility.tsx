import React from 'react';

import { Axis, BarSeries, Chart, Position, ScaleType, Settings } from '../../src';
import * as TestDatasets from '../../src/utils/data_samples/test_dataset';
import { FilterPredicate } from '../../src/chart_types/xy_chart/utils/specs';
import { SB_SOURCE_PANEL } from '../utils/storybook';

export const example = () => {
  const isVisibleFunction: FilterPredicate = (series) => {
    return series.splitAccessors.get('g1') === 'cloudflare.com';
  };
  return (
    <Chart className="story-chart">
      <Settings showLegend showLegendExtra legendPosition={Position.Right} />
      <Axis id="bottom" position={Position.Bottom} title="Bottom axis" showOverlappingTicks={true} />
      <Axis id="left2" title="Left axis" position={Position.Left} tickFormat={(d: any) => Number(d).toFixed(2)} />

      <BarSeries
        id="bars1"
        xScaleType={ScaleType.Ordinal}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y1', 'y2']}
        splitSeriesAccessors={['g1', 'g2', 'g3']}
        data={TestDatasets.BARCHART_2Y2G}
        filterSeriesInTooltip={isVisibleFunction}
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
