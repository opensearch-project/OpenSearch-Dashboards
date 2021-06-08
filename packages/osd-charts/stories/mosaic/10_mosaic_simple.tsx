/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { boolean, radios } from '@storybook/addon-knobs';
import React from 'react';

import {
  AdditiveNumber,
  ArrayEntry,
  Chart,
  Datum,
  Partition,
  PartitionLayout,
  Settings,
  ShapeTreeNode,
} from '../../packages/charts/src';
import { config } from '../../packages/charts/src/chart_types/partition_chart/layout/config';
import { mocks } from '../../packages/charts/src/mocks/hierarchical';
import { keepDistinct } from '../../packages/charts/src/utils/common';
import { countryLookup, colorBrewerCategoricalPastel12B, regionLookup } from '../utils/utils';

const productLookup: Record<string, { label: string; position: number }> = {
  '3': { label: 'Firefox', position: 1 },
  '5': { label: 'Edge (Chromium)', position: 4 },
  '6': { label: 'Safari', position: 2 },
  '7': { label: 'Chrome', position: 0 },
  '8': { label: 'Brave', position: 3 },
};

const data = mocks.sunburst
  .map((d) => (d.dest === 'chn' ? { ...d, dest: 'zaf' } : d))
  .filter(
    (d: any) =>
      ['eu', 'na', 'as', 'af'].includes(countryLookup[d.dest].continentCountry.slice(0, 2)) &&
      ['3', '5', '6', '7', '8'].includes(d.sitc1),
  );

const productPalette = colorBrewerCategoricalPastel12B.slice(2);

const productToColor = new Map(
  data
    .map((d) => d.sitc1)
    .filter(keepDistinct)
    .sort()
    .map((sitc1, i) => [sitc1, `rgba(${productPalette[i % productPalette.length].join(',')}, 0.7)`]),
);

export const Example = () => {
  const partitionLayout = radios(
    'Partition layout',
    {
      [PartitionLayout.mosaic]: PartitionLayout.mosaic,
      [PartitionLayout.treemap]: PartitionLayout.treemap,
      [PartitionLayout.sunburst]: PartitionLayout.sunburst,
    },
    PartitionLayout.mosaic,
  );
  return (
    <Chart className="story-chart">
      <Settings showLegend={boolean('Show legend', true)} showLegendExtra={boolean('Show legend values', true)} />
      <Partition
        id="spec_1"
        data={data}
        valueAccessor={(d: Datum) => d.exportVal as AdditiveNumber}
        valueFormatter={(d: number) => `${config.fillLabel.valueFormatter(Math.round(d / 1000000000))}`}
        layers={[
          {
            groupByRollup: (d: Datum) => countryLookup[d.dest].continentCountry.slice(0, 2),
            nodeLabel: (name: any) => regionLookup[name].regionName,
            fillLabel: {
              fontWeight: 400,
            },
            shape: {
              fillColor: partitionLayout === PartitionLayout.sunburst ? 'lightgrey' : 'white',
            },
          },
          {
            groupByRollup: (d: Datum) => d.sitc1,
            nodeLabel: (d: any) => String(productLookup[d]?.label),
            shape: {
              fillColor: (d: ShapeTreeNode) => productToColor.get(d.dataName)!,
            },
            sortPredicate: ([name1]: ArrayEntry, [name2]: ArrayEntry) => {
              const position1 = Number(productLookup[name1]?.position);
              const position2 = Number(productLookup[name2]?.position);
              return position2 - position1;
            },
            fillLabel: {
              fontWeight: 200,
              minFontSize: 6,
              maxFontSize: 16,
              maximizeFontSize: true,
              fontFamily: 'Helvetica Neue',
              valueFormatter: () => '',
            },
          },
        ]}
        config={{
          partitionLayout,
          linkLabel: { maxCount: 0 }, // relevant for sunburst only
          outerSizeRatio: 0.9, // relevant for sunburst only
        }}
      />
    </Chart>
  );
};
