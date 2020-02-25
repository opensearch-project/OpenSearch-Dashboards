import { boolean } from '@storybook/addon-knobs';
import React from 'react';

import {
  Axis,
  Chart,
  HistogramBarSeries,
  niceTimeFormatByDay,
  Position,
  ScaleType,
  Settings,
  timeFormatter,
} from '../../src';
import { TEST_DATASET_DISCOVER } from '../../src/utils/data_samples/test_dataset_discover_per_30s';
import { SB_SOURCE_PANEL } from '../utils/storybook';

// for testing purposes only
export const example = () => {
  const data = TEST_DATASET_DISCOVER.series[0].values;

  const formatter = timeFormatter(niceTimeFormatByDay(1));

  const xDomain = {
    minInterval: 30000,
  };

  const useCustomMinInterval = boolean('use custom minInterval of 30s', true);
  return (
    <Chart className="story-chart">
      <Settings xDomain={useCustomMinInterval ? xDomain : undefined} />
      <Axis id="discover-histogram-left-axis" position={Position.Left} title={TEST_DATASET_DISCOVER.yAxisLabel} />
      <Axis
        id="discover-histogram-bottom-axis"
        position={Position.Bottom}
        title={TEST_DATASET_DISCOVER.xAxisLabel}
        tickFormat={formatter}
      />

      <HistogramBarSeries
        id="discover-histogram"
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={data}
        timeZone="local"
        name="Count"
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
