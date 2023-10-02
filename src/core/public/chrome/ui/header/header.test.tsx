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
import { act } from 'react-dom/test-utils';
import { BehaviorSubject } from 'rxjs';
import { mountWithIntl } from 'test_utils/enzyme_helpers';
import { httpServiceMock } from '../../../http/http_service.mock';
import { applicationServiceMock, chromeServiceMock } from '../../../mocks';
import { Header } from './header';
import { StubBrowserStorage } from 'test_utils/stub_browser_storage';

jest.mock('@elastic/eui/lib/services/accessibility/html_id_generator', () => ({
  htmlIdGenerator: () => () => 'mockId',
}));

function mockProps() {
  const http = httpServiceMock.createSetupContract({ basePath: '/test' });
  const application = applicationServiceMock.createInternalStartContract();

  return {
    application,
    opensearchDashboardsVersion: '1.0.0',
    appTitle$: new BehaviorSubject('test'),
    badge$: new BehaviorSubject(undefined),
    breadcrumbs$: new BehaviorSubject([]),
    homeHref: '/',
    isVisible$: new BehaviorSubject(true),
    opensearchDashboardsDocLink: '/docs',
    navLinks$: new BehaviorSubject([]),
    customNavLink$: new BehaviorSubject(undefined),
    recentlyAccessed$: new BehaviorSubject([]),
    forceAppSwitcherNavigation$: new BehaviorSubject(false),
    helpExtension$: new BehaviorSubject(undefined),
    helpSupportUrl$: new BehaviorSubject(''),
    navControlsLeft$: new BehaviorSubject([]),
    navControlsCenter$: new BehaviorSubject([]),
    navControlsRight$: new BehaviorSubject([]),
    navControlsExpandedCenter$: new BehaviorSubject([]),
    navControlsExpandedRight$: new BehaviorSubject([]),
    basePath: http.basePath,
    isLocked$: new BehaviorSubject(false),
    loadingCount$: new BehaviorSubject(0),
    onIsLockedUpdate: () => {},
    branding: {},
    survey: '/',
    logos: chromeServiceMock.createStartContract().logos,
  };
}

describe('Header', () => {
  beforeAll(() => {
    Object.defineProperty(window, 'localStorage', {
      value: new StubBrowserStorage(),
    });
  });

  it('handles visibility and lock changes', () => {
    const isVisible$ = new BehaviorSubject(false);
    const breadcrumbs$ = new BehaviorSubject([{ text: 'test' }]);
    const isLocked$ = new BehaviorSubject(false);
    const navLinks$ = new BehaviorSubject([
      { id: 'opensearchDashboards', title: 'opensearchDashboards', baseUrl: '', href: '' },
    ]);
    const customNavLink$ = new BehaviorSubject({
      id: 'cloud-deployment-link',
      title: 'Manage cloud deployment',
      baseUrl: '',
      href: '',
    });
    const recentlyAccessed$ = new BehaviorSubject([
      { link: '', label: 'dashboard', id: 'dashboard' },
    ]);
    const props = {
      ...mockProps(),
      isVisible$,
      breadcrumbs$,
      navLinks$,
      recentlyAccessed$,
      isLocked$,
      customNavLink$,
    };

    const component = mountWithIntl(<Header {...props} />);
    expect(component.find('EuiHeader').exists()).toBeFalsy();
    expect(component.find('EuiProgress').exists()).toBeTruthy();

    act(() => isVisible$.next(true));
    component.update();
    expect(component.find('EuiHeader.primaryHeader').exists()).toBeTruthy();
    expect(component.find('EuiHeader.expandedHeader').exists()).toBeTruthy();
    expect(component.find('HeaderNavControls')).toHaveLength(5);
    expect(component.find('[data-test-subj="toggleNavButton"]').exists()).toBeTruthy();
    expect(component.find('HomeLoader').exists()).toBeTruthy();
    expect(component.find('HeaderBreadcrumbs').exists()).toBeTruthy();
    expect(component.find('HeaderBadge').exists()).toBeTruthy();
    expect(component.find('HeaderActionMenu').exists()).toBeTruthy();
    expect(component.find('HeaderHelpMenuUI').exists()).toBeTruthy();

    expect(component.find('EuiFlyout[aria-label="Primary"]').exists()).toBeFalsy();

    const headerLogo = component.find('HeaderLogo');
    expect(headerLogo.exists()).toBeTruthy();
    expect(headerLogo.prop('backgroundColorScheme')).toEqual('dark');
    expect(headerLogo.prop('logos')).toEqual(props.logos);

    act(() => isLocked$.next(true));
    component.update();
    expect(component.find('EuiFlyout[aria-label="Primary"]').exists()).toBeTruthy();
    expect(component).toMatchSnapshot();
  });

  it('renders condensed header', () => {
    const branding = {
      useExpandedHeader: false,
    };
    const props = {
      ...mockProps(),
      branding,
    };

    const component = mountWithIntl(<Header {...props} />);

    expect(component.find('EuiHeader.primaryHeader').exists()).toBeTruthy();
    expect(component.find('EuiHeader.expandedHeader').exists()).toBeFalsy();
    expect(component.find('HeaderLogo').exists()).toBeFalsy();
    expect(component.find('HeaderNavControls')).toHaveLength(3);
    expect(component.find('[data-test-subj="toggleNavButton"]').exists()).toBeTruthy();
    expect(component.find('HomeLoader').exists()).toBeTruthy();
    expect(component.find('HeaderBreadcrumbs').exists()).toBeTruthy();
    expect(component.find('HeaderBadge').exists()).toBeTruthy();
    expect(component.find('HeaderActionMenu').exists()).toBeTruthy();
    expect(component.find('HeaderHelpMenuUI').exists()).toBeTruthy();

    expect(component).toMatchSnapshot();
  });
});
