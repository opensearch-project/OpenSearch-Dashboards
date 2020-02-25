import { DateTime } from 'luxon';
import React from 'react';

import { Axis, BarSeries, Chart, Position, ScaleType, timeFormatter } from '../../src';
import { KIBANA_METRICS } from '../../src/utils/data_samples/test_dataset_kibana';
import { SB_SOURCE_PANEL } from '../utils/storybook';

const dateFormatter = timeFormatter('HH:mm:ss');

// for testing purposes only
export const example = () => {
  const start = DateTime.fromISO('2019-01-01T00:00:00.000', { zone: 'utc' });
  const data = [
    [start.toMillis(), 1, 4],
    [start.plus({ minute: 1 }).toMillis(), 2, 5],
    [start.plus({ minute: 2 }).toMillis(), 3, 6],
    [start.plus({ minute: 3 }).toMillis(), 4, 7],
    [start.plus({ minute: 4 }).toMillis(), 5, 8],
    [start.plus({ minute: 5 }).toMillis(), 4, 7],
    [start.plus({ minute: 6 }).toMillis(), 3, 6],
    [start.plus({ minute: 7 }).toMillis(), 2, 5],
    [start.plus({ minute: 8 }).toMillis(), 1, 4],
  ];
  return (
    <Chart className="story-chart">
      <Axis id="bottom" title="index" position={Position.Bottom} tickFormat={dateFormatter} />
      <Axis
        id="left"
        title={KIBANA_METRICS.metrics.kibana_os_load[0].metric.title}
        position={Position.Left}
        tickFormat={(d: any) => Number(d).toFixed(2)}
      />
      <BarSeries
        id="data"
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1, 2]}
        data={data}
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
