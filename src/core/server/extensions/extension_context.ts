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

import { map, shareReplay } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { PathConfigType, config as pathConfig } from '@osd/utils';
import { pick, deepFreeze } from '@osd/std';
import { CoreContext } from '../core_context';
import { ExtensionWrapper } from './extension';
import { ExtensionsServiceSetupDeps, ExtensionsServiceStartDeps } from './extensions_service';
import {
  ExtensionInitializerContext,
  ExtensionManifest,
  ExtensionOpaqueId,
  SharedGlobalConfigKeys,
} from './types';
import {
  OpenSearchDashboardsConfigType,
  config as opensearchDashboardsConfig,
} from '../opensearch_dashboards_config';
import { OpenSearchConfigType, config as opensearchConfig } from '../opensearch/opensearch_config';
import { SavedObjectsConfigType, savedObjectsConfig } from '../saved_objects/saved_objects_config';
import { CoreSetupForExtension, CoreStart } from '..';

export interface InstanceInfo {
  uuid: string;
}

/**
 * This returns a facade for `CoreContext` that will be exposed to the extension initializer.
 * This facade should be safe to use across entire extension lifespan.
 *
 * This is called for each extension when it's created, so each extension gets its own
 * version of these values.
 *
 * We should aim to be restrictive and specific in the APIs that we expose.
 *
 * @param coreContext OpenSearch Dashboards core context
 * @param extensionManifest The manifest of the extension we're building these values for.
 * @internal
 */
export function createExtensionInitializerContext(
  coreContext: CoreContext,
  opaqueId: ExtensionOpaqueId,
  extensionManifest: ExtensionManifest,
  instanceInfo: InstanceInfo
): ExtensionInitializerContext {
  return {
    opaqueId,

    /**
     * Environment information that is safe to expose to extensions and may be beneficial for them.
     */
    env: {
      mode: coreContext.env.mode,
      packageInfo: coreContext.env.packageInfo,
      instanceUuid: instanceInfo.uuid,
    },

    /**
     * Extension-scoped logger
     */
    logger: {
      get(...contextParts) {
        return coreContext.logger.get('extensions', extensionManifest.extensionId, ...contextParts);
      },
    },

    /**
     * Core configuration functionality, enables fetching a subset of the config.
     */
    config: {
      legacy: {
        /**
         * Global configuration
         * Note: naming not final here, it will be renamed in a near future (https://github.com/elastic/kibana/issues/46240)
         * @deprecated
         */
        globalConfig$: combineLatest([
          coreContext.configService.atPath<OpenSearchDashboardsConfigType>(
            opensearchDashboardsConfig.path
          ),
          coreContext.configService.atPath<OpenSearchConfigType>(opensearchConfig.path),
          coreContext.configService.atPath<PathConfigType>(pathConfig.path),
          coreContext.configService.atPath<SavedObjectsConfigType>(savedObjectsConfig.path),
        ]).pipe(
          map(([opensearchDashboards, opensearch, path, savedObjects]) =>
            deepFreeze({
              opensearchDashboards: pick(
                opensearchDashboards,
                SharedGlobalConfigKeys.opensearchDashboards
              ),
              opensearch: pick(opensearch, SharedGlobalConfigKeys.opensearch),
              path: pick(path, SharedGlobalConfigKeys.path),
              savedObjects: pick(savedObjects, SharedGlobalConfigKeys.savedObjects),
            })
          )
        ),
      },

      /**
       * Reads the subset of the config at the `configPath` defined in the extension
       * manifest and validates it against the schema in the static `schema` on
       * the given `ConfigClass`.
       * @param ConfigClass A class (not an instance of a class) that contains a
       * static `schema` that we validate the config at the given `path` against.
       */
      create<T>() {
        return coreContext.configService
          .atPath<T>(extensionManifest.configPath)
          .pipe(shareReplay(1));
      },
      createIfExists() {
        return coreContext.configService.optionalAtPath(extensionManifest.configPath);
      },
    },
  };
}

/**
 * This returns a facade for `CoreContext` that will be exposed to the extension `setup` method.
 * This facade should be safe to use only within `setup` itself.
 *
 * This is called for each extension when it's set up, so each extension gets its own
 * version of these values.
 *
 * We should aim to be restrictive and specific in the APIs that we expose.
 *
 * @param coreContext OpenSearch Dashboards core context
 * @param extension The extension we're building these values for.
 * @param deps Dependencies that Extensions services gets during setup.
 * @internal
 */
export function createExtensionSetupContext<TExtension, TExtensionDependencies>(
  coreContext: CoreContext,
  deps: ExtensionsServiceSetupDeps,
  extension: ExtensionWrapper<TExtension, TExtensionDependencies>
): CoreSetupForExtension {
  const router = deps.http.createRouter('', extension.opaqueId);

  return {
    capabilities: {
      registerProvider: deps.capabilities.registerProvider,
      registerSwitcher: deps.capabilities.registerSwitcher,
    },
    context: {
      createContextContainer: deps.context.createContextContainer,
    },
    opensearch: {
      legacy: deps.opensearch.legacy,
    },
    http: {
      createCookieSessionStorageFactory: deps.http.createCookieSessionStorageFactory,
      registerRouteHandlerContext: deps.http.registerRouteHandlerContext.bind(
        null,
        extension.opaqueId
      ),
      createRouter: () => router,
      resources: deps.httpResources.createRegistrar(router),
      registerOnPreRouting: deps.http.registerOnPreRouting,
      registerOnPreAuth: deps.http.registerOnPreAuth,
      registerAuth: deps.http.registerAuth,
      registerOnPostAuth: deps.http.registerOnPostAuth,
      registerOnPreResponse: deps.http.registerOnPreResponse,
      basePath: deps.http.basePath,
      auth: { get: deps.http.auth.get, isAuthenticated: deps.http.auth.isAuthenticated },
      csp: deps.http.csp,
      getServerInfo: deps.http.getServerInfo,
    },
    logging: {
      configure: (config$) => deps.logging.configure(['extensions', extension.name], config$),
    },
    metrics: {
      collectionInterval: deps.metrics.collectionInterval,
      getOpsMetrics$: deps.metrics.getOpsMetrics$,
    },
    savedObjects: {
      setClientFactoryProvider: deps.savedObjects.setClientFactoryProvider,
      addClientWrapper: deps.savedObjects.addClientWrapper,
      registerType: deps.savedObjects.registerType,
      getImportExportObjectLimit: deps.savedObjects.getImportExportObjectLimit,
    },
    status: {
      core$: deps.status.core$,
      overall$: deps.status.overall$,
      set: deps.status.extensions.set.bind(null, extension.name),
      dependencies$: deps.status.extensions.getDependenciesStatus$(extension.name),
      derivedStatus$: deps.status.extensions.getDerivedStatus$(extension.name),
      isStatusPageAnonymous: deps.status.isStatusPageAnonymous,
    },
    uiSettings: {
      register: deps.uiSettings.register,
    },
    getStartServices: () => extension.startDependencies,
    auditTrail: deps.auditTrail,
  };
}

/**
 * This returns a facade for `CoreContext` that will be exposed to the extension `start` method.
 * This facade should be safe to use only within `start` itself.
 *
 * This is called for each extension when it starts, so each extension gets its own
 * version of these values.
 *
 * @param coreContext OpenSearch Dashboards core context
 * @param extension The extension we're building these values for.
 * @param deps Dependencies that Extensions services gets during start.
 * @internal
 */
export function createExtensionStartContext<TExtension, TExtensionDependencies>(
  coreContext: CoreContext,
  deps: ExtensionsServiceStartDeps,
  extension: ExtensionWrapper<TExtension, TExtensionDependencies>
): CoreStart {
  return {
    capabilities: {
      resolveCapabilities: deps.capabilities.resolveCapabilities,
    },
    opensearch: {
      client: deps.opensearch.client,
      createClient: deps.opensearch.createClient,
      legacy: deps.opensearch.legacy,
    },
    http: {
      auth: deps.http.auth,
      basePath: deps.http.basePath,
      getServerInfo: deps.http.getServerInfo,
    },
    savedObjects: {
      getScopedClient: deps.savedObjects.getScopedClient,
      createInternalRepository: deps.savedObjects.createInternalRepository,
      createScopedRepository: deps.savedObjects.createScopedRepository,
      createSerializer: deps.savedObjects.createSerializer,
      getTypeRegistry: deps.savedObjects.getTypeRegistry,
    },
    metrics: {
      collectionInterval: deps.metrics.collectionInterval,
      getOpsMetrics$: deps.metrics.getOpsMetrics$,
    },
    uiSettings: {
      asScopedToClient: deps.uiSettings.asScopedToClient,
    },
    auditTrail: deps.auditTrail,
    coreUsageData: deps.coreUsageData,
  };
}
