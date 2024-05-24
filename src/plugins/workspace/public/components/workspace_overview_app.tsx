/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { I18nProvider } from '@osd/i18n/react';
import { CoreStart } from 'opensearch-dashboards/public';
import { useObservable } from 'react-use';
import { EuiBreadcrumb } from '@elastic/eui';
import { useOpenSearchDashboards } from '../../../opensearch_dashboards_react/public';
import { WorkspaceOverview, WorkspaceOverviewProps } from './workspace_overview/workspace_overview';

export const WorkspaceOverviewApp = (props: WorkspaceOverviewProps) => {
  const {
    services: { workspaces, chrome, application },
  } = useOpenSearchDashboards<CoreStart>();

  const currentWorkspace = useObservable(workspaces.currentWorkspace$);

  /**
   * set breadcrumbs to chrome
   */
  useEffect(() => {
    const breadcrumbs: EuiBreadcrumb[] = [
      {
        text: 'Home',
        onClick: () => {
          application.navigateToApp('home');
        },
      },
    ];
    if (currentWorkspace) {
      breadcrumbs.push({
        text: currentWorkspace.name,
      });
    }
    chrome?.setBreadcrumbs(breadcrumbs);
  }, [chrome, currentWorkspace, application]);

  return (
    <I18nProvider>
      <WorkspaceOverview {...props} />
    </I18nProvider>
  );
};
