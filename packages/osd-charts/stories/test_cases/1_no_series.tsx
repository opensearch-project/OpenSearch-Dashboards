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

import { EuiFlexGroup, EuiFlexItem, EuiIcon, EuiSpacer } from '@elastic/eui';
import { boolean, text } from '@storybook/addon-knobs';
import React, { FC } from 'react';

import { Chart, Settings, Axis, Position } from '../../packages/charts/src';

const NoResults: FC<{ msg: string }> = ({ msg }) => (
  <EuiFlexItem>
    <EuiFlexGroup direction="column" alignItems="center" justifyContent="center">
      <EuiIcon type="visualizeApp" />
      <EuiSpacer size="s" />
      <p>{msg}</p>
    </EuiFlexGroup>
  </EuiFlexItem>
);

/**
 * Should render no data value
 */
export const Example = () => {
  const customNoResults = boolean('Show custom no results', true);
  const noResultsMsg = text('Custom No Results message', 'No Results');

  return (
    <Chart className="story-chart">
      <Axis id="count" title="count" position={Position.Left} />
      <Axis id="x" title="goods" position={Position.Bottom} />
      <Settings noResults={customNoResults ? <NoResults msg={noResultsMsg} /> : undefined} />
    </Chart>
  );
};
