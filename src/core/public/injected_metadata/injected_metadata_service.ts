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

import { get } from 'lodash';
import { deepFreeze } from '@osd/std';
import { DiscoveredPlugin, PluginName } from '../../server';
import {
  EnvironmentMode,
  PackageInfo,
  UiSettingsParams,
  UserProvidedValues,
} from '../../server/types';
import { AppCategory, Branding } from '../';

export interface InjectedPluginMetadata {
  id: PluginName;
  plugin: DiscoveredPlugin;
  config?: {
    [key: string]: unknown;
  };
}

/** @internal */
export interface InjectedMetadataParams {
  injectedMetadata: {
    version: string;
    buildNumber: number;
    branch: string;
    basePath: string;
    serverBasePath: string;
    category?: AppCategory;
    csp: {
      warnLegacyBrowsers: boolean;
    };
    vars: {
      [key: string]: unknown;
    };
    env: {
      mode: Readonly<EnvironmentMode>;
      packageInfo: Readonly<PackageInfo>;
    };
    uiPlugins: InjectedPluginMetadata[];
    anonymousStatusPage: boolean;
    legacyMetadata: {
      uiSettings: {
        defaults: Record<string, UiSettingsParams>;
        user?: Record<string, UserProvidedValues>;
      };
    };
    branding: Branding;
    survey?: string;
  };
}

/**
 * Provides access to the metadata that is injected by the
 * server into the page. The metadata is actually defined
 * in the entry file for the bundle containing the new platform
 * and is read from the DOM in most cases.
 *
 * @internal
 */
export class InjectedMetadataService {
  private state = deepFreeze(
    this.params.injectedMetadata
  ) as InjectedMetadataParams['injectedMetadata'];

  constructor(private readonly params: InjectedMetadataParams) {}

  public start(): InjectedMetadataStart {
    return this.setup();
  }

  public setup(): InjectedMetadataSetup {
    return {
      getBasePath: () => {
        return this.state.basePath;
      },

      getServerBasePath: () => {
        return this.state.serverBasePath;
      },

      getAnonymousStatusPage: () => {
        return this.state.anonymousStatusPage;
      },

      getOpenSearchDashboardsVersion: () => {
        return this.state.version;
      },

      getCspConfig: () => {
        return this.state.csp;
      },

      getPlugins: () => {
        return this.state.uiPlugins;
      },

      getLegacyMetadata: () => {
        return this.state.legacyMetadata;
      },

      getInjectedVar: (name: string, defaultValue?: any): unknown => {
        return get(this.state.vars, name, defaultValue);
      },

      getInjectedVars: () => {
        return this.state.vars;
      },

      getOpenSearchDashboardsBuildNumber: () => {
        return this.state.buildNumber;
      },

      getOpenSearchDashboardsBranch: () => {
        return this.state.branch;
      },

      getBranding: () => {
        return this.state.branding;
      },

      getSurvey: () => {
        return this.state.survey;
      },
    };
  }
}

/**
 * Provides access to the metadata injected by the server into the page
 *
 * @internal
 */
export interface InjectedMetadataSetup {
  getBasePath: () => string;
  getServerBasePath: () => string;
  getOpenSearchDashboardsBuildNumber: () => number;
  getOpenSearchDashboardsBranch: () => string;
  getOpenSearchDashboardsVersion: () => string;
  getCspConfig: () => {
    warnLegacyBrowsers: boolean;
  };
  /**
   * An array of frontend plugins in topological order.
   */
  getPlugins: () => InjectedPluginMetadata[];
  getAnonymousStatusPage: () => boolean;
  getLegacyMetadata: () => {
    uiSettings: {
      defaults: Record<string, UiSettingsParams>;
      user?: Record<string, UserProvidedValues> | undefined;
    };
  };
  getInjectedVar: (name: string, defaultValue?: any) => unknown;
  getInjectedVars: () => {
    [key: string]: unknown;
  };
  getBranding: () => Branding;
  getSurvey: () => string | undefined;
}

/** @internal */
export type InjectedMetadataStart = InjectedMetadataSetup;
