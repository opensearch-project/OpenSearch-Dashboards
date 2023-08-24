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

import { Subject, Observable, BehaviorSubject } from 'rxjs';
import { first, filter, take, switchMap, map, distinctUntilChanged } from 'rxjs/operators';
import { isDeepStrictEqual } from 'util';

import { CoreService } from '../../types';
import {
  SavedObjectsClient,
  SavedObjectsClientProvider,
  SavedObjectsClientProviderOptions,
} from './';
import { OpenSearchDashboardsMigrator, IOpenSearchDashboardsMigrator } from './migrations';
import { CoreContext } from '../core_context';
import {
  OpenSearchClient,
  IClusterClient,
  InternalOpenSearchServiceSetup,
  InternalOpenSearchServiceStart,
} from '../opensearch';
import { OpenSearchDashboardsConfigType } from '../opensearch_dashboards_config';
import {
  SavedObjectsConfigType,
  SavedObjectsMigrationConfigType,
  SavedObjectConfig,
} from './saved_objects_config';
import { OpenSearchDashboardsRequest, InternalHttpServiceSetup } from '../http';
import { SavedObjectsClientContract, SavedObjectsType, SavedObjectStatusMeta } from './types';
import { ISavedObjectsRepository, SavedObjectsRepository } from './service/lib/repository';
import {
  SavedObjectsClientFactoryProvider,
  SavedObjectsClientWrapperFactory,
  SavedObjectRepositoryFactoryProvider,
} from './service/lib/scoped_client_provider';
import { Logger } from '../logging';
import { SavedObjectTypeRegistry, ISavedObjectTypeRegistry } from './saved_objects_type_registry';
import { SavedObjectsSerializer } from './serialization';
import { registerRoutes } from './routes';
import { ServiceStatus, ServiceStatusLevels } from '../status';
import { calculateStatus$ } from './status';
import { createMigrationOpenSearchClient } from './migrations/core/';
/**
 * Saved Objects is OpenSearchDashboards's data persistence mechanism allowing plugins to
 * use OpenSearch for storing and querying state. The SavedObjectsServiceSetup API exposes methods
 * for registering Saved Object types, creating and registering Saved Object client wrappers and factories.
 *
 * @remarks
 * When plugins access the Saved Objects client, a new client is created using
 * the factory provided to `setClientFactory` and wrapped by all wrappers
 * registered through `addClientWrapper`.
 *
 * @example
 * ```ts
 * import { SavedObjectsClient, CoreSetup } from 'src/core/server';
 *
 * export class Plugin() {
 *   setup: (core: CoreSetup) => {
 *     core.savedObjects.setClientFactory(({ request: OpenSearchDashboardsRequest }) => {
 *       return new SavedObjectsClient(core.savedObjects.scopedRepository(request));
 *     })
 *   }
 * }
 * ```
 *
 * @example
 * ```ts
 * import { SavedObjectsClient, CoreSetup } from 'src/core/server';
 * import { mySoType } from './saved_objects'
 *
 * export class Plugin() {
 *   setup: (core: CoreSetup) => {
 *     core.savedObjects.registerType(mySoType);
 *   }
 * }
 * ```
 *
 * @public
 */
export interface SavedObjectsServiceSetup {
  /**
   * Set the default {@link SavedObjectsClientFactoryProvider | factory provider} for creating Saved Objects clients.
   * Only one provider can be set, subsequent calls to this method will fail.
   */
  setClientFactoryProvider: (clientFactoryProvider: SavedObjectsClientFactoryProvider) => void;

  /**
   * Add a {@link SavedObjectsClientWrapperFactory | client wrapper factory} with the given priority.
   */
  addClientWrapper: (
    priority: number,
    id: string,
    factory: SavedObjectsClientWrapperFactory
  ) => void;

  /**
   * Register a {@link SavedObjectsType | savedObjects type} definition.
   *
   * See the {@link SavedObjectsTypeMappingDefinition | mappings format} and
   * {@link SavedObjectMigrationMap | migration format} for more details about these.
   *
   * @example
   * ```ts
   * // src/plugins/my_plugin/server/saved_objects/my_type.ts
   * import { SavedObjectsType } from 'src/core/server';
   * import * as migrations from './migrations';
   *
   * export const myType: SavedObjectsType = {
   *   name: 'MyType',
   *   hidden: false,
   *   namespaceType: 'multiple',
   *   mappings: {
   *     properties: {
   *       textField: {
   *         type: 'text',
   *       },
   *       boolField: {
   *         type: 'boolean',
   *       },
   *     },
   *   },
   *   migrations: {
   *     '2.0.0': migrations.migrateToV2,
   *     '2.1.0': migrations.migrateToV2_1
   *   },
   * };
   *
   * // src/plugins/my_plugin/server/plugin.ts
   * import { SavedObjectsClient, CoreSetup } from 'src/core/server';
   * import { myType } from './saved_objects';
   *
   * export class Plugin() {
   *   setup: (core: CoreSetup) => {
   *     core.savedObjects.registerType(myType);
   *   }
   * }
   * ```
   */
  registerType: (type: SavedObjectsType) => void;

  /**
   * Returns the maximum number of objects allowed for import or export operations.
   */
  getImportExportObjectLimit: () => number;

  /**
   * Set the default {@link SavedObjectRepositoryFactoryProvider | factory provider} for creating Saved Objects repository.
   * Only one repository can be set, subsequent calls to this method will fail.
   */
  setRepositoryFactoryProvider: (
    respositoryFactoryProvider: SavedObjectRepositoryFactoryProvider
  ) => void;

  /**
   * Allows a plugin to specify a custom status dependent on its own criteria.
   * Completely overrides the default status.
   */
  setStatus(status$: Observable<ServiceStatus<SavedObjectStatusMeta>>): void;
}

/**
 * @internal
 */
export interface InternalSavedObjectsServiceSetup extends SavedObjectsServiceSetup {
  status$: Observable<ServiceStatus<SavedObjectStatusMeta>>;
}

/**
 * Saved Objects is OpenSearchDashboards's data persisentence mechanism allowing plugins to
 * use OpenSearch for storing and querying state. The
 * SavedObjectsServiceStart API provides a scoped Saved Objects client for
 * interacting with Saved Objects.
 *
 * @public
 */
export interface SavedObjectsServiceStart {
  /**
   * Creates a {@link SavedObjectsClientContract | Saved Objects client} that
   * uses the credentials from the passed in request to authenticate with
   * OpenSearch. If other plugins have registered Saved Objects client
   * wrappers, these will be applied to extend the functionality of the client.
   *
   * A client that is already scoped to the incoming request is also exposed
   * from the route handler context see {@link RequestHandlerContext}.
   */
  getScopedClient: (
    req: OpenSearchDashboardsRequest,
    options?: SavedObjectsClientProviderOptions
  ) => SavedObjectsClientContract;
  /**
   * Creates a {@link ISavedObjectsRepository | Saved Objects repository} that
   * uses the credentials from the passed in request to authenticate with
   * OpenSearch.
   *
   * @param req - The request to create the scoped repository from.
   * @param includedHiddenTypes - A list of additional hidden types the repository should have access to.
   *
   * @remarks
   * Prefer using `getScopedClient`. This should only be used when using methods
   * not exposed on {@link SavedObjectsClientContract}
   */
  createScopedRepository: (
    req: OpenSearchDashboardsRequest,
    includedHiddenTypes?: string[]
  ) => ISavedObjectsRepository;
  /**
   * Creates a {@link ISavedObjectsRepository | Saved Objects repository} that
   * uses the internal OpenSearch Dashboards user for authenticating with OpenSearch.
   *
   * @param includedHiddenTypes - A list of additional hidden types the repository should have access to.
   */
  createInternalRepository: (includedHiddenTypes?: string[]) => ISavedObjectsRepository;
  /**
   * Creates a {@link SavedObjectsSerializer | serializer} that is aware of all registered types.
   */
  createSerializer: () => SavedObjectsSerializer;
  /**
   * Returns the {@link ISavedObjectTypeRegistry | registry} containing all registered
   * {@link SavedObjectsType | saved object types}
   */
  getTypeRegistry: () => ISavedObjectTypeRegistry;
}

export type InternalSavedObjectsServiceStart = SavedObjectsServiceStart;

/**
 * Factory provided when invoking a {@link SavedObjectsClientFactoryProvider | client factory provider}
 * See {@link SavedObjectsServiceSetup.setClientFactoryProvider}
 *
 * @public
 */
export interface SavedObjectsRepositoryFactory {
  /**
   * Creates a {@link ISavedObjectsRepository | Saved Objects repository} that
   * uses the credentials from the passed in request to authenticate with
   * OpenSearch.
   *
   * @param includedHiddenTypes - A list of additional hidden types the repository should have access to.
   */
  createScopedRepository: (
    req: OpenSearchDashboardsRequest,
    includedHiddenTypes?: string[]
  ) => ISavedObjectsRepository;
  /**
   * Creates a {@link ISavedObjectsRepository | Saved Objects repository} that
   * uses the internal OpenSearch Dashboards user for authenticating with OpenSearch.
   *
   * @param includedHiddenTypes - A list of additional hidden types the repository should have access to.
   */
  createInternalRepository: (includedHiddenTypes?: string[]) => ISavedObjectsRepository;
}

/** @internal */
export interface SavedObjectsSetupDeps {
  http: InternalHttpServiceSetup;
  opensearch: InternalOpenSearchServiceSetup;
}

interface WrappedClientFactoryWrapper {
  priority: number;
  id: string;
  factory: SavedObjectsClientWrapperFactory;
}

/** @internal */
export interface SavedObjectsStartDeps {
  opensearch: InternalOpenSearchServiceStart;
  pluginsInitialized?: boolean;
}

export class SavedObjectsService
  implements CoreService<InternalSavedObjectsServiceSetup, InternalSavedObjectsServiceStart> {
  private logger: Logger;

  private setupDeps?: SavedObjectsSetupDeps;
  private config?: SavedObjectConfig;
  private clientFactoryProvider?: SavedObjectsClientFactoryProvider;
  private clientFactoryWrappers: WrappedClientFactoryWrapper[] = [];

  private migrator$ = new Subject<IOpenSearchDashboardsMigrator>();
  private typeRegistry = new SavedObjectTypeRegistry();
  private started = false;

  private respositoryFactoryProvider?: SavedObjectRepositoryFactoryProvider;
  private savedObjectServiceCustomStatus$?: Observable<ServiceStatus<SavedObjectStatusMeta>>;
  private savedObjectServiceStatus$ = new BehaviorSubject<ServiceStatus<SavedObjectStatusMeta>>({
    level: ServiceStatusLevels.unavailable,
    summary: `waiting`,
  });

  constructor(private readonly coreContext: CoreContext) {
    this.logger = coreContext.logger.get('savedobjects-service');
  }

  public async setup(setupDeps: SavedObjectsSetupDeps): Promise<InternalSavedObjectsServiceSetup> {
    this.logger.debug('Setting up SavedObjects service');

    this.setupDeps = setupDeps;

    const savedObjectsConfig = await this.coreContext.configService
      .atPath<SavedObjectsConfigType>('savedObjects')
      .pipe(first())
      .toPromise();
    const savedObjectsMigrationConfig = await this.coreContext.configService
      .atPath<SavedObjectsMigrationConfigType>('migrations')
      .pipe(first())
      .toPromise();
    this.config = new SavedObjectConfig(savedObjectsConfig, savedObjectsMigrationConfig);

    registerRoutes({
      http: setupDeps.http,
      logger: this.logger,
      config: this.config,
      migratorPromise: this.migrator$.pipe(first()).toPromise(),
    });

    return {
      status$: this.savedObjectServiceStatus$.asObservable(),
      setClientFactoryProvider: (provider) => {
        if (this.started) {
          throw new Error('cannot call `setClientFactoryProvider` after service startup.');
        }
        if (this.clientFactoryProvider) {
          throw new Error('custom client factory is already set, and can only be set once');
        }
        this.clientFactoryProvider = provider;
      },
      addClientWrapper: (priority, id, factory) => {
        if (this.started) {
          throw new Error('cannot call `addClientWrapper` after service startup.');
        }
        this.clientFactoryWrappers.push({
          priority,
          id,
          factory,
        });
      },
      registerType: (type) => {
        if (this.started) {
          throw new Error('cannot call `registerType` after service startup.');
        }
        this.typeRegistry.registerType(type);
      },
      getImportExportObjectLimit: () => this.config!.maxImportExportSize,
      setRepositoryFactoryProvider: (repositoryProvider) => {
        if (this.started) {
          throw new Error('cannot call `setRepositoryFactoryProvider` after service startup.');
        }
        if (this.respositoryFactoryProvider) {
          throw new Error('custom repository factory is already set, and can only be set once');
        }
        this.respositoryFactoryProvider = repositoryProvider;
      },
      setStatus: (status$) => {
        if (this.started) {
          throw new Error('cannot call `setStatus` after service startup.');
        }
        if (this.savedObjectServiceCustomStatus$) {
          throw new Error(
            'custom saved object service status is already set, and can only be set once'
          );
        }
        this.savedObjectServiceCustomStatus$ = status$;
      },
    };
  }

  public async start(
    { opensearch, pluginsInitialized = true }: SavedObjectsStartDeps,
    migrationsRetryDelay?: number
  ): Promise<InternalSavedObjectsServiceStart> {
    if (!this.setupDeps || !this.config) {
      throw new Error('#setup() needs to be run first');
    }

    this.logger.debug('Starting SavedObjects service');

    if (this.savedObjectServiceCustomStatus$) {
      this.savedObjectServiceCustomStatus$
        .pipe(
          map((savedObjectServiceCustomStatus) => {
            return savedObjectServiceCustomStatus;
          }),
          distinctUntilChanged<ServiceStatus<SavedObjectStatusMeta>>(isDeepStrictEqual)
        )
        .subscribe((value) => this.savedObjectServiceStatus$.next(value));
    } else {
      calculateStatus$(
        this.migrator$.pipe(switchMap((migrator) => migrator.getStatus$())),
        this.setupDeps.opensearch.status$
      )
        .pipe(
          map((defaultstatus) => {
            return defaultstatus;
          }),
          distinctUntilChanged<ServiceStatus<SavedObjectStatusMeta>>(isDeepStrictEqual)
        )
        .subscribe((value) => this.savedObjectServiceStatus$.next(value));
    }

    const opensearchDashboardsConfig = await this.coreContext.configService
      .atPath<OpenSearchDashboardsConfigType>('opensearchDashboards')
      .pipe(first())
      .toPromise();
    const client = opensearch.client;

    const migrator = this.createMigrator(
      opensearchDashboardsConfig,
      this.config.migration,
      opensearch.client,
      migrationsRetryDelay
    );

    this.migrator$.next(migrator);

    /**
     * Note: We want to ensure that migrations have completed before
     * continuing with further Core start steps that might use SavedObjects
     * such as running the legacy server, legacy plugins and allowing incoming
     * HTTP requests.
     *
     * However, our build system optimize step and some tests depend on the
     * HTTP server running without an OpenSearch server being available.
     * So, when the `migrations.skip` is true, we skip migrations altogether.
     *
     * We also cannot safely run migrations if plugins are not initialized since
     * not plugin migrations won't be registered.
     */
    const skipMigrations = this.config.migration.skip || !pluginsInitialized;

    if (skipMigrations) {
      this.logger.warn(
        'Skipping Saved Object migrations on startup. Note: Individual documents will still be migrated when read or written.'
      );
    } else {
      this.logger.info(
        'Waiting until all OpenSearch nodes are compatible with OpenSearch Dashboards before starting saved objects migrations...'
      );

      // TODO: Move to Status Service https://github.com/elastic/kibana/issues/41983
      this.setupDeps!.opensearch.opensearchNodesCompatibility$.subscribe(
        ({ isCompatible, message }) => {
          if (!isCompatible && message) {
            this.logger.error(message);
          }
        }
      );

      await this.setupDeps!.opensearch.opensearchNodesCompatibility$.pipe(
        filter((nodes) => nodes.isCompatible),
        take(1)
      ).toPromise();

      this.logger.info('Starting saved objects migrations');
      await migrator.runMigrations();
    }

    const createRepository = (
      opensearchClient: OpenSearchClient,
      includedHiddenTypes: string[] = []
    ) => {
      if (this.respositoryFactoryProvider) {
        return this.respositoryFactoryProvider({
          migrator,
          typeRegistry: this.typeRegistry,
          includedHiddenTypes,
        });
      } else {
        return SavedObjectsRepository.createRepository(
          migrator,
          this.typeRegistry,
          opensearchDashboardsConfig.index,
          opensearchClient,
          includedHiddenTypes
        );
      }
    };

    const repositoryFactory: SavedObjectsRepositoryFactory = {
      createInternalRepository: (includedHiddenTypes?: string[]) =>
        createRepository(client.asInternalUser, includedHiddenTypes),
      createScopedRepository: (req: OpenSearchDashboardsRequest, includedHiddenTypes?: string[]) =>
        createRepository(client.asScoped(req).asCurrentUser, includedHiddenTypes),
    };

    const clientProvider = new SavedObjectsClientProvider({
      defaultClientFactory({ request, includedHiddenTypes }) {
        const repository = repositoryFactory.createScopedRepository(request, includedHiddenTypes);
        return new SavedObjectsClient(repository);
      },
      typeRegistry: this.typeRegistry,
    });
    if (this.clientFactoryProvider) {
      const clientFactory = this.clientFactoryProvider(repositoryFactory);
      clientProvider.setClientFactory(clientFactory);
    }
    this.clientFactoryWrappers.forEach(({ id, factory, priority }) => {
      clientProvider.addClientWrapperFactory(priority, id, factory);
    });

    this.started = true;

    return {
      getScopedClient: clientProvider.getClient.bind(clientProvider),
      createScopedRepository: repositoryFactory.createScopedRepository,
      createInternalRepository: repositoryFactory.createInternalRepository,
      createSerializer: () => new SavedObjectsSerializer(this.typeRegistry),
      getTypeRegistry: () => this.typeRegistry,
    };
  }

  public async stop() {
    this.savedObjectServiceStatus$.unsubscribe();
  }

  private createMigrator(
    opensearchDashboardsConfig: OpenSearchDashboardsConfigType,
    savedObjectsConfig: SavedObjectsMigrationConfigType,
    client: IClusterClient,
    migrationsRetryDelay?: number
  ): IOpenSearchDashboardsMigrator {
    return new OpenSearchDashboardsMigrator({
      typeRegistry: this.typeRegistry,
      logger: this.logger,
      opensearchDashboardsVersion: this.coreContext.env.packageInfo.version,
      savedObjectsConfig,
      opensearchDashboardsConfig,
      client: createMigrationOpenSearchClient(
        client.asInternalUser,
        this.logger,
        migrationsRetryDelay
      ),
    });
  }
}
