/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { ChromeNavLink } from '../../nav_links';
import { ChromeRegistrationNavLink } from '../../nav_group';
import { httpServiceMock } from '../../../mocks';
import { getLogos } from '../../../../common';
import { CollapsibleNavTop } from './collapsible_nav_group_enabled_top';

const mockBasePath = httpServiceMock.createSetupContract({ basePath: '/test' }).basePath;

describe('<CollapsibleNavTop />', () => {
  const getMockedNavLink = (
    navLink: Partial<ChromeNavLink & ChromeRegistrationNavLink>
  ): ChromeNavLink & ChromeRegistrationNavLink => ({
    baseUrl: '',
    href: '',
    id: '',
    title: '',
    ...navLink,
  });
  const mockedNavLinks = [
    getMockedNavLink({
      id: 'home',
      title: 'home link',
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
      id: 'link-in-category-2',
      title: 'link-in-category-2',
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
  ];
  const getMockedProps = () => {
    return {
      navLinks: mockedNavLinks,
      navigateToApp: jest.fn(),
      logos: getLogos({}, mockBasePath.serverBasePath),
      shouldShrinkNavigation: false,
      visibleUseCases: [],
    };
  };
  it('should render home icon', async () => {
    const { findByTestId } = render(<CollapsibleNavTop {...getMockedProps()} />);
    await findByTestId('collapsibleNavHome');
  });

  it('should render back icon', async () => {
    const { findByTestId, findByText } = render(
      <CollapsibleNavTop
        {...getMockedProps()}
        visibleUseCases={[
          {
            id: 'navGroupFoo',
            title: 'navGroupFoo',
            description: 'navGroupFoo',
            navLinks: [],
          },
          {
            id: 'navGroupBar',
            title: 'navGroupBar',
            description: 'navGroupBar',
            navLinks: [],
          },
        ]}
        currentNavGroup={{
          id: 'navGroupFoo',
          title: 'navGroupFoo',
          description: 'navGroupFoo',
          navLinks: [],
        }}
      />
    );
    await findByTestId('collapsibleNavBackButton');
    await findByText('Back');
  });

  it('should render back home icon', async () => {
    const { findByTestId, findByText } = render(
      <CollapsibleNavTop
        {...getMockedProps()}
        visibleUseCases={[
          {
            id: 'navGroupFoo',
            title: 'navGroupFoo',
            description: 'navGroupFoo',
            navLinks: [],
          },
          {
            id: 'navGroupBar',
            title: 'navGroupBar',
            description: 'navGroupBar',
            navLinks: [],
          },
        ]}
        currentNavGroup={{
          id: 'global',
          title: 'navGroupFoo',
          description: 'navGroupFoo',
          navLinks: [],
        }}
      />
    );
    await findByTestId('collapsibleNavBackButton');
    await findByText('Home');
  });

  it('should render expand icon', async () => {
    const { findByTestId } = render(
      <CollapsibleNavTop {...getMockedProps()} shouldShrinkNavigation />
    );
    await findByTestId('collapsibleNavShrinkButton');
  });
});
