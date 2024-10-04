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

import { mount } from 'enzyme';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { BehaviorSubject } from 'rxjs';
import { ChromeBreadcrumb } from '../../chrome_service';
import { HeaderBreadcrumbs } from './header_breadcrumbs';

describe('HeaderBreadcrumbs', () => {
  it('renders updates to the breadcrumbs$ observable', () => {
    const breadcrumbs$ = new BehaviorSubject([{ text: 'First' }]);
    const wrapper = mount(
      <HeaderBreadcrumbs
        appTitle$={new BehaviorSubject('')}
        breadcrumbs$={breadcrumbs$}
        breadcrumbsEnricher$={new BehaviorSubject(undefined)}
      />
    );
    expect(wrapper.find('.euiBreadcrumb')).toMatchSnapshot();

    act(() => breadcrumbs$.next([{ text: 'First' }, { text: 'Second' }]));
    wrapper.update();
    expect(wrapper.find('.euiBreadcrumb')).toMatchSnapshot();

    act(() => breadcrumbs$.next([]));
    wrapper.update();
    expect(wrapper.find('.euiBreadcrumb')).toMatchSnapshot();
  });

  it('renders updates to the breadcrumbs$ observable with updated header', () => {
    const breadcrumbs$ = new BehaviorSubject([{ text: 'First' }]);
    const wrapper = mount(
      <HeaderBreadcrumbs
        appTitle$={new BehaviorSubject('')}
        breadcrumbs$={breadcrumbs$}
        breadcrumbsEnricher$={new BehaviorSubject(undefined)}
        useUpdatedHeader={true}
      />
    );
    expect(wrapper.find('.euiBreadcrumb')).toMatchSnapshot();
    expect(wrapper.find('[data-test-subj="breadcrumb first"]').exists()).toBeFalsy();

    act(() => breadcrumbs$.next([{ text: 'First' }, { text: 'Second' }]));
    wrapper.update();
    expect(wrapper.find('.euiBreadcrumb')).toMatchSnapshot();
    expect(wrapper.find('[data-test-subj="breadcrumb first"]').exists()).toBeTruthy();

    act(() => breadcrumbs$.next([]));
    wrapper.update();
    expect(wrapper.find('.euiBreadcrumb')).toMatchSnapshot();
  });

  it('prepend current nav group into existing breadcrumbs when nav group is enabled', () => {
    const breadcrumbs$ = new BehaviorSubject([{ text: 'First' }]);
    const breadcrumbsEnricher$ = new BehaviorSubject((crumbs: ChromeBreadcrumb[]) => [
      { text: 'Home' },
      { text: 'Analytics' },
      ...crumbs,
    ]);
    const wrapper = mount(
      <HeaderBreadcrumbs
        appTitle$={new BehaviorSubject('')}
        breadcrumbs$={breadcrumbs$}
        breadcrumbsEnricher$={breadcrumbsEnricher$}
      />
    );
    const breadcrumbs = wrapper.find('.euiBreadcrumbWrapper');
    expect(breadcrumbs).toHaveLength(3);
    expect(breadcrumbs.at(0).text()).toBe('Home');
    expect(breadcrumbs.at(1).text()).toBe('Analytics');
    expect(breadcrumbs.at(2).text()).toBe('First');

    act(() => breadcrumbs$.next([{ text: 'First' }, { text: 'Second' }]));
    wrapper.update();
    expect(wrapper.find('.euiBreadcrumbWrapper')).toHaveLength(4);

    act(() => breadcrumbs$.next([]));
    wrapper.update();
    expect(wrapper.find('.euiBreadcrumbWrapper')).toHaveLength(2);
  });
});

describe('EuiSimplifiedBreadcrumbs', () => {
  it('renders updates to the breadcrumbs$ observable', () => {
    const breadcrumbs$ = new BehaviorSubject([{ text: 'First' }]);
    const wrapper = mount(
      <HeaderBreadcrumbs
        appTitle$={new BehaviorSubject('')}
        breadcrumbs$={breadcrumbs$}
        breadcrumbsEnricher$={new BehaviorSubject(undefined)}
        renderFullLength={true}
        hideTrailingSeparator={true}
      />
    );
    expect(wrapper.find('.euiBreadcrumbSeparator .euiBreadcrumbSeparator')).toHaveLength(0);

    act(() => breadcrumbs$.next([{ text: 'First' }, { text: 'Second' }]));
    wrapper.update();
    expect(wrapper.find('.euiSimplifiedBreadcrumbs .euiBreadcrumbSeparator')).toHaveLength(1);

    act(() => breadcrumbs$.next([]));
    wrapper.update();
    expect(wrapper.find('.euiSimplifiedBreadcrumbs')).toMatchSnapshot();
  });
});
