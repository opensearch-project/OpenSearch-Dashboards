/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React, { useCallback } from 'react';
import { EuiPanel } from '@elastic/eui';

import { VisOptionsProps } from 'src/plugins/vis_default_editor/public';
import { OpenSearchDashboardsContextProvider } from '../../opensearch_dashboards_react/public';

import { TimelineVisParams } from './timeline_vis_fn';
import { TimelineInterval, TimelineExpressionInput } from './components';
import { TimelineVisDependencies } from './plugin';

import './timeline_options.scss';

export type TimelineOptionsProps = VisOptionsProps<TimelineVisParams>;

function TimelineOptions({
  services,
  stateParams,
  setValue,
  setValidity,
}: TimelineOptionsProps & {
  services: TimelineVisDependencies;
}) {
  const setInterval = useCallback(
    (value: TimelineVisParams['interval']) => setValue('interval', value),
    [setValue]
  );
  const setExpressionInput = useCallback(
    (value: TimelineVisParams['expression']) => setValue('expression', value),
    [setValue]
  );

  return (
    <OpenSearchDashboardsContextProvider services={services}>
      <EuiPanel className="visEditorSidebar__timelineOptions" paddingSize="s">
        <TimelineInterval
          value={stateParams.interval}
          setValue={setInterval}
          setValidity={setValidity}
        />
        <TimelineExpressionInput value={stateParams.expression} setValue={setExpressionInput} />
      </EuiPanel>
    </OpenSearchDashboardsContextProvider>
  );
}

// default export required for React.Lazy
// eslint-disable-next-line import/no-default-export
export { TimelineOptions as default };
