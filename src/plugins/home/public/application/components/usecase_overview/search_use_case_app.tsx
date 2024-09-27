/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { useObservable } from 'react-use';
import { CoreStart } from 'opensearch-dashboards/public';
import { EuiBreadcrumb } from '@elastic/eui';
import { I18nProvider } from '@osd/i18n/react';
import { i18n } from '@osd/i18n';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import {
  ContentManagementPluginStart,
  SEARCH_OVERVIEW_PAGE_ID,
} from '../../../../../content_management/public';
import { ALL_USE_CASE_ID } from '../../../../../../core/public';

interface Props {
  contentManagement: ContentManagementPluginStart;
}

export const SearchUseCaseOverviewApp = ({ contentManagement }: Props) => {
  const {
    services: { chrome },
  } = useOpenSearchDashboards<CoreStart>();

  const currentNavGroup = useObservable(chrome.navGroup.getCurrentNavGroup$());
  const isAllUseCase = currentNavGroup?.id === ALL_USE_CASE_ID;

  useEffect(() => {
    const title = i18n.translate('home.searchOverview.title', { defaultMessage: 'Overview' });
    const titleWithUseCase = i18n.translate('home.searchOverview.titleWithUseCase', {
      defaultMessage: 'Search Overview',
    });
    const breadcrumbs: EuiBreadcrumb[] = [
      {
        text: isAllUseCase ? titleWithUseCase : title,
      },
    ];
    chrome.setBreadcrumbs(breadcrumbs);
  }, [chrome, isAllUseCase]);

  return (
    <I18nProvider>
      {contentManagement ? contentManagement.renderPage(SEARCH_OVERVIEW_PAGE_ID) : null}
    </I18nProvider>
  );
};
