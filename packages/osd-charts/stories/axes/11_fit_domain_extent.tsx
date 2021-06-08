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

import { boolean, number, select } from '@storybook/addon-knobs';
import React from 'react';

import { Axis, Chart, DomainPaddingUnit, LineSeries, Position, ScaleType } from '../../packages/charts/src';
import { SeededDataGenerator } from '../../packages/charts/src/mocks/utils';
import { getKnobsFromEnum } from '../utils/knobs';

export const Example = () => {
  const dg = new SeededDataGenerator();
  const base = dg.generateBasicSeries(100, 0, 50);
  const positive = base.map(({ x, y }) => ({ x, y: y + 1000 }));
  const both = base.map(({ x, y }) => ({ x, y: y - 100 }));
  const negative = base.map(({ x, y }) => ({ x, y: y - 1000 }));

  const dataTypes = {
    positive,
    both,
    negative,
  };
  const dataKey = select<'positive' | 'negative' | 'both'>(
    'dataset',
    {
      'Positive values only': 'positive',
      'Positive and negative': 'both',
      'Negtive values only': 'negative',
    },
    'both',
  );

  const dataset = dataTypes[dataKey];
  const fit = boolean('fit Y domain to data', true);
  const constrainPadding = boolean('constrain padding', true);
  const padding = number('domain padding', 0.1);
  const paddingUnit = getKnobsFromEnum(
    'Domain padding unit',
    DomainPaddingUnit,
    DomainPaddingUnit.DomainRatio as DomainPaddingUnit,
  );

  return (
    <Chart className="story-chart">
      <Axis id="bottom" title="index" position={Position.Bottom} />
      <Axis
        domain={{ fit, padding, paddingUnit, constrainPadding }}
        id="left"
        title="Value"
        position={Position.Left}
        tickFormat={(d) => Number(d).toFixed(2)}
      />

      <LineSeries
        id="lines"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={dataset}
      />
    </Chart>
  );
};
