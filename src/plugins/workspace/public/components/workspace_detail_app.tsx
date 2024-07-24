/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { I18nProvider } from '@osd/i18n/react';
import { i18n } from '@osd/i18n';
import { CoreStart } from 'opensearch-dashboards/public';
import { useObservable } from 'react-use';
import { EuiBreadcrumb } from '@elastic/eui';
import { useOpenSearchDashboards } from '../../../opensearch_dashboards_react/public';
import { WorkspaceDetail, WorkspaceDetailProps } from './workspace_detail/workspace_detail';

export const WorkspaceDetailApp = (props: WorkspaceDetailProps) => {
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
      breadcrumbs.push({
        text: i18n.translate('workspace.detail.breadcrumb', { defaultMessage: 'Workspace Detail' }),
      });
    }
    chrome?.setBreadcrumbs(breadcrumbs);
  }, [chrome, currentWorkspace, application]);

  return (
    <I18nProvider>
      <WorkspaceDetail {...props} />
    </I18nProvider>
  );
};
