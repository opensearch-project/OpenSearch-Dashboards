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
import { SEARCH_USE_CASE_ID } from '../../../../../../core/public';

interface Props {
  contentManagement: ContentManagementPluginStart;
}

export const SearchUseCaseOverviewApp = ({ contentManagement }: Props) => {
  const {
    services: { chrome },
  } = useOpenSearchDashboards<CoreStart>();

  const currentNavGroup = useObservable(chrome.navGroup.getCurrentNavGroup$());
  const isSearchUseCase = currentNavGroup?.id === SEARCH_USE_CASE_ID;

  useEffect(() => {
    const title = i18n.translate('home.searchOverview.title', { defaultMessage: 'Overview' });
    const titleWithUseCase = i18n.translate('home.searchOverview.titleWithUseCase', {
      defaultMessage: 'Search Overview',
    });

    /**
     * There have three cases for the page title:
     * 1. Search workspace which currentNavGroup is Search, then the page title is "Overview" as workspace name has the use case information
     * 2. Analytics(All) workspace which currentNavGroup is All, then the page title is "Search Overview" to differentiate with other overview pages like Observability/Security Analytics
     * 3. workspace is disable, the currentNavGroup is undefined or All, then the page title is "Search Overview" to indicate this overview page is for search
     */
    const breadcrumbs: EuiBreadcrumb[] = [
      {
        text: isSearchUseCase ? title : titleWithUseCase,
      },
    ];
    chrome.setBreadcrumbs(breadcrumbs);
  }, [chrome, isSearchUseCase]);

  return (
    <I18nProvider>
      {contentManagement ? contentManagement.renderPage(SEARCH_OVERVIEW_PAGE_ID) : null}
    </I18nProvider>
  );
};
