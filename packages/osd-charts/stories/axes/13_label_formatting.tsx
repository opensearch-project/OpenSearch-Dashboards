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

import { text } from '@storybook/addon-knobs';
import numeral from 'numeral';
import React from 'react';

import { AreaSeries, Axis, Chart, CurveType, Position, ScaleType } from '../../packages/charts/src';
import { KIBANA_METRICS } from '../../packages/charts/src/utils/data_samples/test_dataset_kibana';
import { SB_SOURCE_PANEL } from '../utils/storybook';

export const Example = () => {
  const tickFormatBottom = text('tickFormat bottom', '0.0000');
  const labelFormatBottom = text('labelFormat bottom', '0.0');
  const tickFormatLeft = text('tickFormat left', '$ 0,0[.]00');
  const labelFormatLeft = text('labelFormat left', '$ 0,0');
  const start = KIBANA_METRICS.metrics.kibana_os_load[0].data[0][0];
  const data = KIBANA_METRICS.metrics.kibana_os_load[0].data.slice(0, 20).map((d) => [(d[0] - start) / 30000, d[1]]);

  return (
    <Chart className="story-chart">
      <Axis
        id="bottom"
        title="Weight"
        position={Position.Bottom}
        tickFormat={(d) => numeral(d).format(tickFormatBottom)}
        labelFormat={(d) => numeral(d).format(labelFormatBottom)}
      />
      <Axis
        id="left"
        title="Price"
        position={Position.Left}
        tickFormat={(d) => numeral(d).format(tickFormatLeft)}
        labelFormat={(d) => numeral(d).format(labelFormatLeft)}
      />

      <AreaSeries
        id="areas"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        data={data}
        curve={CurveType.CURVE_MONOTONE_X}
      />
    </Chart>
  );
};

Example.story = {
  parameters: {
    options: { selectedPanel: SB_SOURCE_PANEL },
    info: {
      text: `You can apply different formatter between tick values in the tooltip and legend by using
      different values for \`tickFormat\` and \`labelFormat\`.

Use a [numeraljs](http://numeraljs.com/) format with the knobs to see the difference`,
    },
  },
};
