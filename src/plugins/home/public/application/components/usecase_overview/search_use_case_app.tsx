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

interface Props {
  contentManagement: ContentManagementPluginStart;
}

export const SearchUseCaseOverviewApp = ({ contentManagement }: Props) => {
  const {
    services: { chrome },
  } = useOpenSearchDashboards<CoreStart>();

  const title = i18n.translate('home.searchOverview.title', { defaultMessage: 'Overview' });

  useEffect(() => {
    const breadcrumbs: EuiBreadcrumb[] = [
      {
        text: title,
      },
    ];
    chrome.setBreadcrumbs(breadcrumbs);
  }, [chrome, title]);

  return (
    <I18nProvider>
      {contentManagement ? contentManagement.renderPage(SEARCH_OVERVIEW_PAGE_ID) : null}
    </I18nProvider>
  );
};
