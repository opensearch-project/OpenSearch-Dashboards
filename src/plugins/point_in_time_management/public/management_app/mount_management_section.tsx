/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { I18nProvider } from '@osd/i18n/react';
import { ManagementAppMountParams } from '../../../management/public';
import { PointInTimeManagementStartDependencies } from '../plugin';
import { StartServicesAccessor } from '../../../../core/public';
import { PointInTimeManagementContext } from '../types';
import { OpenSearchDashboardsContextProvider } from '../../../opensearch_dashboards_react/public';
import { EmptyState } from '../components/empty_state';

export async function mountManagementSection(
  getStartServices: StartServicesAccessor<PointInTimeManagementStartDependencies>,
  params: ManagementAppMountParams
) {
  const [{ chrome, application }] = await getStartServices();
  const deps: PointInTimeManagementContext = {
    chrome,
    application,
  };
  ReactDOM.render(
    <OpenSearchDashboardsContextProvider services={deps}>
      <I18nProvider>
        <EmptyState />
      </I18nProvider>
    </OpenSearchDashboardsContextProvider>,
    params.element
  );

  return () => {
    chrome.docTitle.reset();
    ReactDOM.unmountComponentAtNode(params.element);
  };
}
