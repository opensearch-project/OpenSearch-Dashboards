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

import {
  AdditiveNumber,
  ArrayEntry,
  Chart,
  Datum,
  MODEL_KEY,
  Partition,
  PartitionLayout,
  ShapeTreeNode,
} from '../../src';
import { config } from '../../src/chart_types/partition_chart/layout/config';
import { countryLookup } from '../utils/utils';

const categoricalColors = ['rgb(110,110,110)', 'rgb(123,123,123)', 'darkgrey', 'lightgrey'];

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
            nodeLabel: (d) => String(d).toUpperCase(),
            fillLabel: {
              valueFormatter: () => ``,
              fontWeight: 600,
            },
            shape: {
              fillColor: () => 'white',
            },
          },
          {
            groupByRollup: (d: Datum) => d.dest,
            nodeLabel: (d: any) => countryLookup[d]?.name ?? d,
            sortPredicate: ([name1, node1]: ArrayEntry, [name2, node2]: ArrayEntry) => {
              if (name1 === 'Other' && name2 !== 'Other') return -1;
              if (name2 === 'Other' && name1 !== 'Other') return 1;

              // otherwise, use the increasing value order
              return node1.value - node2.value;
            },
            fillLabel: {
              fontWeight: 100,
              maxFontSize: 16,
              valueFont: {
                fontFamily: 'Menlo',
                fontStyle: 'normal',
                fontWeight: 100,
              },
            },
            shape: {
              fillColor: (d: ShapeTreeNode) => categoricalColors.slice(0)[d[MODEL_KEY].sortIndex],
            },
          },
        ]}
        config={{
          partitionLayout: PartitionLayout.mosaic,
        }}
      />
    </Chart>
  );
};
