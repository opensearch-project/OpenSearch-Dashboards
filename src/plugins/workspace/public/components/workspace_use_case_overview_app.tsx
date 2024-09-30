/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { I18nProvider } from '@osd/i18n/react';
import { i18n } from '@osd/i18n';
import { useObservable } from 'react-use';
import { EuiBreadcrumb } from '@elastic/eui';
import { useOpenSearchDashboards } from '../../../opensearch_dashboards_react/public';
import { Services } from '../types';

interface WorkspaceUseCaseOverviewProps {
  pageId: string;
}

export const WorkspaceUseCaseOverviewApp = (props: WorkspaceUseCaseOverviewProps) => {
  const {
    services: { contentManagement, workspaces, chrome },
  } = useOpenSearchDashboards<Services>();

  const currentWorkspace = useObservable(workspaces.currentWorkspace$);

  useEffect(() => {
    const breadcrumbs: EuiBreadcrumb[] = [
      {
        text: i18n.translate('workspace.overview.title', { defaultMessage: 'Overview' }),
      },
    ];
    chrome.setBreadcrumbs(breadcrumbs);
  }, [chrome, currentWorkspace]);

  const pageId = props.pageId;

  return (
    <I18nProvider>{contentManagement ? contentManagement.renderPage(pageId) : null}</I18nProvider>
  );
};
