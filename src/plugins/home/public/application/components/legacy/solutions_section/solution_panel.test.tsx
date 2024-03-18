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
import { shallow } from 'enzyme';
import { SolutionPanel } from './solution_panel';

const solutionEntry = {
  id: 'opensearchDashboards',
  title: 'OpenSearch Dashboards',
  subtitle: 'Visualize & analyze',
  description: 'Explore and analyze your data',
  appDescriptions: ['Analyze data in dashboards'],
  icon: 'inputOutput',
  path: 'opensearch_dashboards_landing_page',
  order: 1,
};

const addBasePathMock = (path: string) => (path ? path : 'path');

const branding = {
  darkMode: false,
  mark: {
    defaultUrl: '/defaultModeLogo',
    darkModeUrl: '/darkModeLogo',
  },
  applicationTitle: 'custom title',
};

describe('SolutionPanel', () => {
  test('renders the solution panel for the given solution', () => {
    const component = shallow(
      <SolutionPanel addBasePath={addBasePathMock} solution={solutionEntry} branding={branding} />
    );
    expect(component).toMatchSnapshot();
  });
});
