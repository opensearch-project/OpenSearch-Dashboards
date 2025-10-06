/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { I18nProvider } from '@osd/i18n/react';
import { i18n } from '@osd/i18n';
import { useOpenSearchDashboards } from '../../../opensearch_dashboards_react/public';
import { WorkspaceList, WorkspaceListProps } from './workspace_list';

export type WorkspaceListAppProps = WorkspaceListProps;

export const WorkspaceListApp = (props: WorkspaceListAppProps) => {
  const {
    services: { chrome },
  } = useOpenSearchDashboards();

  /**
   * set breadcrumbs to chrome
   */
  useEffect(() => {
    chrome?.setBreadcrumbs([
      {
        text: i18n.translate('workspace.workspaceListTitle', {
          defaultMessage: 'Workspaces',
        }),
      },
    ]);
  }, [chrome]);

  return (
    <I18nProvider>
      <WorkspaceList {...props} />
    </I18nProvider>
  );
};
