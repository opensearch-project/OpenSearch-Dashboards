/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import ReactDOM from 'react-dom';
import { I18nProvider } from '@osd/i18n/react';
import React from 'react';
import { EuiFlexGrid, EuiFlexItem, EuiPanel, EuiSpacer, EuiTitle } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { ApplicationStart, CoreStart } from '../../../core/public';
import { OverviewApp } from './overview_app';
import { OverviewCard } from './components/overview_card';

export interface ManagementOverviewProps {
  application: ApplicationStart;
  overviewApps?: OverviewApp[];
}

function ManagementOverviewWrapper(props: ManagementOverviewProps) {
  const { application, overviewApps } = props;

  const onClick = (appId: string) => {
    return (url: string) => {
      const pageUrl = application.getUrlForApp(appId, { path: url });
      application.navigateToUrl(pageUrl);
    };
  };

  const title = i18n.translate('core.ui.managementNavList.label', {
    defaultMessage: 'Management',
  });

  return (
    <EuiPanel style={{ padding: '20px' }}>
      <EuiTitle size="l">
        <h1>{title}</h1>
      </EuiTitle>
      <EuiSpacer />
      <EuiFlexGrid columns={3}>
        {overviewApps?.map((app) => (
          <EuiFlexItem key={app.title}>
            <OverviewCard title={app.title} pages={app.pages || []} onClick={onClick(app.id)} />
          </EuiFlexItem>
        ))}
      </EuiFlexGrid>
    </EuiPanel>
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
