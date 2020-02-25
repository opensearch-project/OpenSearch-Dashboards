import { Chart, Datum, Partition, PartitionLayout } from '../../src';
import { mocks } from '../../src/mocks/hierarchical/index';
import { config } from '../../src/chart_types/partition_chart/layout/config/config';
import { arrayToLookup } from '../../src/chart_types/partition_chart/layout/utils/calcs';
import { productDimension } from '../../src/mocks/hierarchical/dimension_codes';
import React from 'react';
import { ShapeTreeNode } from '../../src/chart_types/partition_chart/layout/types/viewmodel_types';
import { categoricalFillColor, colorBrewerCategoricalPastel12 } from '../utils/utils';

const productLookup = arrayToLookup((d: Datum) => d.sitc1, productDimension);

export const example = () => (
  <Chart className="story-chart">
    <Partition
      id="spec_1"
      data={mocks.pie}
      valueAccessor={(d: Datum) => d.exportVal as number}
      valueFormatter={(d: number) => `$${config.fillLabel.valueFormatter(Math.round(d / 1000000000))}\xa0Bn`}
      layers={[
        {
          groupByRollup: (d: Datum) => d.sitc1,
          nodeLabel: (d: Datum) => productLookup[d].name,
          fillLabel: {
            textInvertible: true,
            valueFormatter: (d: number) => `${config.fillLabel.valueFormatter(Math.round(d / 1000000000))}\xa0Bn`,
            valueFont: {
              fontWeight: 100,
            },
          },
          shape: {
            fillColor: (d: ShapeTreeNode) => categoricalFillColor(colorBrewerCategoricalPastel12)(d.sortIndex),
          },
        },
      ]}
      config={{
        partitionLayout: PartitionLayout.treemap,
      }}
    />
  </Chart>
);
