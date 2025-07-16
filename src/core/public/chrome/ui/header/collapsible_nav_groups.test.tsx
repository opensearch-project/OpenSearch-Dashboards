/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { NavGroups } from './collapsible_nav_groups';
import { ChromeRegistrationNavLink } from '../../nav_group';
import { ChromeNavLink } from '../../nav_links';
import { coreMock } from 'opensearch-dashboards/public/mocks';

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
    const basePath = coreMock.createStart().http.basePath;
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
        isNavOpen
        basePath={basePath}
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

  it('should render correctly when nav collapse', () => {
    const navigateToApp = jest.fn();
    const basePath = coreMock.createStart().http.basePath;
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
            euiIconType: 'addDataApp',
            category: {
              id: 'category-1',
              label: 'category-1',
            },
          }),
        ]}
        navigateToApp={navigateToApp}
        isNavOpen={false}
        basePath={basePath}
        appId="subLink"
      />
    );
    expect(container).toMatchSnapshot();
    // only nav link item with icon can be found
    expect(container.querySelectorAll('.nav-link-item-btn').length).toEqual(1);
    fireEvent.click(getByTestId('collapsibleNavAppLink-pure'));
    expect(navigateToApp).toBeCalledTimes(0);
    // The accordion is collapsed by default
    expect(queryByTestId('collapsibleNavAppLink-subLink')).toBeNull();
  });
});
