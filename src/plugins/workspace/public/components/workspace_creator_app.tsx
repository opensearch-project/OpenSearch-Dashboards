/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { I18nProvider } from '@osd/i18n/react';
import { i18n } from '@osd/i18n';
import { useOpenSearchDashboards } from '../../../opensearch_dashboards_react/public';
import { WorkspaceCreator } from './workspace_creator';
import { WorkspaceCreatorProps } from './workspace_creator/workspace_creator';

export const WorkspaceCreatorApp = (props: WorkspaceCreatorProps) => {
  const {
    services: { chrome, application },
  } = useOpenSearchDashboards();

  /**
   * set breadcrumbs to chrome
   */
  useEffect(() => {
    const homeBreadcrumb = {
      text: i18n.translate('workspace.breadcrumbs.homeTitle', { defaultMessage: 'Home' }),
      onClick: () => {
        application?.navigateToApp('home');
      },
    };
    chrome?.setBreadcrumbs([
      homeBreadcrumb,
      {
        text: i18n.translate('workspace.workspaceCreateTitle', {
          defaultMessage: 'Create a workspace',
        }),
      },
    ]);
  }, [chrome, application]);

  return (
    <I18nProvider>
      <WorkspaceCreator {...props} />
    </I18nProvider>
  );
};
