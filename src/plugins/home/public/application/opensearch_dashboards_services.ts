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

import {
  ChromeStart,
  DocLinksStart,
  HttpStart,
  NotificationsSetup,
  OverlayStart,
  SavedObjectsClientContract,
  IUiSettingsClient,
  ApplicationStart,
} from 'opensearch-dashboards/public';
import { UiStatsMetricType } from '@osd/analytics';
import { TelemetryPluginStart } from '../../../telemetry/public';
import { UrlForwardingStart } from '../../../url_forwarding/public';
import { TutorialService } from '../services/tutorials';
import { FeatureCatalogueRegistry } from '../services/feature_catalogue';
import { EnvironmentService } from '../services/environment';
import { ConfigSchema } from '../../config';
import { HomePluginBranding } from '..';
import { DataSourcePluginStart } from '../../../data_source/public';

export interface HomeOpenSearchDashboardsServices {
  indexPatternService: any;
  opensearchDashboardsVersion: string;
  chrome: ChromeStart;
  application: ApplicationStart;
  uiSettings: IUiSettingsClient;
  urlForwarding: UrlForwardingStart;
  homeConfig: ConfigSchema;
  featureCatalogue: FeatureCatalogueRegistry;
  http: HttpStart;
  savedObjectsClient: SavedObjectsClientContract;
  toastNotifications: NotificationsSetup['toasts'];
  banners: OverlayStart['banners'];
  trackUiMetric: (type: UiStatsMetricType, eventNames: string | string[], count?: number) => void;
  getBasePath: () => string;
  docLinks: DocLinksStart;
  addBasePath: (url: string) => string;
  environmentService: EnvironmentService;
  telemetry?: TelemetryPluginStart;
  tutorialService: TutorialService;
  injectedMetadata: {
    getInjectedVar: (name: string, defaultValue?: any) => unknown;
    getBranding: () => HomePluginBranding;
  };
  dataSource?: DataSourcePluginStart;
}

let services: HomeOpenSearchDashboardsServices | null = null;

export function setServices(newServices: HomeOpenSearchDashboardsServices) {
  services = newServices;
}

export function getServices() {
  if (!services) {
    throw new Error(
      'OpenSearch Dashboards services not set - are you trying to import this module from outside of the home app?'
    );
  }
  return services;
}
