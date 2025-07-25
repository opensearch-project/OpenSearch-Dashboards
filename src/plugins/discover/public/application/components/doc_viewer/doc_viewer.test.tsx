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
import { mount, shallow } from 'enzyme';
import { DocViewer } from './doc_viewer';
import { findTestSubject } from 'test_utils/helpers';
import { getDocViewsRegistry } from '../../../opensearch_dashboards_services';
// @ts-expect-error TS2307 TODO(ts-error): fixme
import { DocViewRenderProps } from '../../../doc_views/doc_views_types';

jest.mock('../../../opensearch_dashboards_services', () => {
  let registry: any[] = [];
  return {
    getDocViewsRegistry: () => ({
      addDocView(view: any) {
        registry.push(view);
      },
      getDocViewsSorted() {
        return registry;
      },
      resetRegistry: () => {
        registry = [];
      },
    }),
  };
});

beforeEach(() => {
  (getDocViewsRegistry() as any).resetRegistry();
  jest.clearAllMocks();
});

test('Render <DocViewer/> with 3 different tabs', () => {
  const registry = getDocViewsRegistry();
  registry.addDocView({ order: 10, title: 'Render function', render: jest.fn() });
  registry.addDocView({ order: 20, title: 'React component', component: () => <div>test</div> });
  registry.addDocView({ order: 30, title: 'Invalid doc view' });

  const renderProps = { hit: {} } as DocViewRenderProps;

  const wrapper = shallow(<DocViewer {...renderProps} />);

  expect(wrapper).toMatchSnapshot();
});

test('Render <DocViewer/> with 1 tab displaying error message', () => {
  function SomeComponent() {
    // this is just a placeholder
    return null;
  }

  const registry = getDocViewsRegistry();
  registry.addDocView({
    order: 10,
    title: 'React component',
    component: SomeComponent,
  });

  const renderProps = { hit: {} } as DocViewRenderProps;
  const errorMsg = 'Catch me if you can!';

  const wrapper = mount(<DocViewer {...renderProps} />);
  const error = new Error(errorMsg);
  wrapper.find(SomeComponent).simulateError(error);
  const errorMsgComponent = findTestSubject(wrapper, 'docViewerError');
  expect(errorMsgComponent.text()).toMatch(new RegExp(`${errorMsg}`));
});
