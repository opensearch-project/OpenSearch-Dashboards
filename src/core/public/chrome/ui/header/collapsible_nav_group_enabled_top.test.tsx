/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { ChromeNavLink } from '../../nav_links';
import { ChromeRegistrationNavLink } from '../../nav_group';
import { httpServiceMock } from '../../../mocks';
import { getLogos } from '../../../../common';
import { CollapsibleNavTop, CollapsibleNavTopProps } from './collapsible_nav_group_enabled_top';
import { BehaviorSubject } from 'rxjs';
import { WorkspaceObject } from 'src/core/public/workspace';
import { ALL_USE_CASE_ID, DEFAULT_NAV_GROUPS } from '../../../';

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
  const getMockedProps = () => {
    return {
      homeLink: getMockedNavLink({ id: 'home', title: 'Home', href: '/' }),
      navigateToApp: jest.fn(),
      logos: getLogos({}, mockBasePath.serverBasePath),
      shouldShrinkNavigation: false,
      visibleUseCases: [],
      navGroupsMap: {},
      navLinks: [],
      currentWorkspace$: new BehaviorSubject<WorkspaceObject | null>(null),
      setCurrentNavGroup: jest.fn(),
    };
  };

  it('should render back icon when inside a workspace of all use case', async () => {
    const props: CollapsibleNavTopProps = {
      ...getMockedProps(),
      currentWorkspace$: new BehaviorSubject<WorkspaceObject | null>({ id: 'foo', name: 'foo' }),
      visibleUseCases: [
        {
          ...DEFAULT_NAV_GROUPS.all,
          title: 'navGroupFoo',
          description: 'navGroupFoo',
          navLinks: [
            {
              id: 'firstVisibleNavLinkOfAllUseCase',
            },
          ],
        },
      ],
      navGroupsMap: {
        [DEFAULT_NAV_GROUPS.all.id]: {
          ...DEFAULT_NAV_GROUPS.all,
          title: 'navGroupFoo',
          description: 'navGroupFoo',
          navLinks: [
            {
              id: 'firstVisibleNavLinkOfAllUseCase',
            },
          ],
        },
      },
      navLinks: [
        getMockedNavLink({
          id: 'firstVisibleNavLinkOfAllUseCase',
        }),
      ],
      currentNavGroup: {
        id: 'navGroupFoo',
        title: 'navGroupFoo',
        description: 'navGroupFoo',
        navLinks: [],
      },
    };
    const { findByTestId, getByTestId } = render(<CollapsibleNavTop {...props} />);
    await findByTestId(`collapsibleNavIcon-${DEFAULT_NAV_GROUPS.all.icon}`);
    fireEvent.click(getByTestId(`collapsibleNavIcon-${DEFAULT_NAV_GROUPS.all.icon}`));
    expect(props.navigateToApp).toBeCalledWith('firstVisibleNavLinkOfAllUseCase');
    expect(props.setCurrentNavGroup).toBeCalledWith(ALL_USE_CASE_ID);
  });

  it('should render home icon when not in a workspace', async () => {
    const props = getMockedProps();
    const { findByTestId, getByTestId } = render(<CollapsibleNavTop {...props} />);
    await findByTestId('collapsibleNavHome');
    fireEvent.click(getByTestId('collapsibleNavHome'));
    expect(props.navigateToApp).toBeCalledWith('home');
  });

  it('should render expand icon when collapsed', async () => {
    const { findByTestId } = render(
      <CollapsibleNavTop {...getMockedProps()} shouldShrinkNavigation />
    );
    await findByTestId('collapsibleNavShrinkButton');
  });

  it('should render successfully without error when visibleUseCases is empty but inside a workspace', async () => {
    expect(() =>
      render(
        <CollapsibleNavTop
          {...getMockedProps()}
          currentWorkspace$={
            new BehaviorSubject<WorkspaceObject | null>({ id: 'foo', name: 'bar' })
          }
          shouldShrinkNavigation
        />
      )
    ).not.toThrow();
  });
});
