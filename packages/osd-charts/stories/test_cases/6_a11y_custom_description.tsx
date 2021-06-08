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

import { boolean, text, select } from '@storybook/addon-knobs';
import React from 'react';

import { AreaSeries, Chart, ScaleType, Settings } from '../../packages/charts/src';
import { KIBANA_METRICS } from '../../packages/charts/src/utils/data_samples/test_dataset_kibana';

export const Example = () => {
  const automatedSeries = boolean('Use the default generated series types of charts for screen readers', true);
  const customDescriptionForScreenReaders = text('add a description for screen readers', '');
  const customLabelForScreenReaders = text('add a label for screen readers', '');
  const headingLevelForScreenReaders = customLabelForScreenReaders
    ? select('heading level for label', { P: 'p', H1: 'h1', H2: 'h2', H3: 'h3', H4: 'h4', H5: 'h5', H6: 'h6' }, 'h2')
    : undefined;
  return (
    <Chart className="story-chart">
      <Settings
        ariaDescription={customDescriptionForScreenReaders}
        ariaUseDefaultSummary={automatedSeries}
        ariaLabel={customLabelForScreenReaders}
        ariaLabelHeadingLevel={headingLevelForScreenReaders}
      />
      <AreaSeries
        id="area"
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        xAccessor={0}
        yAccessors={[1]}
        data={KIBANA_METRICS.metrics.kibana_os_load[0].data}
      />
    </Chart>
  );
};
