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

import { Plugin, PluginConfigDescriptor } from 'opensearch-dashboards/server';
import { CoreSetup, PluginInitializerContext } from 'src/core/server';
import { Observable } from 'rxjs';
import { configSchema, MapsLegacyConfig } from '../config';
import { getUiSettings } from './ui_settings';

export const config: PluginConfigDescriptor<MapsLegacyConfig> = {
  exposeToBrowser: {
    includeOpenSearchMapsService: true,
    proxyOpenSearchMapsServiceInMaps: true,
    showRegionDeniedWarning: true,
    tilemap: true,
    regionmap: true,
    manifestServiceUrl: true,
    opensearchManifestServiceUrl: true,
    emsFileApiUrl: true,
    emsTileApiUrl: true,
    emsLandingPageUrl: true,
    emsFontLibraryUrl: true,
    emsTileLayerId: true,
  },
  schema: configSchema,
  deprecations: ({ renameFromRoot }) => [
    renameFromRoot('map.includeElasticMapsService', 'map.includeOpenSearchMapsService'),
    renameFromRoot('map.proxyOpenSearchMapsServiceInMaps', 'map.proxyElasticMapsServiceInMaps'),
    renameFromRoot(
      'map.regionmap.includeElasticMapsService',
      'map.regionmap.includeOpenSearchMapsService'
    ),
    renameFromRoot('map.showRegionBlockedWarning', 'map.showRegionDeniedWarning'),
  ],
};

export interface MapsLegacyPluginSetup {
  config$: Observable<MapsLegacyConfig>;
}

export class MapsLegacyPlugin implements Plugin<MapsLegacyPluginSetup> {
  readonly _initializerContext: PluginInitializerContext<MapsLegacyConfig>;

  constructor(initializerContext: PluginInitializerContext<MapsLegacyConfig>) {
    this._initializerContext = initializerContext;
  }

  public setup(core: CoreSetup) {
    core.uiSettings.register(getUiSettings());

    // @ts-ignore
    const config$ = this._initializerContext.config.create();
    return {
      config$,
    };
  }

  public start() {}
}

export const plugin = (initializerContext: PluginInitializerContext) =>
  new MapsLegacyPlugin(initializerContext);
