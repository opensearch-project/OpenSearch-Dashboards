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
import { OverviewPageHeader } from './overview_page_header';
import { shallowWithIntl } from 'test_utils/enzyme_helpers';
import { useOpenSearchDashboards } from '../../context';
import { getLogosMock } from '../../../../../core/common/mocks';

jest.mock('../../context', () => ({ useOpenSearchDashboards: jest.fn() }));

const mockTitle = 'Page Title';
const addBasePathMock = jest.fn((path: string) => (path ? path : 'path'));

const mockProps = () => ({
  addBasePath: addBasePathMock,
  title: mockTitle,
  branding: {},
  logos: getLogosMock.default,
});

describe('OverviewPageHeader ', () => {
  beforeAll(() => {
    // @ts-ignore
    useOpenSearchDashboards.mockImplementation(() => ({
      services: {
        application: { capabilities: { navLinks: { management: true, dev_tools: true } } },
        notifications: { toast: { addSuccess: jest.fn() } },
      },
    }));
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  it('renders without overlap by default', () => {
    const props = {
      ...mockProps(),
    };

    const component = shallowWithIntl(<OverviewPageHeader {...props} />);

    const header = component.find('header');
    expect(header.hasClass('osdOverviewPageHeader--hasOverlap')).toBeFalsy();
    expect(header.hasClass('osdOverviewPageHeader--noOverlap')).toBeTruthy();
  });

  it('renders with overlap', () => {
    const props = {
      ...mockProps(),
      overlap: true,
    };

    const component = shallowWithIntl(<OverviewPageHeader {...props} />);

    const header = component.find('header');
    expect(header.hasClass('osdOverviewPageHeader--hasOverlap')).toBeTruthy();
    expect(header.hasClass('osdOverviewPageHeader--noOverlap')).toBeFalsy();
  });

  it('renders without an icon by default', () => {
    const props = {
      ...mockProps(),
    };

    const component = shallowWithIntl(<OverviewPageHeader {...props} />);

    const icons = component.find({ 'data-test-subj': 'osdOverviewPageHeaderLogo' });
    expect(icons.length).toBe(0);
  });

  it('renders the mark icon when asked to', () => {
    const props = {
      ...mockProps(),
      showIcon: true,
    };

    const component = shallowWithIntl(<OverviewPageHeader {...props} />);

    const icons = component.find({ 'data-test-subj': 'osdOverviewPageHeaderLogo' });
    expect(icons.length).toBe(1);
    expect(icons.first().prop('type')).toEqual(props.logos.Mark.url);
  });

  it('uses the provided title in the header', () => {
    const props = {
      ...mockProps(),
    };

    const component = shallowWithIntl(<OverviewPageHeader {...props} />);

    const head = component.find('h1');
    expect(head.length).toBe(1);
    expect(head.first().text()).toEqual(mockTitle);
  });

  it('renders with the toolbar by default', () => {
    const props = {
      ...mockProps(),
    };

    const component = shallowWithIntl(<OverviewPageHeader {...props} />);

    const items = component.find('header > div > EuiFlexGroup > EuiFlexItem');
    expect(items.length).toBe(2);

    const buttons = component.find({ className: 'osdOverviewPageHeader__actionButton' });
    // This also validates the order of the items
    const btnAddData = buttons.at(0);
    expect(btnAddData.prop('iconType')).toEqual('indexOpen');
    expect(btnAddData.prop('href')).toEqual('/app/home#/tutorial_directory');

    // Would contain only the "Add Data" button
    expect(component).toMatchSnapshot();
  });

  it('renders with the toolbar when it is explicitly asked not to be hidden', () => {
    const props = {
      ...mockProps(),
      hideToolbar: false,
    };

    const component = shallowWithIntl(<OverviewPageHeader {...props} />);

    const items = component.find('header > div > EuiFlexGroup > EuiFlexItem');
    expect(items.length).toBe(2);

    const buttons = component.find({ className: 'osdOverviewPageHeader__actionButton' });
    // This also validates the order of the items
    const btnAddData = buttons.at(0);
    expect(btnAddData.prop('iconType')).toEqual('indexOpen');
    expect(btnAddData.prop('href')).toEqual('/app/home#/tutorial_directory');
  });

  it('renders without the toolbar when it is explicitly asked to be hidden', () => {
    const props = {
      ...mockProps(),
      hideToolbar: true,
    };

    const component = shallowWithIntl(<OverviewPageHeader {...props} />);

    const items = component.find('header > div > EuiFlexGroup > EuiFlexItem');
    expect(items.length).toBe(1);

    const buttons = component.find({ className: 'osdOverviewPageHeader__actionButton' });
    expect(buttons.length).toBe(0);
  });
});

describe('OverviewPageHeader toolbar items - Management', () => {
  afterAll(() => {
    jest.clearAllMocks();
  });

  const setupAndGetButton = (management: boolean, showManagementLink?: boolean) => {
    // @ts-ignore
    useOpenSearchDashboards.mockImplementation(() => ({
      services: {
        application: { capabilities: { navLinks: { management, dev_tools: true } } },
        notifications: { toast: { addSuccess: jest.fn() } },
      },
    }));

    const props = mockProps();
    if (showManagementLink !== undefined) {
      // @ts-ignore
      props.showManagementLink = showManagementLink;
    }

    const component = shallowWithIntl(<OverviewPageHeader {...props} />);

    return component.find({
      className: 'osdOverviewPageHeader__actionButton',
      href: '/app/settings',
    });
  };

  it('renders without management when the management plugin is disabled', () => {
    const btnManagement = setupAndGetButton(false);
    expect(btnManagement.length).toEqual(0);
  });

  it('renders without management when the management plugin is disabled and asked not to show', () => {
    const btnManagement = setupAndGetButton(false, false);
    expect(btnManagement.length).toEqual(0);
  });

  it('renders without management when the management plugin is disabled even if asked to show', () => {
    const btnManagement = setupAndGetButton(false, true);
    expect(btnManagement.length).toEqual(0);
  });

  it('renders without management when the management plugin is enabled', () => {
    const btnManagement = setupAndGetButton(true);
    expect(btnManagement.length).toEqual(0);
  });

  it('renders without management when the management plugin is enabled but asked not to show', () => {
    const btnManagement = setupAndGetButton(true, false);
    expect(btnManagement.length).toEqual(0);
  });

  it('renders with management when the management plugin is enabled and asked to show', () => {
    const btnManagement = setupAndGetButton(true, true);
    expect(btnManagement.length).toEqual(1);
  });
});

describe('OverviewPageHeader toolbar items - DevTools', () => {
  afterAll(() => {
    jest.clearAllMocks();
  });

  const setupAndGetButton = (devTools: boolean, showDevToolsLink?: boolean) => {
    // @ts-ignore
    useOpenSearchDashboards.mockImplementation(() => ({
      services: {
        application: { capabilities: { navLinks: { management: true, dev_tools: devTools } } },
        notifications: { toast: { addSuccess: jest.fn() } },
      },
    }));

    const props = mockProps();
    if (showDevToolsLink !== undefined) {
      // @ts-ignore
      props.showDevToolsLink = showDevToolsLink;
    }

    const component = shallowWithIntl(<OverviewPageHeader {...props} />);

    return component.find({
      className: 'osdOverviewPageHeader__actionButton',
      href: '/app/dev_tools#/console',
    });
  };

  it('renders without dev_tools when the dev_tools plugin is disabled', () => {
    const btnDevTools = setupAndGetButton(false);
    expect(btnDevTools.length).toEqual(0);
  });

  it('renders without dev_tools when the dev_tools plugin is disabled and asked not to show', () => {
    const btnDevTools = setupAndGetButton(false, false);
    expect(btnDevTools.length).toEqual(0);
  });

  it('renders without dev_tools when the dev_tools plugin is disabled even if asked to show', () => {
    const btnDevTools = setupAndGetButton(false, true);
    expect(btnDevTools.length).toEqual(0);
  });

  it('renders without dev_tools when the dev_tools plugin is enabled', () => {
    const btnDevTools = setupAndGetButton(true);
    expect(btnDevTools.length).toEqual(0);
  });

  it('renders without dev_tools when the dev_tools plugin is enabled but asked not to show', () => {
    const btnDevTools = setupAndGetButton(true, false);
    expect(btnDevTools.length).toEqual(0);
  });

  it('renders with dev_tools when the dev_tools plugin is enabled and asked to show', () => {
    const btnDevTools = setupAndGetButton(true, true);
    expect(btnDevTools.length).toEqual(1);
  });
});
