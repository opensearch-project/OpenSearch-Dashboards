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

import { mount, ReactWrapper } from 'enzyme';
import React from 'react';
import { BehaviorSubject } from 'rxjs';
import sinon from 'sinon';
import { StubBrowserStorage } from 'test_utils/stub_browser_storage';
import { ChromeNavLink, DEFAULT_APP_CATEGORIES } from '../../..';
import { httpServiceMock } from '../../../http/http_service.mock';
import { ChromeRecentlyAccessedHistoryItem } from '../../recently_accessed';
import { CollapsibleNav } from './collapsible_nav';
import { getLogos } from '../../../../common';

jest.mock('@elastic/eui/lib/services/accessibility/html_id_generator', () => ({
  htmlIdGenerator: () => () => 'mockId',
}));

const { opensearchDashboards, observability, security, management } = DEFAULT_APP_CATEGORIES;

function mockLink({ title = 'discover', category }: Partial<ChromeNavLink>) {
  return {
    title,
    category,
    id: title,
    href: title,
    baseUrl: '/',
    isActive: true,
    'data-test-subj': title,
  };
}

function mockRecentNavLink({ label = 'recent' }: Partial<ChromeRecentlyAccessedHistoryItem>) {
  return {
    label,
    link: label,
    id: label,
  };
}

const mockBasePath = httpServiceMock.createSetupContract({ basePath: '/test' }).basePath;
const mockBranding = {
  logo: {
    defaultUrl: '/custom/branded/logo.svg',
    darkModeUrl: '/custom/branded/logo-darkmode.svg',
  },
  mark: {
    defaultUrl: '/custom/branded/mark.svg',
    darkModeUrl: '/custom/branded/mark-darkmode.svg',
  },
};

function mockProps(branding = {}) {
  return {
    appId$: new BehaviorSubject('test'),
    basePath: mockBasePath,
    id: 'collapsibe-nav',
    isLocked: false,
    isNavOpen: false,
    homeHref: '/',
    navLinks$: new BehaviorSubject([]),
    recentlyAccessed$: new BehaviorSubject([]),
    storage: new StubBrowserStorage(),
    onIsLockedUpdate: () => {},
    closeNav: () => {},
    navigateToApp: () => Promise.resolve(),
    navigateToUrl: () => Promise.resolve(),
    customNavLink$: new BehaviorSubject(undefined),
    branding,
    logos: getLogos(branding, mockBasePath.serverBasePath),
  };
}

function expectShownNavLinksCount(component: ReactWrapper, count: number) {
  expect(
    component.find('.euiAccordion-isOpen a[data-test-subj^="collapsibleNavAppLink"]').length
  ).toEqual(count);
}

function expectNavIsClosed(component: ReactWrapper) {
  expectShownNavLinksCount(component, 0);
}

function clickGroup(component: ReactWrapper, group: string) {
  component.find(`[data-test-subj="collapsibleNavGroup-${group}"] button`).simulate('click');
}

describe('CollapsibleNav', () => {
  // this test is mostly an "EUI works as expected" sanity check
  it('renders the default nav', () => {
    const onLock = sinon.spy();
    const component = mount(<CollapsibleNav {...mockProps()} onIsLockedUpdate={onLock} />);
    expect(component).toMatchSnapshot();

    component.setProps({ isOpen: true });
    expect(component).toMatchSnapshot();

    component.setProps({ isLocked: true });
    expect(component).toMatchSnapshot();

    // limit the find to buttons because jest also renders data-test-subj on a JSX wrapper element
    component.find('button[data-test-subj="collapsible-nav-lock"]').simulate('click');
    expect(onLock.callCount).toEqual(1);
  });

  it('renders links grouped by category', () => {
    // just a test of category functionality, categories are not accurate
    const navLinks = [
      mockLink({ title: 'discover', category: opensearchDashboards }),
      mockLink({ title: 'siem', category: security }),
      mockLink({ title: 'metrics', category: observability }),
      mockLink({ title: 'monitoring', category: management }),
      mockLink({ title: 'visualize', category: opensearchDashboards }),
      mockLink({ title: 'dashboard', category: opensearchDashboards }),
      mockLink({ title: 'canvas' }), // links should be able to be rendered top level as well
      mockLink({ title: 'logs', category: observability }),
    ];
    const recentNavLinks = [
      mockRecentNavLink({ label: 'recent 1' }),
      mockRecentNavLink({ label: 'recent 2' }),
    ];
    const customNavLink = mockLink({ title: 'Custom link' });
    const component = mount(
      <CollapsibleNav
        {...mockProps()}
        isNavOpen={true}
        navLinks$={new BehaviorSubject(navLinks)}
        recentlyAccessed$={new BehaviorSubject(recentNavLinks)}
        customNavLink$={new BehaviorSubject(customNavLink)}
      />
    );
    expect(component).toMatchSnapshot();
  });

  it('remembers collapsible section state', () => {
    const navLinks = [
      mockLink({ category: opensearchDashboards }),
      mockLink({ category: observability }),
    ];
    const recentNavLinks = [mockRecentNavLink({})];
    const component = mount(
      <CollapsibleNav
        {...mockProps()}
        isNavOpen={true}
        navLinks$={new BehaviorSubject(navLinks)}
        recentlyAccessed$={new BehaviorSubject(recentNavLinks)}
      />
    );
    expectShownNavLinksCount(component, 3);
    clickGroup(component, 'opensearchDashboards');
    clickGroup(component, 'recentlyViewed');
    expectShownNavLinksCount(component, 1);
    component.setProps({ isNavOpen: false });
    expectNavIsClosed(component);
    component.setProps({ isNavOpen: true });
    expectShownNavLinksCount(component, 1);
  });

  it('closes the nav after clicking a link', () => {
    const onClose = sinon.spy();
    const navLinks = [
      mockLink({ category: opensearchDashboards }),
      mockLink({ title: 'categoryless' }),
    ];
    const recentNavLinks = [mockRecentNavLink({})];
    const component = mount(
      <CollapsibleNav
        {...mockProps()}
        isNavOpen={true}
        navLinks$={new BehaviorSubject(navLinks)}
        recentlyAccessed$={new BehaviorSubject(recentNavLinks)}
      />
    );
    component.setProps({
      closeNav: () => {
        component.setProps({ isNavOpen: false });
        onClose();
      },
    });

    component.find('[data-test-subj="collapsibleNavGroup-recentlyViewed"] a').simulate('click');
    expect(onClose.callCount).toEqual(1);
    expectNavIsClosed(component);
    component.setProps({ isNavOpen: true });
    component
      .find('[data-test-subj="collapsibleNavGroup-opensearchDashboards"] a')
      .simulate('click');
    expect(onClose.callCount).toEqual(2);
    expectNavIsClosed(component);
    component.setProps({ isNavOpen: true });
    component.find('[data-test-subj="collapsibleNavGroup-noCategory"] a').simulate('click');
    expect(onClose.callCount).toEqual(3);
    expectNavIsClosed(component);
  });

  describe('with custom branding', () => {
    it('renders the nav bar in default mode', () => {
      const navLinks = [
        mockLink({ category: opensearchDashboards }),
        mockLink({ category: observability }),
      ];
      const recentNavLinks = [mockRecentNavLink({})];
      const component = mount(
        <CollapsibleNav
          {...mockProps(mockBranding)}
          isNavOpen={true}
          navLinks$={new BehaviorSubject(navLinks)}
          recentlyAccessed$={new BehaviorSubject(recentNavLinks)}
        />
      );

      expect(component).toMatchSnapshot();
    });

    it('renders the nav bar in dark mode', () => {
      const navLinks = [
        mockLink({ category: opensearchDashboards }),
        mockLink({ category: observability }),
      ];
      const recentNavLinks = [mockRecentNavLink({})];
      const component = mount(
        <CollapsibleNav
          {...mockProps({ ...mockBranding, darkMode: true })}
          isNavOpen={true}
          navLinks$={new BehaviorSubject(navLinks)}
          recentlyAccessed$={new BehaviorSubject(recentNavLinks)}
        />
      );

      expect(component).toMatchSnapshot();
    });
  });

  describe('without custom branding', () => {
    it('renders the nav bar in default mode', () => {
      const navLinks = [
        mockLink({ category: opensearchDashboards }),
        mockLink({ category: observability }),
      ];
      const recentNavLinks = [mockRecentNavLink({})];
      const component = mount(
        <CollapsibleNav
          {...mockProps()}
          isNavOpen={true}
          navLinks$={new BehaviorSubject(navLinks)}
          recentlyAccessed$={new BehaviorSubject(recentNavLinks)}
        />
      );

      expect(component).toMatchSnapshot();
    });

    it('renders the nav bar in dark mode', () => {
      const navLinks = [
        mockLink({ category: opensearchDashboards }),
        mockLink({ category: observability }),
      ];
      const recentNavLinks = [mockRecentNavLink({})];
      const component = mount(
        <CollapsibleNav
          {...mockProps({ darkMode: true })}
          isNavOpen={true}
          navLinks$={new BehaviorSubject(navLinks)}
          recentlyAccessed$={new BehaviorSubject(recentNavLinks)}
        />
      );

      expect(component).toMatchSnapshot();
    });
  });
});
