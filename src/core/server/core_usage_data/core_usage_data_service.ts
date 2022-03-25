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

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { CoreService } from 'src/core/types';
import { SavedObjectsServiceStart } from 'src/core/server';
import { CoreContext } from '../core_context';
import { OpenSearchConfigType } from '../opensearch/opensearch_config';
import { HttpConfigType } from '../http';
import { LoggingConfigType } from '../logging';
import { SavedObjectsConfigType } from '../saved_objects/saved_objects_config';
import { CoreServicesUsageData, CoreUsageData, CoreUsageDataStart } from './types';
import { isConfigured } from './is_configured';
import { OpenSearchServiceStart } from '../opensearch';
import { OpenSearchDashboardsConfigType } from '../opensearch_dashboards_config';
import { MetricsServiceSetup, OpsMetrics } from '..';

export interface SetupDeps {
  metrics: MetricsServiceSetup;
}

export interface StartDeps {
  savedObjects: SavedObjectsServiceStart;
  opensearch: OpenSearchServiceStart;
}

/**
 * Because users can configure their Saved Object to any arbitrary index name,
 * we need to map customized index names back to a "standard" index name.
 *
 * e.g. If a user configures `opensearchDashboards.index: .my_saved_objects` we want to the
 * collected data to be grouped under `.kibana` not ".my_saved_objects".
 *
 * This is rather brittle, but the option to configure index names might go
 * away completely anyway (see #60053).
 *
 * @param index The index name configured for this SO type
 * @param opensearchDashboardsConfigIndex The default opensearch-dashboards index as configured by the user
 * with `opensearchDashboards.index`
 */
const opensearchDashboardsOrTaskManagerIndex = (
  index: string,
  opensearchDashboardsConfigIndex: string
) => {
  return index === opensearchDashboardsConfigIndex ? '.kibana' : '.kibana_task_manager';
};

export class CoreUsageDataService implements CoreService<void, CoreUsageDataStart> {
  private opensearchConfig?: OpenSearchConfigType;
  private configService: CoreContext['configService'];
  private httpConfig?: HttpConfigType;
  private loggingConfig?: LoggingConfigType;
  private soConfig?: SavedObjectsConfigType;
  private stop$: Subject<void>;
  private opsMetrics?: OpsMetrics;
  private opensearchDashboardsConfig?: OpenSearchDashboardsConfigType;

  constructor(core: CoreContext) {
    this.configService = core.configService;
    this.stop$ = new Subject();
  }

  private async getSavedObjectIndicesUsageData(
    savedObjects: SavedObjectsServiceStart,
    opensearch: OpenSearchServiceStart
  ): Promise<CoreServicesUsageData['savedObjects']> {
    const indices = await Promise.all(
      Array.from(
        savedObjects
          .getTypeRegistry()
          .getAllTypes()
          .reduce((acc, type) => {
            const index = type.indexPattern ?? this.opensearchDashboardsConfig!.index;
            return index != null ? acc.add(index) : acc;
          }, new Set<string>())
          .values()
      ).map((index) => {
        // The _cat/indices API returns the _index_ and doesn't return a way
        // to map back from the index to the alias. So we have to make an API
        // call for every alias
        return opensearch.client.asInternalUser.cat
          .indices<any[]>({
            index,
            format: 'JSON',
            bytes: 'b',
          })
          .then(({ body }) => {
            const stats = body[0];
            return {
              alias: opensearchDashboardsOrTaskManagerIndex(
                index,
                this.opensearchDashboardsConfig!.index
              ),
              docsCount: stats['docs.count'] ? parseInt(stats['docs.count'], 10) : 0,
              docsDeleted: stats['docs.deleted'] ? parseInt(stats['docs.deleted'], 10) : 0,
              storeSizeBytes: stats['store.size'] ? parseInt(stats['store.size'], 10) : 0,
              primaryStoreSizeBytes: stats['pri.store.size']
                ? parseInt(stats['pri.store.size'], 10)
                : 0,
            };
          });
      })
    );

    return {
      indices,
    };
  }

  private async getCoreUsageData(
    savedObjects: SavedObjectsServiceStart,
    opensearch: OpenSearchServiceStart
  ): Promise<CoreUsageData> {
    if (
      this.opensearchConfig == null ||
      this.httpConfig == null ||
      this.soConfig == null ||
      this.opsMetrics == null
    ) {
      throw new Error('Unable to read config valuopensearch. Ensure that setup() has completed.');
    }

    const opensearchConfig = this.opensearchConfig;
    const soUsageData = await this.getSavedObjectIndicesUsageData(savedObjects, opensearch);

    const http = this.httpConfig;
    return {
      config: {
        opensearch: {
          apiVersion: opensearchConfig.apiVersion,
          sniffOnStart: opensearchConfig.sniffOnStart,
          sniffIntervalMs:
            opensearchConfig.sniffInterval !== false
              ? opensearchConfig.sniffInterval.asMilliseconds()
              : -1,
          sniffOnConnectionFault: opensearchConfig.sniffOnConnectionFault,
          numberOfHostsConfigured: Array.isArray(opensearchConfig.hosts)
            ? opensearchConfig.hosts.length
            : isConfigured.string(opensearchConfig.hosts)
            ? 1
            : 0,
          customHeadersConfigured: isConfigured.record(opensearchConfig.customHeaders),
          healthCheckDelayMs: opensearchConfig.healthCheck.delay.asMilliseconds(),
          logQueries: opensearchConfig.logQueries,
          pingTimeoutMs: opensearchConfig.pingTimeout.asMilliseconds(),
          requestHeadersWhitelistConfigured: isConfigured.stringOrArray(
            opensearchConfig.requestHeadersWhitelist,
            ['authorization']
          ),
          requestTimeoutMs: opensearchConfig.requestTimeout.asMilliseconds(),
          shardTimeoutMs: opensearchConfig.shardTimeout.asMilliseconds(),
          ssl: {
            alwaysPresentCertificate: opensearchConfig.ssl.alwaysPresentCertificate,
            certificateAuthoritiesConfigured: isConfigured.stringOrArray(
              opensearchConfig.ssl.certificateAuthorities
            ),
            certificateConfigured: isConfigured.string(opensearchConfig.ssl.certificate),
            keyConfigured: isConfigured.string(opensearchConfig.ssl.key),
            verificationMode: opensearchConfig.ssl.verificationMode,
            truststoreConfigured: isConfigured.record(opensearchConfig.ssl.truststore),
            keystoreConfigured: isConfigured.record(opensearchConfig.ssl.keystore),
          },
        },
        http: {
          basePathConfigured: isConfigured.string(http.basePath),
          maxPayloadInBytes: http.maxPayload.getValueInBytes(),
          rewriteBasePath: http.rewriteBasePath,
          keepaliveTimeout: http.keepaliveTimeout,
          socketTimeout: http.socketTimeout,
          compression: {
            enabled: http.compression.enabled,
            referrerWhitelistConfigured: isConfigured.array(http.compression.referrerWhitelist),
          },
          xsrf: {
            disableProtection: http.xsrf.disableProtection,
            whitelistConfigured: isConfigured.array(http.xsrf.whitelist),
          },
          requestId: {
            allowFromAnyIp: http.requestId.allowFromAnyIp,
            ipAllowlistConfigured: isConfigured.array(http.requestId.ipAllowlist),
          },
          ssl: {
            certificateAuthoritiesConfigured: isConfigured.stringOrArray(
              http.ssl.certificateAuthorities
            ),
            certificateConfigured: isConfigured.string(http.ssl.certificate),
            cipherSuites: http.ssl.cipherSuites,
            keyConfigured: isConfigured.string(http.ssl.key),
            redirectHttpFromPortConfigured: isConfigured.number(http.ssl.redirectHttpFromPort),
            supportedProtocols: http.ssl.supportedProtocols,
            clientAuthentication: http.ssl.clientAuthentication,
            keystoreConfigured: isConfigured.record(http.ssl.keystore),
            truststoreConfigured: isConfigured.record(http.ssl.truststore),
          },
        },

        logging: {
          appendersTypesUsed: Array.from(
            Array.from(this.loggingConfig?.appenders.values() ?? [])
              .reduce((acc, a) => acc.add(a.kind), new Set<string>())
              .values()
          ),
          loggersConfiguredCount: this.loggingConfig?.loggers.length ?? 0,
        },

        savedObjects: {
          maxImportPayloadBytes: this.soConfig.maxImportPayloadBytes.getValueInBytes(),
          maxImportExportSizeBytes: this.soConfig.maxImportExportSize.getValueInBytes(),
        },
      },
      environment: {
        memory: {
          heapSizeLimit: this.opsMetrics.process.memory.heap.size_limit,
          heapTotalBytes: this.opsMetrics.process.memory.heap.total_in_bytes,
          heapUsedBytes: this.opsMetrics.process.memory.heap.used_in_bytes,
        },
      },
      services: {
        savedObjects: soUsageData,
      },
    };
  }

  setup({ metrics }: SetupDeps) {
    metrics
      .getOpsMetrics$()
      .pipe(takeUntil(this.stop$))
      .subscribe((opsMetrics) => (this.opsMetrics = opsMetrics));

    this.configService
      .atPath<OpenSearchConfigType>('opensearch')
      .pipe(takeUntil(this.stop$))
      .subscribe((config) => {
        this.opensearchConfig = config;
      });

    this.configService
      .atPath<HttpConfigType>('server')
      .pipe(takeUntil(this.stop$))
      .subscribe((config) => {
        this.httpConfig = config;
      });

    this.configService
      .atPath<LoggingConfigType>('logging')
      .pipe(takeUntil(this.stop$))
      .subscribe((config) => {
        this.loggingConfig = config;
      });

    this.configService
      .atPath<SavedObjectsConfigType>('savedObjects')
      .pipe(takeUntil(this.stop$))
      .subscribe((config) => {
        this.soConfig = config;
      });

    this.configService
      .atPath<OpenSearchDashboardsConfigType>('opensearchDashboards')
      .pipe(takeUntil(this.stop$))
      .subscribe((config) => {
        this.opensearchDashboardsConfig = config;
      });
  }

  start({ savedObjects, opensearch }: StartDeps) {
    return {
      getCoreUsageData: () => {
        return this.getCoreUsageData(savedObjects, opensearch);
      },
    };
  }

  stop() {
    this.stop$.next();
    this.stop$.complete();
  }
}
