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

import { Observable, Subject, of } from 'rxjs';
import { first, map, shareReplay, takeUntil } from 'rxjs/operators';
import { merge } from '@osd/std';

import { CoreService } from '../../types';
import { CoreContext } from '../core_context';
import { Logger } from '../logging';
import {
  LegacyClusterClient,
  ILegacyCustomClusterClient,
  LegacyOpenSearchClientConfig,
} from './legacy';
import { ClusterClient, ICustomClusterClient, OpenSearchClientConfig } from './client';
import { OpenSearchConfig, OpenSearchConfigType } from './opensearch_config';
import { InternalHttpServiceSetup, GetAuthHeaders } from '../http/';
import { AuditTrailStart, AuditorFactory } from '../audit_trail';
import { InternalOpenSearchServiceSetup, InternalOpenSearchServiceStart } from './types';
import { pollOpenSearchNodesVersion } from './version_check/ensure_opensearch_version';
import { calculateStatus$ } from './status';

interface SetupDeps {
  http: InternalHttpServiceSetup;
}

interface StartDeps {
  auditTrail: AuditTrailStart;
}

/** @internal */
export class OpenSearchService
  implements CoreService<InternalOpenSearchServiceSetup, InternalOpenSearchServiceStart> {
  private readonly log: Logger;
  private readonly config$: Observable<OpenSearchConfig>;
  private auditorFactory?: AuditorFactory;
  private stop$ = new Subject();
  private opensearchDashboardsVersion: string;
  private getAuthHeaders?: GetAuthHeaders;

  private createLegacyCustomClient?: (
    type: string,
    clientConfig?: Partial<LegacyOpenSearchClientConfig>
  ) => ILegacyCustomClusterClient;
  private legacyClient?: LegacyClusterClient;

  private client?: ClusterClient;

  constructor(private readonly coreContext: CoreContext) {
    this.opensearchDashboardsVersion = coreContext.env.packageInfo.version;
    this.log = coreContext.logger.get('opensearch-service');
    this.config$ = coreContext.configService
      .atPath<OpenSearchConfigType>('opensearch')
      .pipe(map((rawConfig) => new OpenSearchConfig(rawConfig)));
  }

  public async setup(deps: SetupDeps): Promise<InternalOpenSearchServiceSetup> {
    this.log.debug('Setting up opensearch service');

    const config = await this.config$.pipe(first()).toPromise();

    this.getAuthHeaders = deps.http.getAuthHeaders;
    this.legacyClient = this.createLegacyClusterClient('data', config);
    this.client = this.createClusterClient('data', config);

    let opensearchNodesCompatibility$;
    if (config.hosts.length > 0) {
      opensearchNodesCompatibility$ = pollOpenSearchNodesVersion({
        internalClient: this.client.asInternalUser,
        optimizedHealthcheck: config.optimizedHealthcheck,
        log: this.log,
        ignoreVersionMismatch: config.ignoreVersionMismatch,
        opensearchVersionCheckInterval: config.healthCheckDelay.asMilliseconds(),
        opensearchDashboardsVersion: this.opensearchDashboardsVersion,
      }).pipe(takeUntil(this.stop$), shareReplay({ refCount: true, bufferSize: 1 }));
    } else {
      this.log.debug(`Opensearch is not configured.`);
      opensearchNodesCompatibility$ = of({
        isCompatible: true,
        message: 'Opensearch is not configured',
        incompatibleNodes: [],
        warningNodes: [],
        opensearchDashboardsVersion: this.opensearchDashboardsVersion,
      });
    }

    this.createLegacyCustomClient = (type, clientConfig = {}) => {
      const finalConfig = merge({}, config, clientConfig);
      return this.createLegacyClusterClient(type, finalConfig);
    };

    return {
      legacy: {
        config$: this.config$,
        client: this.legacyClient,
        createClient: this.createLegacyCustomClient,
      },
      opensearchNodesCompatibility$,
      status$: calculateStatus$(opensearchNodesCompatibility$),
    };
  }
  public async start({ auditTrail }: StartDeps): Promise<InternalOpenSearchServiceStart> {
    this.auditorFactory = auditTrail;
    if (!this.legacyClient || !this.createLegacyCustomClient) {
      throw new Error('OpenSearchService needs to be setup before calling start');
    }

    const config = await this.config$.pipe(first()).toPromise();

    const createClient = (
      type: string,
      clientConfig: Partial<OpenSearchClientConfig> = {}
    ): ICustomClusterClient => {
      const finalConfig = merge({}, config, clientConfig);
      return this.createClusterClient(type, finalConfig);
    };

    return {
      client: this.client!,
      createClient,
      legacy: {
        config$: this.config$,
        client: this.legacyClient,
        createClient: this.createLegacyCustomClient,
      },
    };
  }

  public async stop() {
    this.log.debug('Stopping opensearch service');
    this.stop$.next();
    if (this.client) {
      await this.client.close();
    }
    if (this.legacyClient) {
      this.legacyClient.close();
    }
  }

  private createClusterClient(type: string, config: OpenSearchClientConfig) {
    return new ClusterClient(
      config,
      this.coreContext.logger.get('opensearch', type),
      this.getAuthHeaders
    );
  }

  private createLegacyClusterClient(type: string, config: LegacyOpenSearchClientConfig) {
    return new LegacyClusterClient(
      config,
      this.coreContext.logger.get('opensearch', type),
      this.getAuditorFactory,
      this.getAuthHeaders
    );
  }

  private getAuditorFactory = () => {
    if (!this.auditorFactory) {
      throw new Error('auditTrail has not been initialized');
    }
    return this.auditorFactory;
  };
}
