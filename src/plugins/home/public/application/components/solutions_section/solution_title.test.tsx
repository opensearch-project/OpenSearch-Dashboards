/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
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

/*
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import React from 'react';
import { shallow } from 'enzyme';
import { SolutionTitle } from './solution_title';

const solutionEntry = {
  id: 'opensearchDashboards',
  subtitle: 'Visualize & analyze',
  descriptions: ['Analyze data in dashboards'],
  icon: 'inputOutput',
  path: 'opensearch_dashboards_landing_page',
  order: 1,
};

describe('SolutionTitle', () => {
  test('renders the title section of the solution panel with default branding', () => {
    const branding = {
      title: 'OpenSearch Dashboards',
    };
    const component = shallow(
      <SolutionTitle
        subtitle={solutionEntry.subtitle}
        iconType={solutionEntry.icon}
        branding={branding}
      />
    );
    expect(component).toMatchSnapshot();
  });

  test('renders the title section of the solution panel with custom branding', () => {
    const branding = {
      smallLogoUrl: '/',
      title: 'OpenSearch Dashboards',
    };
    const component = shallow(
      <SolutionTitle
        subtitle={solutionEntry.subtitle}
        iconType={solutionEntry.icon}
        branding={branding}
      />
    );
    expect(component).toMatchSnapshot();
  });
});
