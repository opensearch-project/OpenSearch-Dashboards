/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BehaviorSubject } from 'rxjs';
import { fireEvent, render } from '@testing-library/react';
import { StubBrowserStorage } from 'test_utils/stub_browser_storage';
import {
  CollapsibleNavGroupEnabled,
  CollapsibleNavGroupEnabledProps,
  NavGroups,
} from './collapsible_nav_group_enabled';
import { ChromeNavLink } from '../../nav_links';
import { ChromeRegistrationNavLink, NavGroupItemInMap } from '../../nav_group';
import { httpServiceMock } from '../../../mocks';
import { getLogos } from '../../../../common';
import { ALL_USE_CASE_ID, DEFAULT_NAV_GROUPS } from '../../../../public';
import { CollapsibleNavTopProps } from './collapsible_nav_group_enabled_top';
import { capabilitiesServiceMock } from '../../../application/capabilities/capabilities_service.mock';

jest.mock('./collapsible_nav_group_enabled_top', () => ({
  CollapsibleNavTop: (props: CollapsibleNavTopProps) => (
    <button data-test-subj="back" onClick={props.onClickBack}>
      go back
    </button>
  ),
}));

const mockBasePath = httpServiceMock.createSetupContract({ basePath: '/test' }).basePath;

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
        ]}
        navigateToApp={navigateToApp}
        onNavItemClick={onNavItemClick}
      />
    );
    expect(container).toMatchSnapshot();
    expect(container.querySelectorAll('.nav-link-item-btn').length).toEqual(5);
    fireEvent.click(getByTestId('collapsibleNavAppLink-pure'));
    expect(navigateToApp).toBeCalledTimes(0);
    // The accordion is collapsed
    expect(queryByTestId('collapsibleNavAppLink-subLink')).toBeNull();

    // Expand the accordion
    fireEvent.click(getByTestId('collapsibleNavAppLink-pure'));
    fireEvent.click(getByTestId('collapsibleNavAppLink-subLink'));
    expect(navigateToApp).toBeCalledWith('subLink');
  });
});

describe('<CollapsibleNavGroupEnabled />', () => {
  function mockProps(
    props?: Partial<CollapsibleNavGroupEnabledProps> & {
      navGroupsMap?: Record<string, NavGroupItemInMap>;
      currentNavGroupId?: string;
      navLinks?: ChromeNavLink[];
    }
  ): CollapsibleNavGroupEnabledProps {
    const navGroupsMap$ = new BehaviorSubject<Record<string, NavGroupItemInMap>>({
      [ALL_USE_CASE_ID]: {
        ...DEFAULT_NAV_GROUPS[ALL_USE_CASE_ID],
        navLinks: [
          {
            id: 'link-in-all',
            title: 'link-in-all',
          },
        ],
      },
      [DEFAULT_NAV_GROUPS.observability.id]: {
        ...DEFAULT_NAV_GROUPS.observability,
        navLinks: [
          {
            id: 'link-in-observability',
            title: 'link-in-observability',
            showInAllNavGroup: true,
          },
        ],
      },
      ...props?.navGroupsMap,
    });
    const currentNavGroup$ = new BehaviorSubject<NavGroupItemInMap | undefined>(
      props?.currentNavGroupId ? navGroupsMap$.getValue()[props.currentNavGroupId] : undefined
    );
    return {
      appId$: new BehaviorSubject('test'),
      basePath: mockBasePath,
      id: 'collapsibe-nav',
      isLocked: false,
      isNavOpen: false,
      navLinks$: new BehaviorSubject([
        {
          id: 'link-in-all',
          title: 'link-in-all',
          baseUrl: '',
          href: '',
        },
        {
          id: 'link-in-observability',
          title: 'link-in-observability',
          baseUrl: '',
          href: '',
        },
        {
          id: 'link-in-analytics',
          title: 'link-in-analytics',
          baseUrl: '',
          href: '',
        },
        ...(props?.navLinks || []),
      ]),
      storage: new StubBrowserStorage(),
      onIsLockedUpdate: () => {},
      closeNav: () => {},
      navigateToApp: () => Promise.resolve(),
      navigateToUrl: () => Promise.resolve(),
      customNavLink$: new BehaviorSubject(undefined),
      logos: getLogos({}, mockBasePath.serverBasePath),
      navGroupsMap$,
      navControlsLeftBottom$: new BehaviorSubject([]),
      currentNavGroup$,
      setCurrentNavGroup: (val: string | undefined) => {
        if (val) {
          const currentNavGroup = navGroupsMap$.getValue()[val];
          if (currentNavGroup) {
            currentNavGroup$.next(currentNavGroup);
          }
        } else {
          currentNavGroup$.next(undefined);
        }
      },
      capabilities: { ...capabilitiesServiceMock.createStartContract().capabilities },
      ...props,
    };
  }
  it('should render correctly', () => {
    const props = mockProps({
      isNavOpen: true,
      navGroupsMap: {
        [DEFAULT_NAV_GROUPS.analytics.id]: {
          ...DEFAULT_NAV_GROUPS.analytics,
          navLinks: [
            {
              id: 'link-in-analytics',
              title: 'link-in-analytics',
              showInAllNavGroup: true,
            },
          ],
        },
      },
    });
    const { container } = render(<CollapsibleNavGroupEnabled {...props} />);
    expect(container).toMatchSnapshot();
    const { container: isNavOpenCloseContainer } = render(
      <CollapsibleNavGroupEnabled {...props} isNavOpen={false} />
    );
    expect(isNavOpenCloseContainer).toMatchSnapshot();
  });

  it('should render correctly when only one visible use case is provided', () => {
    const props = mockProps();
    const { getAllByTestId } = render(<CollapsibleNavGroupEnabled {...props} isNavOpen />);
    expect(getAllByTestId('collapsibleNavAppLink-link-in-observability').length).toEqual(1);
  });

  it('should show all use case by default and able to click see all', async () => {
    const props = mockProps({
      navGroupsMap: {
        [DEFAULT_NAV_GROUPS.analytics.id]: {
          ...DEFAULT_NAV_GROUPS.analytics,
          navLinks: [
            {
              id: 'link-in-analytics',
              title: 'link-in-analytics',
              showInAllNavGroup: true,
            },
          ],
        },
      },
    });
    const { container, getAllByTestId, getByTestId } = render(
      <CollapsibleNavGroupEnabled {...props} isNavOpen />
    );
    fireEvent.click(getAllByTestId('collapsibleNavAppLink-link-in-analytics')[1]);
    expect(getAllByTestId('collapsibleNavAppLink-link-in-analytics').length).toEqual(1);
    expect(container).toMatchSnapshot();
    fireEvent.click(getByTestId('back'));
    expect(getAllByTestId('collapsibleNavAppLink-link-in-analytics').length).toEqual(2);
  });

  it('should show all use case when current nav group is `all`', async () => {
    const props = mockProps({
      currentNavGroupId: ALL_USE_CASE_ID,
      navGroupsMap: {
        [DEFAULT_NAV_GROUPS.analytics.id]: {
          ...DEFAULT_NAV_GROUPS.analytics,
          navLinks: [
            {
              id: 'link-in-analytics',
              title: 'link-in-analytics',
              showInAllNavGroup: true,
            },
          ],
        },
      },
    });
    const { container, getAllByTestId, getByTestId } = render(
      <CollapsibleNavGroupEnabled {...props} isNavOpen />
    );
    fireEvent.click(getAllByTestId('collapsibleNavAppLink-link-in-analytics')[1]);
    expect(getAllByTestId('collapsibleNavAppLink-link-in-analytics').length).toEqual(1);
    expect(container).toMatchSnapshot();
    fireEvent.click(getByTestId('back'));
    expect(getAllByTestId('collapsibleNavAppLink-link-in-analytics').length).toEqual(2);
  });

  it('should not show group if the nav link is hidden', async () => {
    const props = mockProps({
      currentNavGroupId: ALL_USE_CASE_ID,
      navGroupsMap: {
        [DEFAULT_NAV_GROUPS.analytics.id]: {
          ...DEFAULT_NAV_GROUPS.analytics,
          navLinks: [
            {
              id: 'link-in-analytics-but-hidden',
              title: 'link-in-analytics-but-hidden',
              showInAllNavGroup: true,
            },
          ],
        },
      },
      navLinks: [
        {
          id: 'link-in-analytics-but-hidden',
          hidden: true,
          title: 'link-in-analytics-but-hidden',
          baseUrl: '',
          href: '',
        },
      ],
    });
    const { queryAllByTestId } = render(<CollapsibleNavGroupEnabled {...props} isNavOpen />);
    expect(queryAllByTestId('collapsibleNavAppLink-link-in-analytics-but-hidden').length).toEqual(
      0
    );
    expect(queryAllByTestId('collapsibleNavAppLink-link-in-all').length).toEqual(1);
  });
});
