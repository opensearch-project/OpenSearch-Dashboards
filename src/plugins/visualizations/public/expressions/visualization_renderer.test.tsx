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

import { visualization } from './visualization_renderer';
import { PersistedState } from '../persisted_state';

const renderedTrees: any[] = [];

jest.mock('react-dom/client', () => ({
  createRoot: () => ({
    render: (tree: any) => {
      renderedTrees.push(tree);
    },
    unmount: () => {},
  }),
}));

jest.mock('react-dom', () => ({
  flushSync: (fn: () => void) => fn(),
}));

jest.mock('../components', () => ({
  Visualization: function MockVisualization(props: any) {
    return props;
  },
}));

jest.mock('../services', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { BaseVisType } = require('../vis_types/base_vis_type');
  const visType = new BaseVisType({
    name: 'pie',
    title: 'pie',
    icon: 'pie-icon',
    visualization: class {
      render() {
        return Promise.resolve();
      }
      destroy() {}
    },
  });
  return {
    getTypes: () => ({ get: () => visType }),
  };
});

describe('visualization renderer', () => {
  beforeEach(() => {
    renderedTrees.length = 0;
  });

  // Regression test for https://github.com/opensearch-project/OpenSearch-Dashboards/issues/9597
  // The renderer creates a fresh ExprVis on every call. Without explicitly wiring
  // its uiState from handlers.uiState, only the first ExprVis has the persisted
  // uiState (set by <Visualization>'s constructor). After the chart unmounts (e.g.
  // a filter narrows the result set to zero hits) and remounts, the new
  // VislibVisController is built from the latest ExprVis, whose uiState was never
  // wired up — so saved pie-slice colors and legend visibility are lost.
  it('wires handlers.uiState onto every ExprVis it constructs', async () => {
    const renderer = visualization();
    const domNode = document.createElement('div');
    const persistedState = new PersistedState({
      vis: {
        colors: { 'Slice A': '#ff0000' },
        legendOpen: false,
      },
    });

    const handlers: any = {
      uiState: persistedState,
      event: jest.fn(),
      done: jest.fn(),
      onDestroy: jest.fn(),
    };

    const config: any = {
      visType: 'pie',
      title: 'Pie Chart',
      visConfig: { type: 'pie' },
      visData: { hits: 1 },
      params: {},
    };

    await renderer.render(domNode, config, handlers);
    await renderer.render(domNode, config, handlers);
    await renderer.render(domNode, config, handlers);

    expect(renderedTrees).toHaveLength(3);
    for (const tree of renderedTrees) {
      // The renderer should pass through the embeddable's persisted state...
      expect(tree.props.uiState).toBe(persistedState);
      // ...and also wire it onto the freshly-constructed ExprVis so that
      // downstream consumers (legend, color lookup) reading vis.getUiState()
      // see the saved colors and legend visibility — even on remount.
      expect(tree.props.vis.getUiState()).toBe(persistedState);
      expect(tree.props.vis.getUiState().get('vis.colors')).toEqual({
        'Slice A': '#ff0000',
      });
      expect(tree.props.vis.getUiState().get('vis.legendOpen')).toBe(false);
    }
  });
});
