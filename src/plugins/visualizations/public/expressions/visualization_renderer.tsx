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

import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { ExpressionRenderDefinition } from '../../../expressions/public';
import { ExprVis } from './vis';
import { Visualization } from '../components';
import { VisParams, VisRenderValue } from '../types';

// Use WeakMap to store roots per DOM node to support multiple instances
const rootsMap = new WeakMap<HTMLElement, Root>();

export const visualization = (): ExpressionRenderDefinition<VisRenderValue> => ({
  name: 'visualization',
  displayName: 'visualization',
  reuseDomNode: true,
  render: async (domNode, config, handlers) => {
    const { visData, visConfig, params } = config;
    const visType = config.visType || visConfig.type;

    const vis = new ExprVis({
      title: config.title,
      type: visType as string,
      params: visConfig as VisParams,
    });

    vis.eventsSubject = { next: handlers.event };

    const uiState = handlers.uiState || vis.getUiState();

    let root = rootsMap.get(domNode);
    if (!root) {
      root = createRoot(domNode);
      rootsMap.set(domNode, root);
    }

    handlers.onDestroy(() => {
      const existingRoot = rootsMap.get(domNode);
      if (existingRoot) {
        existingRoot.unmount();
        rootsMap.delete(domNode);
      }
    });

    const listenOnChange = params ? params.listenOnChange : false;
    // Use flushSync to ensure synchronous rendering like React 17's render()
    // This is necessary because D3 charts measure DOM dimensions immediately
    // after mount, and async rendering would cause incorrect measurements
    flushSync(() => {
      root.render(
        <Visualization
          vis={vis}
          visData={visData}
          visParams={vis.params}
          uiState={uiState}
          listenOnChange={listenOnChange}
          onInit={handlers.done}
        />
      );
    });
  },
});
