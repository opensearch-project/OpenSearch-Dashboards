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

import { Server } from '@hapi/hapi';

import {
  CoreSetup,
  CoreStart,
  EnvironmentMode,
  LoggerFactory,
  PackageInfo,
  LegacyServiceSetupDeps,
} from '../../core/server';

// eslint-disable-next-line @osd/eslint/no-restricted-paths
import { LegacyConfig } from '../../core/server/legacy';
// eslint-disable-next-line @osd/eslint/no-restricted-paths
import { UiPlugins } from '../../core/server/plugins';

// lot of legacy code was assuming this type only had these two methods
export type OpenSearchDashboardsConfig = Pick<LegacyConfig, 'get' | 'has'>;

// Extend the defaults with the plugins and server methods we need.
declare module 'hapi' {
  interface PluginProperties {
    spaces: any;
  }

  interface Server {
    config: () => OpenSearchDashboardsConfig;
    logWithMetadata: (tags: string[], message: string, meta: Record<string, any>) => void;
    newPlatform: OsdServer['newPlatform'];
  }
}

type OsdMixinFunc = (osdServer: OsdServer, server: Server, config: any) => Promise<any> | void;

export interface PluginsSetup {
  [key: string]: object;
}

export interface OpenSearchDashboardsCore {
  __internals: {
    hapiServer: LegacyServiceSetupDeps['core']['http']['server'];
    rendering: LegacyServiceSetupDeps['core']['rendering'];
    uiPlugins: UiPlugins;
  };
  env: {
    mode: Readonly<EnvironmentMode>;
    packageInfo: Readonly<PackageInfo>;
  };
  setupDeps: {
    core: CoreSetup;
    plugins: PluginsSetup;
  };
  startDeps: {
    core: CoreStart;
    plugins: Record<string, object>;
  };
  logger: LoggerFactory;
}

export interface NewPlatform {
  __internals: OpenSearchDashboardsCore['__internals'];
  env: OpenSearchDashboardsCore['env'];
  coreContext: {
    logger: OpenSearchDashboardsCore['logger'];
  };
  setup: OpenSearchDashboardsCore['setupDeps'];
  start: OpenSearchDashboardsCore['startDeps'];
  stop: null;
}

// eslint-disable-next-line import/no-default-export
export default class OsdServer {
  public readonly newPlatform: NewPlatform;
  public server: Server;
  public inject: Server['inject'];

  constructor(
    settings: Record<string, any>,
    config: OpenSearchDashboardsConfig,
    core: OpenSearchDashboardsCore
  );

  public ready(): Promise<void>;
  public mixin(...fns: OsdMixinFunc[]): Promise<void>;
  public listen(): Promise<Server>;
  public close(): Promise<void>;
  public applyLoggingConfiguration(settings: any): void;
  public config: OpenSearchDashboardsConfig;
}

// Re-export commonly used hapi types.
export { Server, Request, ResponseToolkit } from '@hapi/hapi';
