/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { NavGroups } from './collapsible_nav_groups';
import { ChromeRegistrationNavLink } from '../../nav_group';
import { ChromeNavLink } from '../../nav_links';
import * as navUtils from '../../utils';

// Wazuh: Mock the getIsCategoryOpen function to return true by default.
// This is because we change the default value of the getIsCategoryOpen function to false.
// And all the tests fail because the getIsCategoryOpen function returns false on the first render.
// That's why we mock it to return true by default.

jest.spyOn(navUtils, 'getIsCategoryOpen').mockImplementation((category, storage) => {
  // Try to get the value from the storage first
  const storageKey = `core.navGroup.${category}`;
  const storedValue = storage.getItem(storageKey);
  // If the value is not stored, return the default value
  if (storedValue !== null) {
    return storedValue === 'true';
  }
  return true;
});

describe('<NavGroups />', () => {
  const getMockedNavLink = (
    navLink: Partial<ChromeNavLink & ChromeRegistrationNavLink>
  ): ChromeNavLink & ChromeRegistrationNavLink => ({
    baseUrl: '',
    href: '',
    id: '',
    title: '',
    ...navLink,
  });
  it('should render correctly', () => {
    const navigateToApp = jest.fn();
    const onNavItemClick = jest.fn();
    const { container, getByTestId, queryByTestId } = render(
      <NavGroups
        navLinks={[
          getMockedNavLink({
            id: 'pure',
            title: 'pure link',
          }),
          getMockedNavLink({
            id: 'subLink',
            title: 'subLink',
            parentNavLinkId: 'pure',
          }),
          getMockedNavLink({
            id: 'link-in-category',
            title: 'link-in-category',
            category: {
              id: 'category-1',
              label: 'category-1',
            },
          }),
          getMockedNavLink({
            id: 'link-2-in-category',
            title: 'link-2-in-category',
            category: {
              id: 'category-1',
              label: 'category-1',
            },
          }),
          getMockedNavLink({
            id: 'sub-link-in-category',
            title: 'sub-link-in-category',
            parentNavLinkId: 'link-in-category',
            category: {
              id: 'category-1',
              label: 'category-1',
            },
          }),
        ]}
        navigateToApp={navigateToApp}
        onNavItemClick={onNavItemClick}
      />
    );
    expect(container).toMatchSnapshot();
    expect(container.querySelectorAll('.nav-link-item-btn').length).toEqual(5);
    fireEvent.click(getByTestId('collapsibleNavAppLink-pure'));
    expect(navigateToApp).toBeCalledTimes(0);
    // The accordion is collapsed by default
    expect(queryByTestId('collapsibleNavAppLink-subLink')).toBeNull();

    // Expand the accordion
    fireEvent.click(getByTestId('collapsibleNavAppLink-pure'));
    fireEvent.click(getByTestId('collapsibleNavAppLink-subLink'));
    expect(navigateToApp).toBeCalledWith('subLink');
  });
});
