/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { I18nProvider } from '@osd/i18n/react';
import { useOpenSearchDashboards } from '../../../opensearch_dashboards_react/public';
import { Services } from '../types';

interface WorkspaceUseCaseOverviewProps {
  pageId: string;
}

export const WorkspaceUseCaseOverviewApp = (props: WorkspaceUseCaseOverviewProps) => {
  const {
    services: { contentManagement },
  } = useOpenSearchDashboards<Services>();

  const pageId = props.pageId;

  return (
    <I18nProvider>{contentManagement ? contentManagement.renderPage(pageId) : null}</I18nProvider>
  );
};
