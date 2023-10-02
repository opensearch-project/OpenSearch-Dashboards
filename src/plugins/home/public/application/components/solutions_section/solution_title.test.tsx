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
import { SolutionTitle } from './solution_title';
import { getLogosMock } from '../../../../../../core/common/mocks';

const solutionEntry = {
  id: 'opensearchDashboards',
  title: 'OpenSearch Dashboards',
  subtitle: 'Visualize & analyze',
  descriptions: ['Analyze data in dashboards'],
  icon: 'inputOutput',
  path: 'opensearch_dashboards_landing_page',
  order: 1,
};

const mockTitle = 'Page Title';
const makeProps = () => ({
  title: solutionEntry.title,
  subtitle: solutionEntry.subtitle,
  iconType: solutionEntry.icon,
  branding: {
    applicationTitle: mockTitle,
  },
  logos: getLogosMock.default,
});

describe('SolutionTitle ', () => {
  it('renders correctly by default', () => {
    const props = {
      ...makeProps(),
    };
    const component = shallow(<SolutionTitle {...props} />);
    const elements = component.find('EuiToken');
    expect(elements.length).toEqual(1);

    const img = elements.first();
    expect(img.prop('iconType')).toEqual(props.logos.Mark.url);

    const titles = component.find('EuiTitle > h3');
    expect(titles.length).toEqual(1);
    expect(titles.first().text()).toEqual(mockTitle);

    expect(component).toMatchSnapshot();
  });

  it('renders correctly when branded', () => {
    const props = {
      ...makeProps(),
      logos: getLogosMock.branded,
    };
    const component = shallow(<SolutionTitle {...props} />);
    const elements = component.find({
      'data-test-subj': 'dashboardCustomLogo',
    });
    expect(elements.length).toEqual(1);

    const img = elements.first();
    expect(img.prop('src')).toEqual(props.logos.Mark.url);
    expect(img.prop('alt')).toEqual(`${mockTitle} logo`);

    expect(component).toMatchSnapshot();
  });
});
