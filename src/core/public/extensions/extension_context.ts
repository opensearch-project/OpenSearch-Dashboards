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

import { omit } from 'lodash';
import { DiscoveredExtension } from '../../server';
import { ExtensionOpaqueId, PackageInfo, EnvironmentMode } from '../../server/types';
import { CoreContext } from '../core_system';
import { ExtensionWrapper } from './extension';
import { ExtensionsServiceSetupDeps, ExtensionsServiceStartDeps } from './extensions_service';
import { CoreSetupForExtension, CoreStart } from '../';

/**
 * The available core services passed to a `ExtensionInitializer`
 *
 * @public
 */
export interface ExtensionInitializerContext<ConfigSchema extends object = object> {
  /**
   * A symbol used to identify this extension in the system. Needed when registering handlers or context providers.
   */
  readonly opaqueId: ExtensionOpaqueId;
  readonly env: {
    mode: Readonly<EnvironmentMode>;
    packageInfo: Readonly<PackageInfo>;
  };
  readonly config: {
    get: <T extends object = ConfigSchema>() => T;
  };
}

/**
 * Provides a extension-specific context passed to the extension's construtor. This is currently
 * empty but should provide static services in the future, such as config and logging.
 *
 * @param coreContext
 * @param opaqueId
 * @param extensionManifest
 * @param extensionConfig
 * @internal
 */
export function createExtensionInitializerContext(
  coreContext: CoreContext,
  opaqueId: ExtensionOpaqueId,
  extensionManifest: DiscoveredExtension,
  extensionConfig: {
    [key: string]: unknown;
  }
): ExtensionInitializerContext {
  return {
    opaqueId,
    env: coreContext.env,
    config: {
      get<T>() {
        return (extensionConfig as unknown) as T;
      },
    },
  };
}

/**
 * Provides a extension-specific context passed to the extension's `setup` lifecycle event. Currently
 * this returns a shallow copy the service setup contracts, but in the future could provide
 * extension-scoped versions of the service.
 *
 * @param coreContext
 * @param deps
 * @param extension
 * @internal
 */
export function createExtensionSetupContext<
  TSetup,
  TStart,
  TExtensionsSetup extends object,
  TExtensionsStart extends object
>(
  coreContext: CoreContext,
  deps: ExtensionsServiceSetupDeps,
  extension: ExtensionWrapper<TSetup, TStart, TExtensionsSetup, TExtensionsStart>
): CoreSetupForExtension {
  return {
    application: {
      register: (app) => deps.application.register(extension.opaqueId, app),
      registerAppUpdater: (statusUpdater$) => deps.application.registerAppUpdater(statusUpdater$),
      registerMountContext: (contextName, provider) =>
        deps.application.registerMountContext(extension.opaqueId, contextName, provider),
    },
    context: deps.context,
    fatalErrors: deps.fatalErrors,
    http: deps.http,
    notifications: deps.notifications,
    uiSettings: deps.uiSettings,
    injectedMetadata: {
      getInjectedVar: deps.injectedMetadata.getInjectedVar,
      getBranding: deps.injectedMetadata.getBranding,
    },
    getStartServices: () => extension.startDependencies,
  };
}

/**
 * Provides a extension-specific context passed to the extension's `start` lifecycle event. Currently
 * this returns a shallow copy the service start contracts, but in the future could provide
 * extension-scoped versions of the service.
 *
 * @param coreContext
 * @param deps
 * @param extension
 * @internal
 */
export function createExtensionStartContext<
  TSetup,
  TStart,
  TExtensionsSetup extends object,
  TExtensionsStart extends object
>(
  coreContext: CoreContext,
  deps: ExtensionsServiceStartDeps,
  extension: ExtensionWrapper<TSetup, TStart, TExtensionsSetup, TExtensionsStart>
): CoreStart {
  return {
    application: {
      applications$: deps.application.applications$,
      currentAppId$: deps.application.currentAppId$,
      capabilities: deps.application.capabilities,
      navigateToApp: deps.application.navigateToApp,
      navigateToUrl: deps.application.navigateToUrl,
      getUrlForApp: deps.application.getUrlForApp,
      registerMountContext: (contextName, provider) =>
        deps.application.registerMountContext(extension.opaqueId, contextName, provider),
    },
    docLinks: deps.docLinks,
    http: deps.http,
    chrome: omit(deps.chrome, 'getComponent'),
    i18n: deps.i18n,
    notifications: deps.notifications,
    overlays: deps.overlays,
    uiSettings: deps.uiSettings,
    savedObjects: deps.savedObjects,
    injectedMetadata: {
      getInjectedVar: deps.injectedMetadata.getInjectedVar,
      getBranding: deps.injectedMetadata.getBranding,
    },
    fatalErrors: deps.fatalErrors,
  };
}
