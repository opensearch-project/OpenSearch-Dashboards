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
 * under the License. */

import { action } from '@storybook/addon-actions';
import React from 'react';
import { Chart, Position, Settings, Partition, PartitionLayout } from '../../src';
import {
  indexInterpolatedFillColor,
  interpolatorCET2s,
  categoricalFillColor,
  colorBrewerCategoricalPastel12,
} from '../utils/utils';
import { select } from '@storybook/addon-knobs';

const onElementListeners = {
  onElementClick: action('onElementClick'),
  onElementOver: action('onElementOver'),
  onElementOut: action('onElementOut'),
};
type PieDatum = [string, number, string, number];
const pieData: Array<PieDatum> = [
  ['CN', 301, 'IN', 44],
  ['CN', 301, 'US', 24],
  ['CN', 301, 'ID', 13],
  ['CN', 301, 'BR', 8],
  ['IN', 245, 'US', 22],
  ['IN', 245, 'BR', 11],
  ['IN', 245, 'ID', 10],
  ['US', 130, 'CN', 33],
  ['US', 130, 'IN', 23],
  ['US', 130, 'US', 9],
  ['US', 130, 'ID', 7],
  ['US', 130, 'BR', 5],
  ['ID', 55, 'BR', 4],
  ['ID', 55, 'US', 3],
  ['PK', 43, 'FR', 2],
  ['PK', 43, 'PK', 2],
];

export const example = () => {
  const partitionLayout = select(
    'layout',
    { sunburst: PartitionLayout.sunburst, treemap: PartitionLayout.treemap },
    'sunburst',
  );
  return (
    <Chart className="story-chart">
      <Settings showLegend showLegendExtra legendPosition={Position.Right} {...onElementListeners} />
      <Partition
        id="pie"
        data={pieData}
        config={{
          partitionLayout,
        }}
        valueAccessor={(d) => {
          return d[3];
        }}
        layers={[
          {
            groupByRollup: (d: PieDatum) => {
              return d[0];
            },
            nodeLabel: (d) => {
              return `dest: ${d}`;
            },
            shape: {
              fillColor: (d) => {
                if (partitionLayout === 'sunburst') {
                  // pick color from color palette based on mean angle - rather distinct colors in the inner ring
                  return indexInterpolatedFillColor(interpolatorCET2s)(d, (d.x0 + d.x1) / 2 / (2 * Math.PI), []);
                } else {
                  return categoricalFillColor(colorBrewerCategoricalPastel12)(d.sortIndex);
                }
              },
            },
          },
          {
            groupByRollup: (d: PieDatum) => {
              return d[2];
            },
            nodeLabel: (d) => {
              return `source: ${d}`;
            },
            shape: {
              fillColor: (d) => {
                if (partitionLayout === 'sunburst') {
                  // pick color from color palette based on mean angle - rather distinct colors in the inner ring
                  return indexInterpolatedFillColor(interpolatorCET2s)(d, (d.x0 + d.x1) / 2 / (2 * Math.PI), []);
                } else {
                  return categoricalFillColor(colorBrewerCategoricalPastel12)(d.sortIndex);
                }
              },
            },
          },
        ]}
      />
    </Chart>
  );
};

example.story = {
  parameters: {
    info: {
      text: `The \`onElementClick\` receive an argument with the following type definition: \`Array<[Array<LayerValue>, SeriesIdentifier]>\`.

Usually the outer array contains only one item but, in a near future, we will group smaller slices into a single one during the interaction.
      
For every clicked slice, you will have an array of \`LayerValue\`s and a \`SeriesIdentifier\`. The array of \`LayerValues\` is sorted 
in the same way as the \`layers\` props, and helps you to idenfity the \`groupByRollup\` value and the slice value on every sunburst level.
      `,
    },
  },
};
