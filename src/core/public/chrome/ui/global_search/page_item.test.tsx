/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render } from '@testing-library/react';
import { GlobalSearchPageItem } from './page_item';
import {
  ChromeNavLink,
  ChromeRegistrationNavLink,
  NavGroupItemInMap,
} from 'opensearch-dashboards/public';

import { NavGroupType } from '../../../../../core/public';

describe('PageItem', () => {
  const currentWorkspace = {
    id: 'foo',
    name: 'Workspace 1',
  };

  const link = {
    id: 'appId',
    title: 'App 1',
    navGroup: {
      title: 'Essential',
      type: undefined,
      description: '',
    },
    category: {
      id: 'observability',
      label: 'Observability',
    },
  } as ChromeRegistrationNavLink & ChromeNavLink & { navGroup: NavGroupItemInMap };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the page item correctly', () => {
    const { getByText } = render(<GlobalSearchPageItem link={link} search="abc" />);

    expect(getByText('App 1')).toBeInTheDocument();
  });

  it('renders the page item with parent link correctly', () => {
    const linkWithParentLink = {
      ...link,
      parentNavLinkId: 'settings',
      navGroup: {
        id: 'admin',
        description: '',
        title: 'Data administration',
        type: NavGroupType.SYSTEM,
        navLinks: [
          {
            id: 'settings',
            description: '',
            title: 'Settings',
            type: NavGroupType.SYSTEM,
          },
        ],
      },
    };
    const { getByText } = render(<GlobalSearchPageItem link={linkWithParentLink} search="abc" />);

    expect(getByText('Settings')).toBeInTheDocument();
    expect(getByText('App 1')).toBeInTheDocument();
  });

  it('renders the page item correctly for non workspace pages', () => {
    const settingsLink = {
      ...link,
      navGroup: {
        id: 'settings',
        title: 'Settings',
        description: 'Settings',
        type: NavGroupType.SYSTEM,
        navLinks: [],
      },
    };
    const { getByText } = render(
      <GlobalSearchPageItem
        link={settingsLink}
        search="abc"
        renderBreadcrumbs={(breadcrumbs) => {
          breadcrumbs.push({ text: <>{settingsLink.navGroup.title}</> });
          return breadcrumbs;
        }}
      />
    );

    // workspace name and link title
    expect(getByText('Settings')).toBeInTheDocument();
    expect(getByText('App 1')).toBeInTheDocument();
  });

  it('renders the page item correctly for non workspace landing page', () => {
    const settingsLink = {
      ...link,
      navGroup: {
        id: 'settings',
        title: 'Settings',
        description: 'Settings',
        type: NavGroupType.SYSTEM,
        navLinks: [],
      },
      id: 'app_landing',
      title: 'Overview',
    };

    const { getByText } = render(
      <GlobalSearchPageItem
        link={settingsLink}
        search="abc"
        renderBreadcrumbs={(breadcrumbs) => {
          breadcrumbs.push({ text: <>{settingsLink.navGroup.title}</> });
          return breadcrumbs;
        }}
      />
    );

    // nav group title and page title
    expect(getByText('Settings')).toBeInTheDocument();
    expect(getByText('Settings Overview')).toBeInTheDocument();
  });

  it('renders the page item correctly for non workspace overview page', () => {
    const settingsLink = {
      ...link,
      category: { label: 'Security Analytics', id: 'sa' },
      id: 'sa_overview',
      title: 'Overview',
    };

    const { getByText } = render(
      <GlobalSearchPageItem
        link={settingsLink}
        search="abc"
        renderBreadcrumbs={(breadcrumbs) => {
          breadcrumbs.push({ text: <>{currentWorkspace.name}</> });
          return breadcrumbs;
        }}
      />
    );

    // workspace name and link title
    expect(getByText('Workspace 1')).toBeInTheDocument();
    expect(getByText('Security Analytics')).toBeInTheDocument();
    expect(getByText('Overview')).toBeInTheDocument();
  });
});
