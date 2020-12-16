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

import { boolean, number } from '@storybook/addon-knobs';
import React from 'react';

import { Chart, Partition, Settings } from '../../src';
import { STORYBOOK_LIGHT_THEME } from '../shared';

export const Example = () => {
  const flatLegend = boolean('flatLegend', false);
  const legendMaxDepth = number('legendMaxDepth', 2, {
    min: 0,
    max: 3,
    step: 1,
  });

  type TestDatum = { cat1: string; cat2: string; val: number };

  return (
    <Chart className="story-chart">
      <Settings showLegend flatLegend={flatLegend} legendMaxDepth={legendMaxDepth} theme={STORYBOOK_LIGHT_THEME} />
      <Partition
        id="spec_1"
        data={[
          { cat1: 'A', cat2: 'A', val: 1 },
          { cat1: 'A', cat2: 'B', val: 1 },
          { cat1: 'B', cat2: 'A', val: 1 },
          { cat1: 'B', cat2: 'B', val: 1 },
          { cat1: 'C', cat2: 'A', val: 1 },
          { cat1: 'C', cat2: 'B', val: 1 },
        ]}
        valueAccessor={(d: TestDatum) => d.val}
        layers={[
          {
            groupByRollup: (d: TestDatum) => d.cat1,
          },
          {
            groupByRollup: (d: TestDatum) => d.cat2,
          },
        ]}
      />
    </Chart>
  );
};

Example.story = {
  parameters: {
    info: {
      text: `Nested legend with reused node labels means that they can reoccur in various points of the legend tree.`,
    },
  },
};
