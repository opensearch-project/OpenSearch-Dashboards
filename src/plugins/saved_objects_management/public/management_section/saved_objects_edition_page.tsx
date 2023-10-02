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

import React, { useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { parse } from 'query-string';
import { i18n } from '@osd/i18n';
import { CoreStart, ChromeBreadcrumb, ScopedHistory } from 'src/core/public';
import { UiActionsStart } from 'src/plugins/ui_actions/public';
import { ISavedObjectsManagementServiceRegistry } from '../services';
import { SavedObjectEdition } from './object_view';

const SavedObjectsEditionPage = ({
  coreStart,
  uiActionsStart,
  serviceRegistry,
  setBreadcrumbs,
  history,
}: {
  coreStart: CoreStart;
  uiActionsStart: UiActionsStart;
  serviceRegistry: ISavedObjectsManagementServiceRegistry;
  setBreadcrumbs: (crumbs: ChromeBreadcrumb[]) => void;
  history: ScopedHistory;
}) => {
  const { service: serviceName, id } = useParams<{ service: string; id: string }>();
  const capabilities = coreStart.application.capabilities;

  const { search } = useLocation();
  const query = parse(search);
  const service = serviceRegistry.get(serviceName);

  useEffect(() => {
    setBreadcrumbs([
      {
        text: i18n.translate('savedObjectsManagement.breadcrumb.index', {
          defaultMessage: 'Saved objects',
        }),
        href: '/',
      },
      {
        text: i18n.translate('savedObjectsManagement.breadcrumb.edit', {
          defaultMessage: 'Edit {savedObjectType}',
          values: { savedObjectType: service?.service.type ?? 'object' },
        }),
      },
    ]);
  }, [setBreadcrumbs, service]);

  return (
    <SavedObjectEdition
      id={id}
      serviceName={serviceName}
      serviceRegistry={serviceRegistry}
      savedObjectsClient={coreStart.savedObjects.client}
      overlays={coreStart.overlays}
      notifications={coreStart.notifications}
      uiActions={uiActionsStart}
      capabilities={capabilities}
      notFoundType={query.notFound as string}
      history={history}
    />
  );
};

// eslint-disable-next-line import/no-default-export
export { SavedObjectsEditionPage as default };
