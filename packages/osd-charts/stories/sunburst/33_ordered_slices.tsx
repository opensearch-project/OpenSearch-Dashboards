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

import {
  AdditiveNumber,
  ArrayEntry,
  Chart,
  Datum,
  MODEL_KEY,
  Partition,
  ShapeTreeNode,
} from '../../packages/charts/src';
import { config } from '../../packages/charts/src/chart_types/partition_chart/layout/config';
import { discreteColor, countryLookup, colorBrewerCategoricalPastel12B } from '../utils/utils';

const categoricalColors = colorBrewerCategoricalPastel12B.slice(3);

const data = [
  { region: 'Americas', dest: 'usa', other: false, exportVal: 553359100104 },
  { region: 'Americas', dest: 'Other', other: true, exportVal: 753359100104 },
  { region: 'Asia', dest: 'chn', other: false, exportVal: 392617281424 },
  { region: 'Asia', dest: 'jpn', other: false, exportVal: 177490158520 },
  { region: 'Asia', dest: 'kor', other: false, exportVal: 177421375512 },
  { region: 'Asia', dest: 'Other', other: true, exportVal: 277421375512 },
  { region: 'Europe', dest: 'deu', other: false, exportVal: 253250650864 },
  { region: 'Europe', dest: 'smr', other: false, exportVal: 135443006088 },
  { region: 'Europe', dest: 'Other', other: true, exportVal: 205443006088 },
  { region: 'Africa', dest: 'Other', other: true, exportVal: 305443006088 },
];

const sortPredicate = ([name1, node1]: ArrayEntry, [name2, node2]: ArrayEntry) => {
  // unconditionally put "Other" to the end (as the "Other" slice may be larger than a regular slice, yet should be at the end)
  if (name1 === 'Other' && name2 !== 'Other') return 1;
  if (name2 === 'Other' && name1 !== 'Other') return -1;

  // otherwise, use the decreasing value order
  return node2.value - node1.value;
};

/* Equivalent, since math ops cleanly coerce false, true to 0, 1
const sortPredicate = ([name1, node1]: ArrayEntry, [name2, node2]: ArrayEntry) =>
  (name1 === 'Other') - (name2 === 'Other') || node2.value - node1.value;
*/

export const Example = () => {
  return (
    <Chart className="story-chart">
      <Partition
        id="spec_1"
        data={data}
        valueAccessor={(d: Datum) => d.exportVal as AdditiveNumber}
        valueFormatter={(d: number) => `${config.fillLabel.valueFormatter(Math.round(d / 1000000000))}`}
        layers={[
          {
            groupByRollup: (d: Datum) => d.region,
            nodeLabel: (d: any) => d,
            fillLabel: {
              valueFormatter: (d: number) => `${config.fillLabel.valueFormatter(Math.round(d / 1000000000))}`,
              textInvertible: true,
              fontWeight: 600,
              fontStyle: 'italic',
              valueFont: {
                fontFamily: 'Menlo',
                fontStyle: 'normal',
                fontWeight: 100,
              },
            },
            shape: {
              fillColor: (d: ShapeTreeNode) => discreteColor(categoricalColors)(d.sortIndex),
            },
          },
          {
            groupByRollup: (d: Datum) => d.dest,
            nodeLabel: (d: any) => countryLookup[d]?.name ?? d,
            sortPredicate: boolean('Move "Other" to end', true) ? sortPredicate : null,
            fillLabel: {
              textInvertible: true,
              fontWeight: 600,
              fontStyle: 'italic',
              maxFontSize: 16,
              valueFont: {
                fontFamily: 'Menlo',
                fontStyle: 'normal',
                fontWeight: 100,
              },
            },
            shape: {
              fillColor: (d: ShapeTreeNode) => discreteColor(categoricalColors, 0.5)(d[MODEL_KEY].sortIndex),
            },
          },
        ]}
        config={{ outerSizeRatio: 0.96, specialFirstInnermostSector: false, clockwiseSectors: true }}
      />
    </Chart>
  );
};
