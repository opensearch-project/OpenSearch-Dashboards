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
});
