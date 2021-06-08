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

import React from 'react';

import { Chart, Datum, Partition, PartitionLayout, Settings } from '../../packages/charts/src';
import { config } from '../../packages/charts/src/chart_types/partition_chart/layout/config';
import { arrayToLookup, hueInterpolator } from '../../packages/charts/src/common/color_calcs';
import { mocks } from '../../packages/charts/src/mocks/hierarchical';
import { productDimension } from '../../packages/charts/src/mocks/hierarchical/dimension_codes';
import { palettes } from '../../packages/charts/src/mocks/hierarchical/palettes';
import { STORYBOOK_LIGHT_THEME } from '../shared';

const productLookup = arrayToLookup((d: Datum) => d.sitc1, productDimension);

// style calcs
const interpolatorCET2s = hueInterpolator(palettes.CET2s.map(([r, g, b]) => [r, g, b, 0.7]));

const defaultFillColor = (colorMaker: any) => (d: any, i: number, a: any[]) => colorMaker(i / (a.length + 1));

export const Example = () => (
  <Chart className="story-chart">
    <Settings theme={STORYBOOK_LIGHT_THEME} />
    <Partition
      id="spec_1"
      data={mocks.pie.map((d: any, i: number) => (i ? d : { ...d, exportVal: 0 }))}
      valueAccessor={(d: Datum) => d.exportVal as number}
      valueFormatter={(d: number) => `$${config.fillLabel.valueFormatter(Math.round(d / 1000000000))}\u00A0Bn`}
      layers={[
        {
          groupByRollup: (d: Datum) => d.sitc1,
          nodeLabel: (d: Datum) => productLookup[d].name,
          fillLabel: {
            textInvertible: true,
            valueFormatter: (d: number) => `${config.fillLabel.valueFormatter(Math.round(d / 1000000000))}\u00A0Bn`,
          },
          shape: {
            fillColor: defaultFillColor(interpolatorCET2s),
          },
        },
      ]}
      config={{
        partitionLayout: PartitionLayout.treemap,
      }}
    />
  </Chart>
);
