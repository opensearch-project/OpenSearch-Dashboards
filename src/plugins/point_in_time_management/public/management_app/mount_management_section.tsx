/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
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
