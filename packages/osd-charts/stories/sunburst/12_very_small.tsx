import { Chart, Datum, Partition, PartitionLayout } from '../../src';
import { config } from '../../src/chart_types/partition_chart/layout/config/config';
import React from 'react';
import { indexInterpolatedFillColor, interpolatorCET2s } from '../utils/utils';

export const example = () => (
  <Chart className="story-chart">
    <Partition
      id="spec_1"
      data={[
        { sitc1: 'Machinery and transport equipment', exportVal: 9 },
        { sitc1: 'Mineral fuels, lubricants and related materials', exportVal: 1 },
      ]}
      valueAccessor={(d: Datum) => d.exportVal as number}
      valueFormatter={(d: number) => `$${config.fillLabel.valueFormatter(Math.round(d))}`}
      layers={[
        {
          groupByRollup: (d: Datum) => d.sitc1,
          nodeLabel: (d: Datum) => d,
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
