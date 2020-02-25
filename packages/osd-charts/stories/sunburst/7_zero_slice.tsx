import { Chart, Datum, Partition, PartitionLayout } from '../../src';
import { mocks } from '../../src/mocks/hierarchical/index';
import { config } from '../../src/chart_types/partition_chart/layout/config/config';
import React from 'react';
import { indexInterpolatedFillColor, interpolatorCET2s, productLookup } from '../utils/utils';

export const example = () => (
  <Chart className="story-chart">
    <Partition
      id="spec_1"
      data={mocks.pie
        .slice(0, 2)
        .concat(mocks.pie.slice(2, 4).map((s) => ({ ...s, exportVal: 0 })))
        .concat(mocks.pie.slice(4))}
      valueAccessor={(d: Datum) => d.exportVal as number}
      valueFormatter={(d: number) => `$${config.fillLabel.valueFormatter(Math.round(d / 1000000000))}\xa0Bn`}
      layers={[
        {
          groupByRollup: (d: Datum) => d.sitc1,
          nodeLabel: (d: Datum) => productLookup[d].name,
          fillLabel: { textInvertible: true },
          shape: {
            fillColor: indexInterpolatedFillColor(interpolatorCET2s),
          },
        },
      ]}
      config={{ partitionLayout: PartitionLayout.sunburst }}
    />
  </Chart>
);
