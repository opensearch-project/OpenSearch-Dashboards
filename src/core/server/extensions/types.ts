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

import { Observable } from 'rxjs';
import { Type } from '@osd/config-schema';
import { RecursiveReadonly } from '@osd/utility-types';
import { PathConfigType } from '@osd/utils';

import { ConfigPath, EnvironmentMode, PackageInfo, ConfigDeprecationProvider } from '../config';
import { LoggerFactory } from '../logging';
import { OpenSearchDashboardsConfigType } from '../opensearch_dashboards_config';
import { OpenSearchConfigType } from '../opensearch/opensearch_config';
import { SavedObjectsConfigType } from '../saved_objects/saved_objects_config';
import { CoreSetup, CoreStart, PluginName } from '..';

/**
 * Dedicated type for extension configuration schema.
 *
 * @public
 */
export type ExtensionConfigSchema<T> = Type<T>;

/**
 * Describes a extension configuration properties.
 *
 * @example
 * ```typescript
 * // my_extension/server/index.ts
 * import { schema, TypeOf } from '@osd/config-schema';
 * import { ExtensionConfigDescriptor } from 'opensearch_dashboards/server';
 *
 * const configSchema = schema.object({
 *   secret: schema.string({ defaultValue: 'Only on server' }),
 *   uiProp: schema.string({ defaultValue: 'Accessible from client' }),
 * });
 *
 * type ConfigType = TypeOf<typeof configSchema>;
 *
 * export const config: ExtensionConfigDescriptor<ConfigType> = {
 *   exposeToBrowser: {
 *     uiProp: true,
 *   },
 *   schema: configSchema,
 *   deprecations: ({ rename, unused }) => [
 *     rename('securityKey', 'secret'),
 *     unused('deprecatedProperty'),
 *   ],
 * };
 * ```
 *
 * @public
 */
export interface ExtensionConfigDescriptor<T = any> {
  /**
   * Provider for the {@link ConfigDeprecation} to apply to the extension configuration.
   */
  deprecations?: ConfigDeprecationProvider;
  /**
   * List of configuration properties that will be available on the client-side extension.
   */
  exposeToBrowser?: { [P in keyof T]?: boolean };
  /**
   * Schema to use to validate the extension configuration.
   *
   * {@link ExtensionConfigSchema}
   */
  schema: ExtensionConfigSchema<T>;
}

/**
 * Dedicated type for extension name/id that is supposed to make Map/Set/Arrays
 * that use it as a key or value more obvious.
 *
 * @public
 */
export type ExtensionName = string;

/** @public */
export type ExtensionOpaqueId = symbol;

/** @internal */
export interface ExtensionDependencies {
  asNames: ReadonlyMap<ExtensionName, ExtensionName[]>;
  asOpaqueIds: ReadonlyMap<ExtensionOpaqueId, ExtensionOpaqueId[]>;
}

/**
 * Describes the set of required and optional properties extension can define in its
 * mandatory JSON manifest file.
 *
 * @remarks
 * Should never be used in code outside of Core but is exported for
 * documentation purposes.
 *
 * @public
 */
export interface ExtensionManifest {
  /**
   * Identifier of the extension. Must be a string in camelCase. Part of a extension public contract.
   * Other extensions leverage it to access extension API, navigate to the extension, etc.
   */
  readonly extensionId: ExtensionName;

  /**
   * Version of the extension.
   */
  readonly version: string;

  /**
   * The version of OpenSearch Dashboards the extension is compatible with, defaults to "version".
   */
  readonly opensearchDashboardsVersion: string;

  /**
   * Root {@link ConfigPath | configuration path} used by the extension, defaults
   * to "id" in snake_case format.
   *
   * @example
   * id: myExtension
   * configPath: my_extension
   */
  readonly configPath: ConfigPath;

  /**
   * An optional list of the other extensions that **must be** installed and enabled
   * for this extension to function properly.
   */
  readonly requiredExtensions: readonly ExtensionName[];

  /**
   * List of extension ids that this extension's UI code imports modules from that are
   * not in `requiredExtensions`.
   *
   * @remarks
   * The extensions listed here will be loaded in the browser, even if the extension is
   * disabled. Required by `@osd/optimizer` to support cross-extension imports.
   * "core" and extensions already listed in `requiredExtensions` do not need to be
   * duplicated here.
   */
  readonly requiredBundles: readonly string[];

  /**
   * An optional list of the other extensions that if installed and enabled **may be**
   * leveraged by this extension for some additional functionality but otherwise are
   * not required for this extension to work properly.
   */
  readonly optionalExtensions: readonly ExtensionName[];

  /**
   * An optional list of the other plugins that **must be** installed and enabled
   * for this extension to function properly.
   */
  readonly requiredPlugins: readonly PluginName[];

  /**
   * An optional list of the other plugins that if installed and enabled **may be**
   * leveraged by this extension for some additional functionality but otherwise are
   * not required for this extension to work properly.
   */
  readonly optionalPlugins: readonly PluginName[];

  /**
   * Specifies whether extension includes some client/browser specific functionality
   * that should be included into client bundle via `public/ui_extension.js` file.
   */
  readonly ui: boolean;

  /**
   * Specifies whether extension includes some server-side specific functionality.
   */
  readonly server: boolean;

  /**
   * Specifies directory names that can be imported by other ui-extensions built
   * using the same instance of the @osd/optimizer. A temporary measure we plan
   * to replace with better mechanisms for sharing static code between extensions
   * @deprecated
   */
  readonly extraPublicDirs?: string[];
}

/**
 * Small container object used to expose information about discovered extensions that may
 * or may not have been started.
 * @public
 */
export interface DiscoveredExtension {
  /**
   * Identifier of the extension.
   */
  readonly extensionId: ExtensionName;

  /**
   * Root configuration path used by the extension, defaults to "id" in snake_case format.
   */
  readonly configPath: ConfigPath;

  /**
   * An optional list of the other extensions that **must be** installed and enabled
   * for this extension to function properly.
   */
  readonly requiredExtensions: readonly ExtensionName[];

  /**
   * An optional list of the other extensions that if installed and enabled **may be**
   * leveraged by this extension for some additional functionality but otherwise are
   * not required for this extension to work properly.
   */
  readonly optionalExtensions: readonly ExtensionName[];

  /**
   * List of extension ids that this extension's UI code imports modules from that are
   * not in `requiredExtensions`.
   *
   * @remarks
   * The extensions listed here will be loaded in the browser, even if the extension is
   * disabled. Required by `@osd/optimizer` to support cross-extension imports.
   * "core" and extensions already listed in `requiredExtensions` do not need to be
   * duplicated here.
   */
  readonly requiredBundles: readonly ExtensionName[];

  /**
   * An optional list of the other plugins that **must be** installed and enabled
   * for this extension to function properly.
   */
  readonly requiredPlugins: readonly PluginName[];

  /**
   * An optional list of the other plugins that if installed and enabled **may be**
   * leveraged by this extension for some additional functionality but otherwise are
   * not required for this extension to work properly.
   */
  readonly optionalPlugins: readonly PluginName[];
}

/**
 * @internal
 */
export interface InternalExtensionInfo {
  /**
   * Bundles that must be loaded for this plugoin
   */
  readonly requiredBundles: readonly string[];
  /**
   * Path to the target/public directory of the extension which should be
   * served
   */
  readonly publicTargetDir: string;
  /**
   * Path to the extension assets directory.
   */
  readonly publicAssetsDir: string;
}

/**
 * The interface that should be returned by a `ExtensionInitializer`.
 *
 * @public
 */
export interface Extension<
  TSetup = void,
  TStart = void,
  TExtensionsSetup extends object = object,
  TExtensionsStart extends object = object
> {
  setup(core: CoreSetup, extensions: TExtensionsSetup): TSetup | Promise<TSetup>;
  start(core: CoreStart, extensions: TExtensionsStart): TStart | Promise<TStart>;
  stop?(): void;
}

export const SharedGlobalConfigKeys = {
  // We can add more if really needed
  opensearchDashboards: ['index', 'autocompleteTerminateAfter', 'autocompleteTimeout'] as const,
  opensearch: ['shardTimeout', 'requestTimeout', 'pingTimeout'] as const,
  path: ['data'] as const,
  savedObjects: ['maxImportPayloadBytes'] as const,
};

/**
 * @public
 */
export type SharedGlobalConfig = RecursiveReadonly<{
  opensearchDashboards: Pick<
    OpenSearchDashboardsConfigType,
    typeof SharedGlobalConfigKeys.opensearchDashboards[number]
  >;
  opensearch: Pick<OpenSearchConfigType, typeof SharedGlobalConfigKeys.opensearch[number]>;
  path: Pick<PathConfigType, typeof SharedGlobalConfigKeys.path[number]>;
  savedObjects: Pick<SavedObjectsConfigType, typeof SharedGlobalConfigKeys.savedObjects[number]>;
}>;

/**
 * Context that's available to extensions during initialization stage.
 *
 * @public
 */
export interface ExtensionInitializerContext<ConfigSchema = unknown> {
  opaqueId: ExtensionOpaqueId;
  env: {
    mode: EnvironmentMode;
    packageInfo: Readonly<PackageInfo>;
    instanceUuid: string;
  };
  logger: LoggerFactory;
  config: {
    legacy: { globalConfig$: Observable<SharedGlobalConfig> };
    create: <T = ConfigSchema>() => Observable<T>;
    createIfExists: <T = ConfigSchema>() => Observable<T | undefined>;
  };
}

/**
 * The `extension` export at the root of a extension's `server` directory should conform
 * to this interface.
 *
 * @public
 */
export type ExtensionInitializer<
  TSetup,
  TStart,
  TExtensionsSetup extends object = object,
  TExtensionsStart extends object = object
> = (
  core: ExtensionInitializerContext
) => Extension<TSetup, TStart, TExtensionsSetup, TExtensionsStart>;
