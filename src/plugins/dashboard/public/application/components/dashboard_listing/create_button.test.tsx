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

import { mountWithIntl } from 'test_utils/enzyme_helpers';
import { findTestSubject } from '@elastic/eui/lib/test';

import React from 'react';

import { CreateButton } from './create_button';
import { DashboardProvider } from '../../../types';

const provider = (type?: string, url?: string, text?: string): DashboardProvider => {
  return {
    appId: 'test',
    savedObjectsType: type || 'test',
    savedObjectsName: type || 'Test',
    createUrl: url || 'createUrl',
    createLinkText: text || 'TestModule',
    createSortText: text || 'TestModule',
    viewUrlPathFn: (id) => `/${type || 'test'}_plugin/${id}`,
    editUrlPathFn: (id) => `/${type || 'test'}_plugin/${id}/edit`,
  };
};

function mountComponent(props?: any) {
  return mountWithIntl(<CreateButton {...props} />);
}

describe('create button no props', () => {
  test('renders empty when no providers given', () => {
    const component = mountComponent();

    expect(component).toMatchSnapshot();
  });
});
describe('create button with props', () => {
  test('renders single button when one provider given', () => {
    const component = mountComponent({ dashboardProviders: [provider()] });
    expect(component).toMatchSnapshot();
    const links = findTestSubject(component, 'newItemButton');
    expect(links.length).toBe(1);
  });
  test('renders button dropdown menu when two providers given', () => {
    const provider1 = provider('test1', 'test1', 'test1');
    const provider2 = provider('test2', 'test2', 'test2');
    const component = mountComponent({ dashboardProviders: [provider2, provider1] });
    expect(component).toMatchSnapshot();
    const createButtons = findTestSubject(component, 'newItemButton');
    expect(createButtons.length).toBe(0);
    const createDropdown = findTestSubject(component, 'createMenuDropdown');
    createDropdown.simulate('click');
    const contextMenus = findTestSubject(component, 'contextMenuItem-test');
    expect(contextMenus.length).toBe(2);
    expect(contextMenus.at(0).prop('href')).toBe('test1');
  });
});
