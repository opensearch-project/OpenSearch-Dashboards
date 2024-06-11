/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render } from '@testing-library/react';
import { ManagementOverviewWrapper } from './application';
import React from 'react';
import { ApplicationStart, PublicAppInfo } from 'opensearch-dashboards/public';
import { BehaviorSubject, Subject } from 'rxjs';
import { deepFreeze } from '@osd/std';
import { OverviewApp } from './overview_app';
import { AppNavLinkStatus, AppStatus } from '../../../core/public';

const applicationStartMock = (apps: Map<string, PublicAppInfo>): jest.Mocked<ApplicationStart> => {
  const currentAppId$ = new Subject<string | undefined>();

  return {
    applications$: new BehaviorSubject<Map<string, PublicAppInfo>>(apps),
    currentAppId$: currentAppId$.asObservable(),
    capabilities: deepFreeze({
      catalogue: {},
      management: {},
      navLinks: {},
    }),
    navigateToApp: jest.fn(),
    navigateToUrl: jest.fn(),
    getUrlForApp: jest.fn(),
    registerMountContext: jest.fn(),
  };
};

function renderOverviewPage(apps: Map<string, PublicAppInfo>, overviewApps?: OverviewApp[]) {
  return render(
    <ManagementOverviewWrapper
      application={applicationStartMock(apps)}
      overviewApps={overviewApps}
    />
  );
}

describe('Overview page rendering', () => {
  it('should render normally', () => {
    const overviewApps: OverviewApp[] = [
      {
        id: 'dev_tools',
        title: 'Dev Tools',
        description: 'dev tools description',
        order: 0,
      },
    ];

    const apps: Map<string, PublicAppInfo> = new Map<string, PublicAppInfo>();
    apps.set('dev_tools', {
      status: AppStatus.accessible,
      navLinkStatus: AppNavLinkStatus.default,
      appRoute: '/app/console',
    } as PublicAppInfo);
    const { container, queryByText } = renderOverviewPage(apps, overviewApps);
    expect(container.firstChild).toMatchSnapshot();
    expect(queryByText('Dev Tools')).not.toBeNull();
  });

  it('should render normally when no overview app', () => {
    const { queryByText } = renderOverviewPage(new Map<string, PublicAppInfo>());
    expect(queryByText('Overview')).not.toBeNull();
  });

  it('should render normally when no application available', () => {
    const overviewApps: OverviewApp[] = [
      {
        id: 'dev_tools',
        title: 'Dev Tools',
        description: 'dev tools description',
        order: 0,
      },
    ];
    const { queryByText } = renderOverviewPage(new Map<string, PublicAppInfo>(), overviewApps);
    expect(queryByText('Dev Tools')).toBeNull();
  });

  it('should not display overview app when nav link status is hidden', () => {
    const overviewApps: OverviewApp[] = [
      {
        id: 'dev_tools',
        title: 'Dev Tools',
        description: 'dev tools description',
        order: 0,
      },
    ];

    const apps: Map<string, PublicAppInfo> = new Map<string, PublicAppInfo>();
    apps.set('dev_tools', {
      status: AppStatus.accessible,
      navLinkStatus: AppNavLinkStatus.hidden,
      appRoute: '/app/console',
    } as PublicAppInfo);
    const { queryByText } = renderOverviewPage(apps, overviewApps);
    expect(queryByText('Dev Tools')).toBeNull();
  });

  it('should not display overview app when it is invalid app', () => {
    const overviewApps: OverviewApp[] = [
      {
        id: 'invalid_app_id',
        title: 'Dev Tools',
        description: 'dev tools description',
        order: 0,
      },
    ];

    const apps: Map<string, PublicAppInfo> = new Map<string, PublicAppInfo>();
    apps.set('dev_tools', {
      status: AppStatus.accessible,
      navLinkStatus: AppNavLinkStatus.hidden,
      appRoute: '/app/console',
    } as PublicAppInfo);
    const { queryByText } = renderOverviewPage(apps, overviewApps);
    expect(queryByText('Dev Tools')).toBeNull();
  });
});
