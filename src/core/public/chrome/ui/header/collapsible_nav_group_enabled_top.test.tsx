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
import { NavGroupType } from '../../../../types/nav_group';

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
  const getMockedProps = (): CollapsibleNavTopProps => {
    return {
      homeLink: getMockedNavLink({ id: 'home', title: 'Home', href: '/' }),
      navigateToApp: jest.fn(),
      logos: getLogos({}, mockBasePath.serverBasePath),
      isNavOpen: true,
    };
  };

  it('should render home icon when not in a workspace', async () => {
    const props = getMockedProps();
    const { findByTestId, getByTestId } = render(<CollapsibleNavTop {...props} />);
    await findByTestId('collapsibleNavHome');
    fireEvent.click(getByTestId('collapsibleNavHome'));
    expect(props.navigateToApp).toBeCalledWith('home');
  });

  it('should render home icon when nav collapsed', async () => {
    const props = getMockedProps();
    const { findByTestId, getByTestId } = render(
      <CollapsibleNavTop {...props} isNavOpen={false} />
    );
    await findByTestId('collapsibleNavHome');
    fireEvent.click(getByTestId('collapsibleNavHome'));
    expect(props.navigateToApp).toBeCalledWith('home');
  });

  it('should render customized header render', async () => {
    const props = getMockedProps();
    const { findByTestId } = render(
      <CollapsibleNavTop
        {...props}
        collapsibleNavHeaderRender={() => <div data-test-subj="foo" />}
      />
    );
    await findByTestId('foo');
  });

  it('should render current nav group title if currentNavGroup present and nav open', async () => {
    const props = getMockedProps();
    const { findByText } = render(
      <CollapsibleNavTop
        {...props}
        currentNavGroup={{
          type: NavGroupType.SYSTEM,
          id: 'foo',
          title: 'foo',
          description: 'foo',
          navLinks: [],
        }}
      />
    );
    await findByText('foo');
  });

  it('should not render current nav group title if currentNavGroup present and nav collapsed', async () => {
    const props = getMockedProps();
    const { findByTestId, queryByText } = render(
      <CollapsibleNavTop
        {...props}
        currentNavGroup={{
          type: NavGroupType.SYSTEM,
          id: 'foo',
          title: 'foo',
          description: 'foo',
          navLinks: [],
        }}
        isNavOpen={false}
      />
    );
    await findByTestId('collapsibleNavHome');
    expect(queryByText('foo')).not.toBeInTheDocument();
  });
});
