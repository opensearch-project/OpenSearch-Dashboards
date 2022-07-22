/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import { Observable, Subject } from 'rxjs';
import { first, map } from 'rxjs/operators';
import { CoreService } from 'src/core/types';
import { AuditorFactory, AuditTrailStart } from '../audit_trail';
import { CoreContext } from '../core_context';
import { Logger } from '../logging';
import { OpenSearchClientConfig } from '../opensearch/client';
import { OpenSearchConfig, OpenSearchConfigType } from '../opensearch/opensearch_config';
import { InternalSavedObjectsServiceStart, SavedObjectsClient } from '../saved_objects';
import { SavedObjectsClientContract } from '../types';
import { DataSourceClient } from './client/data_source_client';
import { InternalOpenSearchDataServiceSetup, InternalOpenSearchDataServiceStart } from './types';

interface StartDeps {
  savedObjects: InternalSavedObjectsServiceStart;
  auditTrail: AuditTrailStart;
}

export class OpenSearchDataService
  implements CoreService<InternalOpenSearchDataServiceSetup, InternalOpenSearchDataServiceStart> {
  private readonly log: Logger;
  private readonly config$: Observable<OpenSearchConfig>;
  //@ts-ignore
  private auditorFactory?: AuditorFactory;
  private stop$ = new Subject();
  //@ts-ignore
  private opensearchDashboardsVersion: string;
  private savedObjectClient?: SavedObjectsClientContract;
  private dataSourceClient?: DataSourceClient;

  constructor(private readonly coreContext: CoreContext) {
    this.opensearchDashboardsVersion = coreContext.env.packageInfo.version;
    this.log = coreContext.logger.get('opensearch-data-service');
    this.config$ = coreContext.configService
      .atPath<OpenSearchConfigType>('opensearch') // TODO: update if we'll add data source specific configs
      .pipe(map((rawConfig) => new OpenSearchConfig(rawConfig)));
  }

  public async setup(): Promise<any> {
    this.log.debug('Setting up opensearch data service');

    // const config = await this.config$.pipe(first()).toPromise(); //TODO: add later

    // TODO: update accordingly when we decide how to check node/version compatibility in setup stage

    // const opensearchNodesCompatibility$ = pollOpenSearchNodesVersion({
    //   internalClient: this.client.asInternalUser,
    //   optimizedHealthcheckId: config.optimizedHealthcheckId,
    //   log: this.log,
    //   ignoreVersionMismatch: config.ignoreVersionMismatch,
    //   opensearchVersionCheckInterval: config.healthCheckDelay.asMilliseconds(),
    //   opensearchDashboardsVersion: this.opensearchDashboardsVersion,
    // }).pipe(takeUntil(this.stop$), shareReplay({ refCount: true, bufferSize: 1 }));

    return {};
  }

  public async start({ savedObjects, auditTrail }: StartDeps): Promise<any> {
    this.auditorFactory = auditTrail;
    const config = await this.config$.pipe(first()).toPromise();
    this.savedObjectClient = new SavedObjectsClient(savedObjects.createInternalRepository());
    this.dataSourceClient = this.createDataSourceClient('data-source', config);

    return {
      client: this.dataSourceClient,
    };
  }

  public async stop() {
    this.log.debug('Stopping opensearch data service');
    this.stop$.next();
    if (this.dataSourceClient) {
      await this.dataSourceClient.close();
    }
  }

  private createDataSourceClient(type: string, config: OpenSearchClientConfig) {
    return new DataSourceClient(
      config,
      this.savedObjectClient!,
      this.coreContext.logger.get('opensearch', type)
    );
  }
}
