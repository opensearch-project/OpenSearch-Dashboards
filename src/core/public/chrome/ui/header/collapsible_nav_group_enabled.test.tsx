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
} from './collapsible_nav_group_enabled';
import { ChromeNavLink } from '../../nav_links';
import { NavGroupItemInMap } from '../../nav_group';
import { httpServiceMock } from '../../../mocks';
import { getLogos } from '../../../../common';
import {
  ALL_USE_CASE_ID,
  DEFAULT_APP_CATEGORIES,
  DEFAULT_NAV_GROUPS,
  WorkspaceObject,
} from '../../../../public';
import { capabilitiesServiceMock } from '../../../application/capabilities/capabilities_service.mock';

jest.mock('./collapsible_nav_group_enabled_top', () => ({
  CollapsibleNavTop: () => <button data-test-subj="back">go back</button>,
}));

const mockBasePath = httpServiceMock.createSetupContract({ basePath: '/test' }).basePath;

const defaultNavGroupMap = {
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
      },
    ],
  },
};

describe('<CollapsibleNavGroupEnabled />', () => {
  function mockProps(
    props?: Partial<CollapsibleNavGroupEnabledProps> & {
      navGroupsMap?: Record<string, NavGroupItemInMap>;
      currentNavGroupId?: string;
      navLinks?: ChromeNavLink[];
    }
  ): CollapsibleNavGroupEnabledProps {
    const navGroupsMap$ = new BehaviorSubject<Record<string, NavGroupItemInMap>>(
      props?.navGroupsMap || defaultNavGroupMap
    );
    const currentNavGroup$ = new BehaviorSubject<NavGroupItemInMap | undefined>(
      props?.currentNavGroupId ? navGroupsMap$.getValue()[props.currentNavGroupId] : undefined
    );
    return {
      appId$: new BehaviorSubject('test'),
      basePath: mockBasePath,
      id: 'collapsibe-nav',
      isNavOpen: false,
      currentWorkspace$: new BehaviorSubject<WorkspaceObject | null>({ id: 'test', name: 'test' }),
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
          id: 'link-in-essentials',
          title: 'link-in-essentials',
          baseUrl: '',
          href: '',
        },
        ...(props?.navLinks || []),
      ]),
      storage: new StubBrowserStorage(),
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
        ...defaultNavGroupMap,
        [DEFAULT_NAV_GROUPS.essentials.id]: {
          ...DEFAULT_NAV_GROUPS.essentials,
          navLinks: [
            {
              id: 'link-in-essentials',
              title: 'link-in-essentials',
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
    const props = mockProps({
      navGroupsMap: {
        [DEFAULT_NAV_GROUPS.observability.id]:
          defaultNavGroupMap[DEFAULT_NAV_GROUPS.observability.id],
      },
    });
    const { getAllByTestId } = render(<CollapsibleNavGroupEnabled {...props} isNavOpen />);
    expect(getAllByTestId('collapsibleNavAppLink-link-in-observability').length).toEqual(1);
  });

  it('should show use case nav when current nav group is valid', async () => {
    const props = mockProps({
      currentNavGroupId: ALL_USE_CASE_ID,
      navGroupsMap: defaultNavGroupMap,
    });
    const { container, getAllByTestId } = render(
      <CollapsibleNavGroupEnabled {...props} isNavOpen />
    );
    fireEvent.click(getAllByTestId('collapsibleNavAppLink-link-in-all')[0]);
    expect(getAllByTestId('collapsibleNavAppLink-link-in-all').length).toEqual(1);
    expect(container).toMatchSnapshot();
  });

  it('should not show group if the nav link is hidden', async () => {
    const props = mockProps({
      currentNavGroupId: ALL_USE_CASE_ID,
      navGroupsMap: {
        ...defaultNavGroupMap,
        [DEFAULT_NAV_GROUPS.essentials.id]: {
          ...DEFAULT_NAV_GROUPS.essentials,
          navLinks: [
            {
              id: 'link-in-essentials-but-hidden',
              title: 'link-in-essentials-but-hidden',
            },
          ],
        },
      },
      navLinks: [
        {
          id: 'link-in-essentials-but-hidden',
          hidden: true,
          title: 'link-in-essentials-but-hidden',
          baseUrl: '',
          href: '',
        },
      ],
    });
    const { queryAllByTestId } = render(<CollapsibleNavGroupEnabled {...props} isNavOpen />);
    expect(queryAllByTestId('collapsibleNavAppLink-link-in-essentials-but-hidden').length).toEqual(
      0
    );
    expect(queryAllByTestId('collapsibleNavAppLink-link-in-all').length).toEqual(1);
  });

  it('should render manage category when in all use case if workspace disabled', () => {
    const props = mockProps({
      currentNavGroupId: ALL_USE_CASE_ID,
      navGroupsMap: {
        ...defaultNavGroupMap,
        [DEFAULT_NAV_GROUPS.dataAdministration.id]: {
          ...DEFAULT_NAV_GROUPS.dataAdministration,
          navLinks: [
            {
              id: 'link-in-dataAdministration',
              title: 'link-in-dataAdministration',
            },
          ],
        },
      },
      navLinks: [
        {
          id: 'link-in-dataAdministration',
          title: 'link-in-dataAdministration',
          baseUrl: '',
          href: '',
        },
      ],
    });
    const { getByText } = render(<CollapsibleNavGroupEnabled {...props} isNavOpen />);
    // Should render manage category
    expect(getByText(DEFAULT_APP_CATEGORIES.manage.label)).toBeInTheDocument();
  });
});
