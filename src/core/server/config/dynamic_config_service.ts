/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ConfigPath, Env, IConfigService } from '@osd/config';
import { Type } from '@osd/config-schema';
import { PublicMethodsOf } from '@osd/utility-types';
import { AsyncLocalStorage } from 'async_hooks';
import { first } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { InternalHttpServiceSetup, OpenSearchDashboardsRequest } from '../http';
import { CoreService } from '../../types';
import {
  AsyncLocalStorageContext,
  ConfigIdentifier,
  IDynamicConfigStoreClient,
  IDynamicConfigStoreClientFactory,
  InternalDynamicConfigServiceSetup,
  InternalDynamicConfigServiceStart,
} from './types';
import { InternalDynamicConfigurationClient } from './service/internal_dynamic_configuration_client';
import { Logger, LoggerFactory } from '../logging';
import { createLocalStoreFromOsdRequest, pathToString } from './utils/utils';
import { DynamicConfigurationClient } from './service/dynamic_configuration_client';
import { OpenSearchDynamicConfigStoreFactory } from './service/config_store_client/opensearch_config_store_factory';
import { InternalOpenSearchServiceStart } from '../opensearch';
import { DynamicConfigServiceConfigType } from './dynamic_config_service_config';
import { DummyDynamicConfigStoreFactory } from './service/config_store_client/dummy_config_store_factory';

export interface RegisterHTTPSetupDeps {
  http: InternalHttpServiceSetup;
}

export interface StartDeps {
  opensearch: InternalOpenSearchServiceStart;
}

export type IDynamicConfigService = PublicMethodsOf<DynamicConfigService>;

/** @internal */
export class DynamicConfigService
  implements CoreService<unknown, InternalDynamicConfigServiceStart> {
  readonly #configService: IConfigService;
  readonly #envService: Env;
  readonly #logger: Logger;
  readonly #schemas = new Map<string, Type<unknown>>();
  readonly #config$: Observable<DynamicConfigServiceConfigType>;
  readonly #asyncLocalStorage: AsyncLocalStorage<
    AsyncLocalStorageContext
  > = new AsyncLocalStorage();
  readonly #requestHeaders: string[] = [];
  #configStoreClientFactory?: IDynamicConfigStoreClientFactory;
  #started = false;
  #startPromiseResolver?: (startServices: InternalDynamicConfigServiceStart) => void;
  readonly #startPromise: Promise<InternalDynamicConfigServiceStart>;

  constructor(configService: IConfigService, envService: Env, logger: LoggerFactory) {
    this.#configService = configService;
    this.#envService = envService;
    this.#logger = logger.get('dynamic-config-service');
    this.#startPromise = new Promise<InternalDynamicConfigServiceStart>(
      (resolve) => (this.#startPromiseResolver = resolve)
    );
    this.#config$ = configService
      .atPath<DynamicConfigServiceConfigType>('dynamic_config_service')
      .pipe(first());
  }
  public async setup(): Promise<InternalDynamicConfigServiceSetup> {
    return {
      registerDynamicConfigClientFactory: (factory: IDynamicConfigStoreClientFactory) => {
        if (this.#configStoreClientFactory) {
          throw new Error('Dynamic config store client factory is already set');
        }
        if (this.#started) {
          throw new Error(
            'Cannot set config store client factory because dynamic configuration service has already started'
          );
        }
        this.#configStoreClientFactory = factory;
      },
      registerAsyncLocalStoreRequestHeader: (key: string | string[]) => {
        if (typeof key === 'string') {
          this.#requestHeaders.push(key);
        } else {
          this.#requestHeaders.push(...key);
        }
      },
      getStartService: async () => {
        return await this.#startPromise;
      },
    };
  }

  public async start({ opensearch }: StartDeps): Promise<InternalDynamicConfigServiceStart> {
    this.#logger.info('initiating start()');
    const config = await this.#config$.pipe(first()).toPromise();
    let configStoreClient: IDynamicConfigStoreClient;

    if (!config.enabled) {
      const dummyDynamicConfigStoreClientFactory = new DummyDynamicConfigStoreFactory();
      configStoreClient = dummyDynamicConfigStoreClientFactory.create();
    } else {
      if (this.#configStoreClientFactory) {
        configStoreClient = this.#configStoreClientFactory.create();
      } else {
        const defaultDynamicConfigStoreClientFactory = new OpenSearchDynamicConfigStoreFactory(
          opensearch
        );
        const defaultConfigStoreClient = defaultDynamicConfigStoreClientFactory.create();
        if (!config.skipMigrations) {
          await defaultConfigStoreClient.createDynamicConfigIndex();
        }
        configStoreClient = defaultConfigStoreClient;
      }
    }

    // Create the clients
    const internalClient = new InternalDynamicConfigurationClient({
      client: configStoreClient,
      configService: this.#configService,
      env: this.#envService,
      logger: this.#logger,
      schemas: this.#schemas,
    });
    const client = new DynamicConfigurationClient(internalClient);

    const startServices: InternalDynamicConfigServiceStart = {
      getClient: () => {
        return client;
      },
      getAsyncLocalStore: () => {
        return this.#asyncLocalStorage.getStore();
      },
      createStoreFromRequest: (request: OpenSearchDashboardsRequest) => {
        return createLocalStoreFromOsdRequest(this.#logger, request, this.#requestHeaders);
      },
    };

    this.#logger.info('finished start()');
    this.#started = true;
    if (this.#startPromiseResolver) {
      this.#startPromiseResolver(startServices);
    }

    return startServices;
  }

  /**
   * Extra setup step to register any HTTP routes and the async local store. This should be called after all plugins are setup but before dynamicConfigService is started
   *
   * @param setupDeps
   */
  public async registerRoutesAndHandlers(setupDeps: RegisterHTTPSetupDeps) {
    const { http } = setupDeps;

    /**
     * TODO Register the routes
     *  - validate (needed for CP)
     *  - Optional:
     *    - create
     *    - bulkCreate
     *    - get
     *    - bulkGet
     *    - list
     *    - delete
     *    - bulkDelete
     */

    // FIXME: This seems not working as expected, as sometimes the context is not available to request handlers after registering
    //        in the PostAuth handler. Needs to do more research.
    //        For now, we can use DynamicConfigService.createStoreFromRequest(request) to create context store when it needs to
    //        fetch configrations from DynamicConfigStore.
    this.#logger.info('registering middleware to inject context to AsyncLocalStorage');
    http.registerOnPostAuth((request, response, context) => {
      if (request.auth.isAuthenticated) {
        const localStore = createLocalStoreFromOsdRequest(
          this.#logger,
          request,
          this.#requestHeaders
        ) as AsyncLocalStorageContext;
        this.#asyncLocalStorage.enterWith(localStore);
      }
      return context.next();
    });
  }

  public async stop() {}

  /**
   * Mimics Config Service schema registration, which should be finished calling before start() is called. Validation is not needed as the Config Service handles that
   *
   * @param path {string} the core ID, plugin ID, or the plugin configPath (if specified)
   * @param schema {Type<unknown>} the schema object defined in config.ts
   */
  public setSchema(path: ConfigPath, schema: Type<unknown>) {
    // Even though server configs are not pluginConfigPaths, the logic to parse the namespace will not change
    const namespace = pathToString({ pluginConfigPath: path });
    if (this.#schemas.has(namespace)) {
      throw new Error(`Validation schema for [${namespace}] was already registered.`);
    }
    this.#schemas.set(namespace, schema);
  }

  /**
   * Checks if a certain config already exists
   *
   * @param configIdentifier {ConfigIdentifier} the core ID, plugin ID, or the plugin configPath (if specified)
   */
  public hasDefaultConfigs(configIdentifier: ConfigIdentifier) {
    const namespace = pathToString(configIdentifier);
    return this.#schemas.has(namespace);
  }
}
