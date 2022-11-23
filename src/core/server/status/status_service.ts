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

import { Observable, combineLatest, Subscription } from 'rxjs';
import { map, distinctUntilChanged, shareReplay, take, debounceTime } from 'rxjs/operators';
import { isDeepStrictEqual } from 'util';

import { CoreService } from '../../types';
import { CoreContext } from '../core_context';
import { Logger } from '../logging';
import { InternalOpenSearchServiceSetup } from '../opensearch';
import { InternalHttpServiceSetup } from '../http';
import { InternalSavedObjectsServiceSetup } from '../saved_objects';
import { PluginName } from '../plugins';
import { InternalMetricsServiceSetup } from '../metrics';
import { registerStatusRoute } from './routes';
import { InternalEnvironmentServiceSetup } from '../environment';

import { config, StatusConfigType } from './status_config';
import { ServiceStatus, CoreStatus, InternalStatusServiceSetup } from './types';
import { getSummaryStatus } from './get_summary_status';
import { PluginsStatusService } from './plugins_status';
import { ExtensionsStatusService } from './extensions_status';
import { ExtensionName } from '../extensions';

interface SetupDeps {
  opensearch: Pick<InternalOpenSearchServiceSetup, 'status$'>;
  environment: InternalEnvironmentServiceSetup;
  pluginDependencies: ReadonlyMap<PluginName, PluginName[]>;
  extensionDependencies: ReadonlyMap<ExtensionName, ExtensionName[]>;
  http: InternalHttpServiceSetup;
  metrics: InternalMetricsServiceSetup;
  savedObjects: Pick<InternalSavedObjectsServiceSetup, 'status$'>;
}

export class StatusService implements CoreService<InternalStatusServiceSetup> {
  private readonly logger: Logger;
  private readonly config$: Observable<StatusConfigType>;

  private pluginsStatus?: PluginsStatusService;
  private extensionsStatus?: ExtensionsStatusService;
  private overallSubscription?: Subscription;

  constructor(private readonly coreContext: CoreContext) {
    this.logger = coreContext.logger.get('status');
    this.config$ = coreContext.configService.atPath<StatusConfigType>(config.path);
  }

  public async setup({
    opensearch,
    pluginDependencies,
    extensionDependencies,
    http,
    metrics,
    savedObjects,
    environment,
  }: SetupDeps) {
    const statusConfig = await this.config$.pipe(take(1)).toPromise();
    const core$ = this.setupCoreStatus({ opensearch, savedObjects });
    this.pluginsStatus = new PluginsStatusService({ core$, pluginDependencies });
    this.extensionsStatus = new ExtensionsStatusService({ core$, extensionDependencies });

    const overall$: Observable<ServiceStatus> = combineLatest([
      core$,
      this.pluginsStatus.getAll$(),
      this.extensionsStatus.getAll$(),
    ]).pipe(
      // Prevent many emissions at once from dependency status resolution from making this too noisy
      debounceTime(500),
      map(([coreStatus, pluginsStatus, extensionsStatus]) => {
        const summary = getSummaryStatus([
          ...Object.entries(coreStatus),
          ...Object.entries(pluginsStatus),
          ...Object.entries(extensionsStatus),
        ]);
        this.logger.debug(`Recalculated overall status`, { status: summary });
        return summary;
      }),
      distinctUntilChanged(isDeepStrictEqual),
      shareReplay(1)
    );

    // Create an unused subscription to ensure all underlying lazy observables are started.
    this.overallSubscription = overall$.subscribe();

    const router = http.createRouter('');
    registerStatusRoute({
      router,
      config: {
        allowAnonymous: statusConfig.allowAnonymous,
        packageInfo: this.coreContext.env.packageInfo,
        serverName: http.getServerInfo().name,
        uuid: environment.instanceUuid,
      },
      metrics,
      status: {
        overall$,
        plugins$: this.pluginsStatus.getAll$(),
        extensions$: this.extensionsStatus.getAll$(),
        core$,
      },
    });

    return {
      core$,
      overall$,
      plugins: {
        set: this.pluginsStatus.set.bind(this.pluginsStatus),
        getDependenciesStatus$: this.pluginsStatus.getDependenciesStatus$.bind(this.pluginsStatus),
        getDerivedStatus$: this.pluginsStatus.getDerivedStatus$.bind(this.pluginsStatus),
      },
      extensions: {
        set: this.extensionsStatus.set.bind(this.extensionsStatus),
        getDependenciesStatus$: this.extensionsStatus.getDependenciesStatus$.bind(
          this.extensionsStatus
        ),
        getDerivedStatus$: this.extensionsStatus.getDerivedStatus$.bind(this.extensionsStatus),
      },
      isStatusPageAnonymous: () => statusConfig.allowAnonymous,
    };
  }

  public start() {}

  public stop() {
    if (this.overallSubscription) {
      this.overallSubscription.unsubscribe();
      this.overallSubscription = undefined;
    }
  }

  private setupCoreStatus({
    opensearch,
    savedObjects,
  }: Pick<SetupDeps, 'opensearch' | 'savedObjects'>): Observable<CoreStatus> {
    return combineLatest([opensearch.status$, savedObjects.status$]).pipe(
      map(([opensearchStatus, savedObjectsStatus]) => ({
        opensearch: opensearchStatus,
        savedObjects: savedObjectsStatus,
      })),
      distinctUntilChanged(isDeepStrictEqual),
      shareReplay(1)
    );
  }
}
