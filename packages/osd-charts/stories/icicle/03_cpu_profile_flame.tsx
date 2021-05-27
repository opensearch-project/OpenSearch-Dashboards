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

import { Chart, Datum, Partition, PartitionLayout, PrimitiveValue, Settings } from '../../src';
import data from '../../src/mocks/hierarchical/cpu_profile_tree_mock.json';
import { STORYBOOK_LIGHT_THEME } from '../shared';
import { config } from '../utils/hierarchical_input_utils';
import { discreteColor, viridis18 as palette } from '../utils/utils';

const color = palette.slice().reverse();

const getLayerSpec = (maxDepth: number = 30) =>
  [...new Array(maxDepth + 1)].map((_, depth) => ({
    groupByRollup: (d: Datum) => data.dictionary[d.layers[depth]],
    nodeLabel: (d: PrimitiveValue) => `${String(d)}/`,
    showAccessor: (d: PrimitiveValue) => d !== undefined,
    shape: {
      fillColor: () => discreteColor(color, 0.8)(depth),
    },
  }));

export const Example = () => {
  const clipText = boolean("Allow, and clip, texts that wouldn't otherwise fit", true);
  return (
    <Chart className="story-chart">
      <Settings theme={STORYBOOK_LIGHT_THEME} />
      <Partition
        id="spec_1"
        data={data.facts}
        valueAccessor={(d: Datum) => d.value as number}
        valueFormatter={() => ''}
        layers={getLayerSpec()}
        config={{
          ...config,
          partitionLayout: PartitionLayout.icicle,
          drilldown: true,
          fillLabel: {
            ...config.fillLabel,
            clipText,
            padding: { left: 0, right: 0, top: 0, bottom: 0 },
          },
          minFontSize: clipText ? 9 : 6,
          maxFontSize: clipText ? 9 : 20,
          maxRowCount: 1,
          animation: { duration: 500 },
        }}
      />
    </Chart>
  );
};
