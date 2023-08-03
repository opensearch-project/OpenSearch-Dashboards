/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { I18nProvider } from '@osd/i18n/react';
import { i18n } from '@osd/i18n';
import { useOpenSearchDashboards } from '../../../opensearch_dashboards_react/public';
import { WorkspaceList } from './workspace_list';

export const WorkspaceListApp = () => {
  const {
    services: { chrome },
  } = useOpenSearchDashboards();

  /**
   * set breadcrumbs to chrome
   */
  useEffect(() => {
    chrome?.setBreadcrumbs([
      {
        text: i18n.translate('workspace.workspaceCreateTitle', {
          defaultMessage: 'Workspace Create',
        }),
      },
    ]);
  }, [chrome]);

  return (
    <I18nProvider>
      <WorkspaceList />
    </I18nProvider>
  );
};
