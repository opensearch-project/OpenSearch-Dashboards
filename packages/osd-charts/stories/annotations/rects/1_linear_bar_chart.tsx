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

import { boolean } from '@storybook/addon-knobs';
import React from 'react';
import { Axis, BarSeries, Chart, RectAnnotation, ScaleType, Settings } from '../../../src';
import { getChartRotationKnob } from '../../utils/knobs';
import { Position } from '../../../src/utils/commons';

export const example = () => {
  const debug = boolean('debug', false);
  const rotation = getChartRotationKnob();

  return (
    <Chart className="story-chart">
      <Settings debug={debug} rotation={rotation} />
      <RectAnnotation
        id="rect"
        dataValues={[
          {
            coordinates: {
              x0: 0,
              x1: 1,
              y0: 0,
              y1: 4,
            },
            details: 'details about this annotation',
          },
        ]}
        style={{ fill: 'red' }}
      />
      <Axis id="bottom" position={Position.Bottom} title="x-domain axis" />
      <Axis id="left" title="y-domain axis" position={Position.Left} />
      <BarSeries
        id="bars"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={[
          { x: 0, y: 2 },
          { x: 1, y: 3 },
          { x: 3, y: 6 },
        ]}
      />
    </Chart>
  );
};

example.story = {
  parameters: {
    info: {
      text: `A \`<RectAnnotation />\` can be used to create a rectangular annotation.
As for most chart component, the required props are: \`id\` to uniquely identify the annotation and
a \`dataValues\` prop that describes one or more annotations.

The \`dataValues\` prop takes an array of objects adhering to the following type:

\`\`\`ts

interface RectAnnotationDatum {
  coordinates: {
    x0?: PrimitiveValue;
    x1?: PrimitiveValue;
    y0?: PrimitiveValue;
    y1?: PrimitiveValue;
  };
  details?: string;
}

type PrimitiveValue = string | number | null;
\`\`\`

Each coordinate value can be omitted, if omitted then the corresponding min or max value is used instead.
A text can be issued to be shown within the tooltip. If omitted, no tooltip will be shown.

In the above example, we are using a fixed set of coordinates:
\`\`\`
coordinates: {
  x0: 0,
  x1: 1,
  y0: 0,
  y1: 7,
}
\`\`\`

This annotation will cover the X axis starting from the \`0\` value to the \`1\` value included. The \`y\` is covered from 0 to 7.
In a barchart with linear or ordinal x scale, the interval covered by the annotation fully include the \`x0\` and \`x1\` values.
If one value is out of the relative domain, we will clip the annotation to the max/min value of the chart domain.
      `,
    },
  },
};
