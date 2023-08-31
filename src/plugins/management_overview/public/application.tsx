/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import ReactDOM from 'react-dom';
import { I18nProvider, FormattedMessage } from '@osd/i18n/react';
import React, { useMemo } from 'react';
import { EuiFlexGrid, EuiFlexItem, EuiPage, EuiPageBody, EuiSpacer, EuiTitle } from '@elastic/eui';
import useObservable from 'react-use/lib/useObservable';
import { ApplicationStart, AppNavLinkStatus, CoreStart } from '../../../core/public';
import { OverviewApp } from '.';
import { OverviewCard } from './components/overview_card';

export interface ManagementOverviewProps {
  application: ApplicationStart;
  overviewApps?: OverviewApp[];
}

export function ManagementOverviewWrapper(props: ManagementOverviewProps) {
  const { application, overviewApps } = props;
  const applications = useObservable(application.applications$);

  const availableApps = useMemo(() => {
    return overviewApps?.filter((overviewApp) => {
      const app = applications?.get(overviewApp.id);
      return app && app.navLinkStatus !== AppNavLinkStatus.hidden;
    });
  }, [applications, overviewApps]);

  return (
    <EuiPage restrictWidth={1200}>
      <EuiPageBody component="main">
        <EuiTitle size="l">
          <h1>
            <FormattedMessage id="management.overview.overviewTitle" defaultMessage="Overview" />
          </h1>
        </EuiTitle>
        <EuiSpacer />
        <EuiFlexGrid columns={3}>
          {availableApps?.map((app) => (
            <EuiFlexItem key={app.id}>
              <OverviewCard
                {...app}
                onClick={() => {
                  application.navigateToApp(app.id);
                }}
              />
            </EuiFlexItem>
          ))}
        </EuiFlexGrid>
      </EuiPageBody>
    </EuiPage>
  );
}

export function renderApp(
  { application, chrome }: CoreStart,
  overviewApps: OverviewApp[],
  element: HTMLElement
) {
  ReactDOM.render(
    <I18nProvider>
      <ManagementOverviewWrapper application={application} overviewApps={overviewApps} />
    </I18nProvider>,
    element
  );

  return () => {
    chrome.docTitle.reset();
    ReactDOM.unmountComponentAtNode(element);
  };
}
