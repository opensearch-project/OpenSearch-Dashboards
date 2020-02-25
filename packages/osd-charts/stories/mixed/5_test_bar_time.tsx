import { DateTime } from 'luxon';
import React from 'react';

import { Axis, BarSeries, Chart, LineSeries, Position, ScaleType, Settings } from '../../src/';
import { timeFormatter } from '../../src/utils/data/formatters';

export const example = () => {
  const start = DateTime.fromISO('2019-01-01T00:00:00.000', { zone: 'utc' });
  const data1 = [
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
  const data2 = [
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
  const dateFormatter = timeFormatter('HH:mm:ss');

  return (
    <Chart className="story-chart">
      <Settings showLegend showLegendExtra legendPosition={Position.Right} />
      <Axis
        id="bottom"
        position={Position.Bottom}
        title="Bottom axis"
        showOverlappingTicks={true}
        tickFormat={dateFormatter}
      />
      <Axis id="left2" title="Left axis" position={Position.Left} tickFormat={(d) => Number(d).toFixed(2)} />

      <BarSeries
        id="data1"
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        data={data1}
      />
      <LineSeries
        id="data2"
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[2]}
        data={data2}
      />
    </Chart>
  );
};
