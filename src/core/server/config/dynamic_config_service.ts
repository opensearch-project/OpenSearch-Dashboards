/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ConfigPath, Env, IConfigService } from '@osd/config';
import { Type } from '@osd/config-schema';
import { PublicMethodsOf } from '@osd/utility-types';
import { AsyncLocalStorage } from 'async_hooks';
import { InternalHttpServiceSetup } from '../http';
import { CoreService } from '../../types';
import {
  AsyncLocalStorageContext,
  ConfigIdentifier,
  IDynamicConfigStoreClientFactory,
  InternalDynamicConfigServiceSetup,
  InternalDynamicConfigServiceStart,
} from './types';
import { InternalDynamicConfigurationClient } from './service/internal_dynamic_configuration_client';
import { Logger, LoggerFactory } from '../logging';
import { createLocalStore, pathToString } from './utils/utils';
import { DynamicConfigurationClient } from './service/dynamic_configuration_client';
import { OpenSearchDynamicConfigStoreFactory } from './service/opensearch_config_store_factory';

export interface RegisterHTTPSetupDeps {
  http: InternalHttpServiceSetup;
}

export type IDynamicConfigService = PublicMethodsOf<DynamicConfigService>;

/** @internal */
export class DynamicConfigService
  implements CoreService<unknown, InternalDynamicConfigServiceStart> {
  readonly #configService: IConfigService;
  readonly #envService: Env;
  readonly #logger: Logger;
  readonly #schemas = new Map<string, Type<unknown>>();
  readonly #asyncLocalStorage: AsyncLocalStorage<
    AsyncLocalStorageContext
  > = new AsyncLocalStorage();
  readonly #requestHeaders: string[] = [];
  #configStoreClientFactory?: IDynamicConfigStoreClientFactory;
  #started = false;
  #startPromiseResolver?: (startServices: InternalDynamicConfigServiceStart) => void;
  readonly #startPromise: Promise<InternalDynamicConfigServiceStart>;
  readonly #defaultDynamicConfigStoreClientFactory = new OpenSearchDynamicConfigStoreFactory();

  constructor(configService: IConfigService, envService: Env, logger: LoggerFactory) {
    this.#configService = configService;
    this.#envService = envService;
    this.#logger = logger.get('dynamic-config-service');
    this.#startPromise = new Promise<InternalDynamicConfigServiceStart>(
      (resolve) => (this.#startPromiseResolver = resolve)
    );
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

  public async start(): Promise<InternalDynamicConfigServiceStart> {
    this.#logger.info('initiating start()');
    // TODO Provide a default implementation of the client
    const configStoreClient = this.#configStoreClientFactory
      ? this.#configStoreClientFactory.create()
      : this.#defaultDynamicConfigStoreClientFactory.create();

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

    this.#logger.info('registering middleware');
    // Register the async local storage with all the registered localStorage
    http.server.ext('onPreAuth', (request, h) => {
      const localStore = createLocalStore(this.#logger, request, this.#requestHeaders);
      this.#asyncLocalStorage.enterWith(localStore);
      return h.continue;
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
