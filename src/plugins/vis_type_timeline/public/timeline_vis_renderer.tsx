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

import React, { lazy } from 'react';
import { render, unmountComponentAtNode } from 'react-dom';

import { ExpressionRenderDefinition } from 'src/plugins/expressions';
import { OpenSearchDashboardsContextProvider } from '../../opensearch_dashboards_react/public';
import { VisualizationContainer } from '../../visualizations/public';
import { TimelineVisDependencies } from './plugin';
import { TimelineRenderValue } from './timeline_vis_fn';
// @ts-ignore
const TimelineVisComponent = lazy(() => import('./components/timeline_vis_component'));

export const getTimelineVisRenderer: (
  deps: TimelineVisDependencies
) => ExpressionRenderDefinition<TimelineRenderValue> = (deps) => ({
  name: 'timeline_vis',
  displayName: 'Timeline visualization',
  reuseDomNode: true,
  render: (domNode, { visData, visParams }, handlers) => {
    handlers.onDestroy(() => {
      unmountComponentAtNode(domNode);
    });

    const [seriesList] = visData.sheet;
    const showNoResult = !seriesList || !seriesList.list.length;

    if (showNoResult) {
      // send the render complete event when there is no data to show
      // to notify that a chart is updated
      handlers.done();
    }

    render(
      <VisualizationContainer showNoResult={showNoResult}>
        <OpenSearchDashboardsContextProvider services={{ ...deps }}>
          <TimelineVisComponent
            interval={visParams.interval}
            seriesList={seriesList}
            renderComplete={handlers.done}
            fireEvent={handlers.event}
          />
        </OpenSearchDashboardsContextProvider>
      </VisualizationContainer>,
      domNode
    );
  },
});
