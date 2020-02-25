import { Chart, Datum, Partition, PartitionLayout } from '../../src';
import { config } from '../../src/chart_types/partition_chart/layout/config/config';
import React from 'react';
import { indexInterpolatedFillColor, interpolatorCET2s, productLookup } from '../utils/utils';

export const example = () => (
  <Chart className="story-chart">
    <Partition
      id="spec_1"
      data={[
        { sitc1: '7', exportVal: 999999 },
        { sitc1: '3', exportVal: 1 },
      ]}
      valueAccessor={(d: Datum) => d.exportVal as number}
      valueFormatter={(d: number) => `$${config.fillLabel.valueFormatter(Math.round(d))}`}
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
