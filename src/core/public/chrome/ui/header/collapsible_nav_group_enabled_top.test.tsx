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
import { CollapsibleNavTop } from './collapsible_nav_group_enabled_top';
import { BehaviorSubject } from 'rxjs';
import { WorkspaceObject } from 'src/core/public/workspace';
import { ALL_USE_CASE_ID } from '../../../';

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
      currentWorkspace$: new BehaviorSubject<WorkspaceObject | null>(null),
      setCurrentNavGroup: jest.fn(),
    };
  };

  it('should render back icon when inside a workspace of all use case', async () => {
    const props = {
      ...getMockedProps(),
      currentWorkspace$: new BehaviorSubject<WorkspaceObject | null>({ id: 'foo', name: 'foo' }),
      visibleUseCases: [
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
      ],
      currentNavGroup: {
        id: 'navGroupFoo',
        title: 'navGroupFoo',
        description: 'navGroupFoo',
        navLinks: [],
      },
      firstVisibleNavLinkOfAllUseCase: getMockedNavLink({
        id: 'firstVisibleNavLinkOfAllUseCase',
      }),
    };
    const { findByTestId, findByText, getByTestId } = render(<CollapsibleNavTop {...props} />);
    await findByTestId('collapsibleNavBackButton');
    await findByText('Back');
    fireEvent.click(getByTestId('collapsibleNavBackButton'));
    expect(props.navigateToApp).toBeCalledWith('firstVisibleNavLinkOfAllUseCase');
    expect(props.setCurrentNavGroup).toBeCalledWith(ALL_USE_CASE_ID);
  });

  it('should render home icon when not in a workspace', async () => {
    const { findByTestId } = render(<CollapsibleNavTop {...getMockedProps()} />);
    await findByTestId('collapsibleNavHome');
  });

  it('should render expand icon when collapsed', async () => {
    const { findByTestId } = render(
      <CollapsibleNavTop {...getMockedProps()} shouldShrinkNavigation />
    );
    await findByTestId('collapsibleNavShrinkButton');
  });
});
