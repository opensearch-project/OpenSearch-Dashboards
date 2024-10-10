/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// this is jest test file for page_item.tsx
import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { GlobalSearchPageItem } from './page_item';
import { coreMock } from '../../../../../core/public/mocks';
import { BehaviorSubject } from 'rxjs';
import { WorkspaceUseCase } from '../../types';
import {
  ChromeNavGroup,
  ChromeNavLink,
  ChromeRegistrationNavLink,
} from 'opensearch-dashboards/public';

import { NavGroupType } from '../../../../../core/public';

describe('PageItem', () => {
  const currentWorkspace = {
    id: '1',
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
  } as ChromeRegistrationNavLink & ChromeNavLink & { navGroup: ChromeNavGroup };

  const coreStartMock = coreMock.createStart();
  const { application } = coreStartMock;

  const registeredUseCases = new BehaviorSubject([
    {
      id: 'foo',
      title: 'Foo',
      features: [{ id: 'system-feature', title: 'System feature' }],
      systematic: true,
      description: '',
    } as WorkspaceUseCase,
  ]);

  it('renders the page item correctly', () => {
    const { getByText } = render(
      <GlobalSearchPageItem
        currentWorkspace={currentWorkspace}
        link={link}
        application={application}
        registeredUseCases$={registeredUseCases}
        search="abc"
      />
    );

    // workspace name and link title
    expect(getByText('Workspace 1')).toBeInTheDocument();
    expect(getByText('App 1')).toBeInTheDocument();
  });

  it('renders the page item correctly for non workspace pages', () => {
    const settingsLink = {
      ...link,
      navGroup: {
        title: 'Settings',
        type: NavGroupType.SYSTEM,
      },
    };
    const { getByText } = render(
      <GlobalSearchPageItem
        currentWorkspace={currentWorkspace}
        link={settingsLink}
        application={application}
        registeredUseCases$={registeredUseCases}
        search="abc"
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
        title: 'Settings',
        type: NavGroupType.SYSTEM,
      },
      id: 'app_landing',
      title: 'Overview',
    };

    const { getByText } = render(
      <GlobalSearchPageItem
        currentWorkspace={currentWorkspace}
        link={settingsLink}
        application={application}
        registeredUseCases$={registeredUseCases}
        search="abc"
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
        currentWorkspace={currentWorkspace}
        link={settingsLink}
        application={application}
        registeredUseCases$={registeredUseCases}
        search="abc"
      />
    );

    // workspace name and link title
    expect(getByText('Workspace 1')).toBeInTheDocument();
    expect(getByText('Security Analytics')).toBeInTheDocument();
    expect(getByText('Overview')).toBeInTheDocument();
  });

  it('click on the item will navigate to corresponding page', () => {
    const settingsLink = {
      ...link,
      category: { label: 'Security Analytics', id: 'sa' },
      id: 'sa_overview',
      title: 'Overview',
    };

    const callbackFn = jest.fn();

    const { getByText, getByTestId } = render(
      <GlobalSearchPageItem
        currentWorkspace={currentWorkspace}
        link={settingsLink}
        application={application}
        registeredUseCases$={registeredUseCases}
        search="abc"
        callback={callbackFn}
      />
    );

    // workspace name and link title
    expect(getByText('Workspace 1')).toBeInTheDocument();
    expect(getByText('Security Analytics')).toBeInTheDocument();
    expect(getByText('Overview')).toBeInTheDocument();

    fireEvent.click(getByTestId('global-search-item-sa_overview'));
    expect(application.navigateToApp).toBeCalledWith('sa_overview');
    expect(callbackFn).toBeCalled();
  });
});
