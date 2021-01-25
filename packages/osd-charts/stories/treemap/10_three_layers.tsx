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

import { boolean } from '@storybook/addon-knobs';
import React from 'react';

import { Chart, Datum, Partition, PartitionLayout, Settings } from '../../src';
import { config } from '../../src/chart_types/partition_chart/layout/config/config';
import { ShapeTreeNode } from '../../src/chart_types/partition_chart/layout/types/viewmodel_types';
import { hueInterpolator } from '../../src/chart_types/partition_chart/layout/utils/calcs';
import { mocks } from '../../src/mocks/hierarchical';
import { palettes } from '../../src/mocks/hierarchical/palettes';
import { keepDistinct } from '../../src/utils/common';
import { STORYBOOK_LIGHT_THEME } from '../shared';
import { countryLookup, productLookup, regionLookup } from '../utils/utils';

const interpolator = hueInterpolator(palettes.CET2s.map(([r, g, b]) => [r, g, b, 0.5]));

const countries = mocks.sunburst
  .map((d: any) => d.dest)
  .filter(keepDistinct)
  .sort()
  .reverse();

const countryCount = countries.length;

export const Example = () => (
  <Chart className="story-chart">
    <Settings showLegend theme={STORYBOOK_LIGHT_THEME} />
    <Partition
      id="spec_1"
      data={mocks.sunburst}
      valueAccessor={(d: Datum) => d.exportVal as number}
      valueFormatter={(d: number) => `$${config.fillLabel.valueFormatter(Math.round(d / 1000000000))}\u00A0Bn`}
      layers={[
        {
          groupByRollup: (d: Datum) => d.sitc1,
          nodeLabel: (d: any) => productLookup[d].name.toUpperCase(),
          fillLabel: {
            valueFormatter: (d: number) => `${config.fillLabel.valueFormatter(Math.round(d / 1000000000))}\u00A0Bn`,
            fontFamily: 'Helvetica',
            textColor: 'black',
            textInvertible: false,
            fontWeight: 900,
            minFontSize: 2,
            maxFontSize: 20,
            idealFontSizeJump: 1.01,
            maximizeFontSize: boolean('Maximize font size layer 1', true),
          },
          shape: { fillColor: 'rgba(0,0,0,0)' },
        },
        {
          groupByRollup: (d: Datum) => countryLookup[d.dest].continentCountry.slice(0, 2),
          nodeLabel: (d: any) => regionLookup[d].regionName,
          fillLabel: {
            valueFormatter: (d: number) => `${config.fillLabel.valueFormatter(Math.round(d / 1000000000))}\u00A0Bn`,
            textColor: 'black',
            textInvertible: false,
            fontWeight: 200,
            fontStyle: 'normal',
            fontFamily: 'Helvetica',
            valueFont: { fontWeight: 400, fontStyle: 'italic' },
            minFontSize: 2,
            maxFontSize: 10,
            idealFontSizeJump: 1.01,
            maximizeFontSize: boolean('Maximize font size layer 2', true),
          },
          shape: {
            fillColor: 'rgba(0, 0, 0, 0.07)',
          },
        },
        {
          groupByRollup: (d: Datum) => d.dest,
          nodeLabel: (d: any) => countryLookup[d].name,
          shape: {
            fillColor: (d: ShapeTreeNode) =>
              // pick color by country
              interpolator(countries.indexOf(d.dataName) / countryCount),
          },
          fillLabel: { maximizeFontSize: boolean('Maximize font size layer 3', true) },
        },
      ]}
      config={{
        partitionLayout: PartitionLayout.treemap,
        margin: { top: 0, bottom: 0, left: 0, right: 0 },
        minFontSize: 4,
        maxFontSize: 36,
        idealFontSizeJump: 1.01,
        outerSizeRatio: 1,
      }}
    />
  </Chart>
);
