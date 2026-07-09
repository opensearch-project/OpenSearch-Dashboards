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
  LegacyAPICaller,
  Logger,
  OpenSearchDashboardsRequest,
  ILegacyClusterClient,
  IClusterClient,
} from 'opensearch-dashboards/server';
import { UsageCollectionSetup } from 'src/plugins/usage_collection/server';
import { OpenSearchClient } from '../../../../src/core/server';
import { TelemetryCollectionManagerPlugin } from './plugin';

export interface TelemetryCollectionManagerPluginSetup {
  setCollection: <CustomContext extends Record<string, any>, T extends BasicStatsPayload>(
    collectionConfig: CollectionConfig<CustomContext, T>
  ) => void;
  getOptInStats: TelemetryCollectionManagerPlugin['getOptInStats'];
  getStats: TelemetryCollectionManagerPlugin['getStats'];
  areAllCollectorsReady: TelemetryCollectionManagerPlugin['areAllCollectorsReady'];
}

export interface TelemetryCollectionManagerPluginStart {
  setCollection: <CustomContext extends Record<string, any>, T extends BasicStatsPayload>(
    collectionConfig: CollectionConfig<CustomContext, T>
  ) => void;
  getOptInStats: TelemetryCollectionManagerPlugin['getOptInStats'];
  getStats: TelemetryCollectionManagerPlugin['getStats'];
  areAllCollectorsReady: TelemetryCollectionManagerPlugin['areAllCollectorsReady'];
}

export interface TelemetryOptInStats {
  cluster_uuid: string;
  opt_in_status: boolean;
}

export interface BaseStatsGetterConfig {
  unencrypted: boolean;
  start: string;
  end: string;
  request?: OpenSearchDashboardsRequest;
}

export interface EncryptedStatsGetterConfig extends BaseStatsGetterConfig {
  unencrypted: false;
}

export interface UnencryptedStatsGetterConfig extends BaseStatsGetterConfig {
  unencrypted: true;
  request: OpenSearchDashboardsRequest;
}

export interface ClusterDetails {
  clusterUuid: string;
}

export interface StatsCollectionConfig {
  usageCollection: UsageCollectionSetup;
  callCluster: LegacyAPICaller;
  start: string | number;
  end: string | number;
  opensearchClient: OpenSearchClient;
}

export interface BasicStatsPayload {
  timestamp: string;
  cluster_uuid: string;
  cluster_name: string;
  version: string;
  cluster_stats: object;
  collection?: string;
  stack_stats: object;
}

export interface UsageStatsPayload extends BasicStatsPayload {
  license?: OpenSearchLicense;
  collectionSource: string;
}

// From https://opensearch.org/docs/latest/#get-involved
export interface OpenSearchLicense {
  status: string;
  uid: string;
  type: string;
  issue_date: string;
  issue_date_in_millis: number;
  expiry_date: string;
  expirty_date_in_millis: number;
  max_nodes: number;
  issued_to: string;
  issuer: string;
  start_date_in_millis: number;
}

export interface StatsCollectionContext {
  logger: Logger | Console;
  version: string;
}

export type StatsGetterConfig = UnencryptedStatsGetterConfig | EncryptedStatsGetterConfig;
export type ClusterDetailsGetter<CustomContext extends Record<string, any> = {}> = (
  config: StatsCollectionConfig,
  context: StatsCollectionContext & CustomContext
) => Promise<ClusterDetails[]>;
export type StatsGetter<
  CustomContext extends Record<string, any> = {},
  T extends BasicStatsPayload = BasicStatsPayload
> = (
  clustersDetails: ClusterDetails[],
  config: StatsCollectionConfig,
  context: StatsCollectionContext & CustomContext
) => Promise<T[]>;
export type LicenseGetter<CustomContext extends Record<string, any> = {}> = (
  clustersDetails: ClusterDetails[],
  config: StatsCollectionConfig,
  context: StatsCollectionContext & CustomContext
) => Promise<{ [clusterUuid: string]: OpenSearchLicense | undefined }>;

export interface CollectionConfig<
  CustomContext extends Record<string, any> = {},
  T extends BasicStatsPayload = BasicStatsPayload
> {
  title: string;
  priority: number;
  opensearchCluster: ILegacyClusterClient;
  opensearchClientGetter: () => IClusterClient | undefined; // --> by now we know that the client getter will return the IClusterClient but we assure that through a code check
  statsGetter: StatsGetter<CustomContext, T>;
  clusterDetailsGetter: ClusterDetailsGetter<CustomContext>;
  licenseGetter: LicenseGetter<CustomContext>;
  customContext?: CustomContext;
}

export interface Collection<
  CustomContext extends Record<string, any> = {},
  T extends BasicStatsPayload = BasicStatsPayload
> {
  customContext?: CustomContext;
  statsGetter: StatsGetter<CustomContext, T>;
  licenseGetter: LicenseGetter<CustomContext>;
  clusterDetailsGetter: ClusterDetailsGetter<CustomContext>;
  opensearchCluster: ILegacyClusterClient;
  opensearchClientGetter: () => IClusterClient | undefined; // the collection could still return undefined for the opensearch client getter.
  title: string;
}
