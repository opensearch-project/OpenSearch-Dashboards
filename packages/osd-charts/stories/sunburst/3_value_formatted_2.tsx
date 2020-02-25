import { Chart, Datum, Partition } from '../../src';
import { mocks } from '../../src/mocks/hierarchical/index';
import { config } from '../../src/chart_types/partition_chart/layout/config/config';
import React from 'react';
import { ShapeTreeNode } from '../../src/chart_types/partition_chart/layout/types/viewmodel_types';
import { categoricalFillColor, colorBrewerCategoricalPastel12, productLookup } from '../utils/utils';

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
            fontWeight: 100,
            fontStyle: 'italic',
            valueFont: {
              fontFamily: 'Menlo',
              fontStyle: 'normal',
              fontWeight: 900,
            },
          },
          shape: {
            fillColor: (d: ShapeTreeNode) => categoricalFillColor(colorBrewerCategoricalPastel12)(d.sortIndex),
          },
        },
      ]}
      config={{ outerSizeRatio: 0.9 }}
    />
  </Chart>
);
