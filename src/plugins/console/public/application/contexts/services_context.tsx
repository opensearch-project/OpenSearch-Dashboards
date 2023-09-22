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

import React, { createContext, useContext, useEffect } from 'react';
import { HttpSetup, IUiSettingsClient, NotificationsSetup } from 'opensearch-dashboards/public';
import { History, Settings, Storage } from '../../services';
import { ObjectStorageClient } from '../../../common/types';
import { MetricsTracker } from '../../types';
import { OpenSearchHostService } from '../lib';

interface ContextServices {
  history: History;
  storage: Storage;
  settings: Settings;
  notifications: NotificationsSetup;
  objectStorageClient: ObjectStorageClient;
  trackUiMetric: MetricsTracker;
  opensearchHostService: OpenSearchHostService;
  http: HttpSetup;
  uiSettings: IUiSettingsClient;
}

export interface ContextValue {
  services: ContextServices;
  docLinkVersion: string;
}

interface ContextProps {
  value: ContextValue;
  children: any;
}

const ServicesContext = createContext<ContextValue>(null as any);

export function ServicesContextProvider({ children, value }: ContextProps) {
  useEffect(() => {
    // Fire and forget, we attempt to init the host service once.
    value.services.opensearchHostService.init();
  }, [value.services.opensearchHostService]);

  return <ServicesContext.Provider value={value}>{children}</ServicesContext.Provider>;
}

export const useServicesContext = () => {
  const context = useContext(ServicesContext);
  if (context === undefined) {
    throw new Error('useServicesContext must be used inside the ServicesContextProvider.');
  }
  return context;
};
