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

import { action } from '@storybook/addon-actions';
import { text } from '@storybook/addon-knobs';
import React from 'react';

import {
  Axis,
  BarSeries,
  Chart,
  Position,
  ScaleType,
  Settings,
  AccessorFn,
  ElementClickListener,
} from '../../packages/charts/src';
import * as TestDatasets from '../../packages/charts/src/utils/data_samples/test_dataset';
import { SB_SOURCE_PANEL } from '../utils/storybook';

export const Example = () => {
  const xAccessorFn: AccessorFn = (d) => d.x;
  const yAccessorFn: AccessorFn = (d) => d.y;
  yAccessorFn.fieldName = text('y fn name', '') || undefined;
  const splitAccessorFn: AccessorFn = (d) => d.g2;
  splitAccessorFn.fieldName = text('split fn name', '') || undefined;

  const onElementClick: ElementClickListener = ([[, { key }]]) => action('clicked series key')(key);

  return (
    <Chart className="story-chart">
      <Settings onElementClick={onElementClick} showLegend legendPosition={Position.Right} />
      <Axis id="bottom" position={Position.Bottom} title="Bottom axis" showOverlappingTicks />
      <Axis id="left2" title="Left axis" position={Position.Left} tickFormat={(d: any) => Number(d).toFixed(2)} />

      <BarSeries
        id="bars1"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor={xAccessorFn}
        yAccessors={['y', yAccessorFn]}
        splitSeriesAccessors={['g1', splitAccessorFn]}
        data={TestDatasets.BARCHART_1Y2G}
      />
    </Chart>
  );
};

Example.story = {
  parameters: {
    options: { selectedPanel: SB_SOURCE_PANEL },
    info: {
      text: `An \`AccessorFn\` can be used as any accessor including: \`xAccessor\`, \`yAccessors\`, \`y0Accessors\` and \`splitSeriesAccessors\`.

This enables serialization of complex values, without needing to transform raw data.

\`\`\`ts
// simple example
const yAccessorFn: AccessorFn = (d) => d.y;
yAccessorFn.fieldName = 'simple y value';

// complex example
const yAccessorFn: AccessorFn = ({ range }) => \`\${range.to} - \${range.from}\`;
yAccessorFn.fieldName = 'complex y value';
\`\`\`

If no \`fieldName\` is provided, the default value will be set using the index \`(index:0)\`.

Try changing the \`fieldName\` for the y and split accessor functions in the storybook knobs.

**Note: All \`fieldName\` and \`Accessor\` values should be unique. Any duplicated values will be ignored.**
      `,
    },
  },
};
