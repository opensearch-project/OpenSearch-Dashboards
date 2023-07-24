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

import { Observable } from 'rxjs';
import { Type } from '@osd/config-schema';
import { RecursiveReadonly } from '@osd/utility-types';
import { PathConfigType } from '@osd/utils';

import { ConfigPath, EnvironmentMode, PackageInfo, ConfigDeprecationProvider } from '../config';
import { LoggerFactory } from '../logging';
import { OpenSearchDashboardsConfigType } from '../opensearch_dashboards_config';
import { OpenSearchConfigType } from '../opensearch/opensearch_config';
import { SavedObjectsConfigType } from '../saved_objects/saved_objects_config';
import { CoreSetup, CoreStart } from '..';

/**
 * Dedicated type for plugin configuration schema.
 *
 * @public
 */
export type PluginConfigSchema<T> = Type<T>;

/**
 * Describes a plugin configuration properties.
 *
 * @example
 * ```typescript
 * // my_plugin/server/index.ts
 * import { schema, TypeOf } from '@osd/config-schema';
 * import { PluginConfigDescriptor } from 'opensearch_dashboards/server';
 *
 * const configSchema = schema.object({
 *   secret: schema.string({ defaultValue: 'Only on server' }),
 *   uiProp: schema.string({ defaultValue: 'Accessible from client' }),
 * });
 *
 * type ConfigType = TypeOf<typeof configSchema>;
 *
 * export const config: PluginConfigDescriptor<ConfigType> = {
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
export interface PluginConfigDescriptor<T = any> {
  /**
   * Provider for the {@link ConfigDeprecation} to apply to the plugin configuration.
   */
  deprecations?: ConfigDeprecationProvider;
  /**
   * List of configuration properties that will be available on the client-side plugin.
   */
  exposeToBrowser?: { [P in keyof T]?: boolean };
  /**
   * Schema to use to validate the plugin configuration.
   *
   * {@link PluginConfigSchema}
   */
  schema: PluginConfigSchema<T>;
}

/**
 * Dedicated type for plugin name/id that is supposed to make Map/Set/Arrays
 * that use it as a key or value more obvious.
 *
 * @public
 */
export type PluginName = string;

/** @public */
export type PluginOpaqueId = symbol;

/** @public */
export type CompatibleEnginePluginVersions = Record<string, string>;

/** @internal */
export interface PluginDependencies {
  asNames: ReadonlyMap<PluginName, PluginName[]>;
  asOpaqueIds: ReadonlyMap<PluginOpaqueId, PluginOpaqueId[]>;
}

/**
 * Describes the set of required and optional properties plugin can define in its
 * mandatory JSON manifest file.
 *
 * @remarks
 * Should never be used in code outside of Core but is exported for
 * documentation purposes.
 *
 * @public
 */
export interface PluginManifest {
  /**
   * Identifier of the plugin. Must be a string in camelCase. Part of a plugin public contract.
   * Other plugins leverage it to access plugin API, navigate to the plugin, etc.
   */
  readonly id: PluginName;

  /**
   * Version of the plugin.
   */
  readonly version: string;

  /**
   * The version of OpenSearch Dashboards the plugin is compatible with, defaults to "version".
   */
  readonly opensearchDashboardsVersion: string;

  /**
   * Root {@link ConfigPath | configuration path} used by the plugin, defaults
   * to "id" in snake_case format.
   *
   * @example
   * id: myPlugin
   * configPath: my_plugin
   */
  readonly configPath: ConfigPath;

  /**
   * An optional list of the other plugins that **must be** installed and enabled
   * for this plugin to function properly.
   */
  readonly requiredPlugins: readonly PluginName[];

  /**
   * An optional list of the OpenSearch plugins that **must be** installed on the cluster
   * for this plugin to function properly.
   */
  readonly requiredEnginePlugins: CompatibleEnginePluginVersions;

  /**
   * List of plugin ids that this plugin's UI code imports modules from that are
   * not in `requiredPlugins`.
   *
   * @remarks
   * The plugins listed here will be loaded in the browser, even if the plugin is
   * disabled. Required by `@osd/optimizer` to support cross-plugin imports.
   * "core" and plugins already listed in `requiredPlugins` do not need to be
   * duplicated here.
   */
  readonly requiredBundles: readonly string[];

  /**
   * An optional list of the other plugins that if installed and enabled **may be**
   * leveraged by this plugin for some additional functionality but otherwise are
   * not required for this plugin to work properly.
   */
  readonly optionalPlugins: readonly PluginName[];

  /**
   * Specifies whether plugin includes some client/browser specific functionality
   * that should be included into client bundle via `public/ui_plugin.js` file.
   */
  readonly ui: boolean;

  /**
   * Specifies whether plugin includes some server-side specific functionality.
   */
  readonly server: boolean;

  /**
   * Specifies directory names that can be imported by other ui-plugins built
   * using the same instance of the @osd/optimizer. A temporary measure we plan
   * to replace with better mechanisms for sharing static code between plugins
   * @deprecated
   */
  readonly extraPublicDirs?: string[];
}

/**
 * Small container object used to expose information about discovered plugins that may
 * or may not have been started.
 * @public
 */
export interface DiscoveredPlugin {
  /**
   * Identifier of the plugin.
   */
  readonly id: PluginName;

  /**
   * Root configuration path used by the plugin, defaults to "id" in snake_case format.
   */
  readonly configPath: ConfigPath;

  /**
   * An optional list of the other plugins that **must be** installed and enabled
   * for this plugin to function properly.
   */
  readonly requiredPlugins: readonly PluginName[];

  /**
   * An optional list of the other plugins that if installed and enabled **may be**
   * leveraged by this plugin for some additional functionality but otherwise are
   * not required for this plugin to work properly.
   */
  readonly optionalPlugins: readonly PluginName[];

  /**
   * List of plugin ids that this plugin's UI code imports modules from that are
   * not in `requiredPlugins`.
   *
   * @remarks
   * The plugins listed here will be loaded in the browser, even if the plugin is
   * disabled. Required by `@osd/optimizer` to support cross-plugin imports.
   * "core" and plugins already listed in `requiredPlugins` do not need to be
   * duplicated here.
   */
  readonly requiredBundles: readonly PluginName[];
}

/**
 * @internal
 */
export interface InternalPluginInfo {
  /**
   * Bundles that must be loaded for this plugoin
   */
  readonly requiredBundles: readonly string[];
  /**
   * Path to the target/public directory of the plugin which should be
   * served
   */
  readonly publicTargetDir: string;
  /**
   * Path to the plugin assets directory.
   */
  readonly publicAssetsDir: string;
}

/**
 * The interface that should be returned by a `PluginInitializer`.
 *
 * @public
 */
export interface Plugin<
  TSetup = void,
  TStart = void,
  TPluginsSetup extends object = object,
  TPluginsStart extends object = object
> {
  setup(core: CoreSetup, plugins: TPluginsSetup): TSetup | Promise<TSetup>;
  start(core: CoreStart, plugins: TPluginsStart): TStart | Promise<TStart>;
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
 * Context that's available to plugins during initialization stage.
 *
 * @public
 */
export interface PluginInitializerContext<ConfigSchema = unknown> {
  opaqueId: PluginOpaqueId;
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
 * The `plugin` export at the root of a plugin's `server` directory should conform
 * to this interface.
 *
 * @public
 */
export type PluginInitializer<
  TSetup,
  TStart,
  TPluginsSetup extends object = object,
  TPluginsStart extends object = object
> = (core: PluginInitializerContext) => Plugin<TSetup, TStart, TPluginsSetup, TPluginsStart>;
