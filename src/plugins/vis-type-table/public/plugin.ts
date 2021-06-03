/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
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

/*
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */
import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
} from 'opensearch-dashboards/public';
import { Plugin as ExpressionsPublicPlugin } from '../../expressions/public';
import { VisualizationsSetup } from '../../visualizations/public';

import { createTableVisFn } from './table_vis_fn';
import { getTableVisTypeDefinition } from './table_vis_type';
import { DataPublicPluginStart } from '../../data/public';
import { setFormatService, setOpenSearchDashboardsLegacy } from './services';
import { OpenSearchDashboardsLegacyStart } from '../../opensearch_dashboards_legacy/public';

/** @internal */
export interface TablePluginSetupDependencies {
  expressions: ReturnType<ExpressionsPublicPlugin['setup']>;
  visualizations: VisualizationsSetup;
}

/** @internal */
export interface TablePluginStartDependencies {
  data: DataPublicPluginStart;
  opensearchDashboardsLegacy: OpenSearchDashboardsLegacyStart;
}

/** @internal */
export class TableVisPlugin implements Plugin<Promise<void>, void> {
  initializerContext: PluginInitializerContext;
  createBaseVisualization: any;

  constructor(initializerContext: PluginInitializerContext) {
    this.initializerContext = initializerContext;
  }

  public async setup(
    core: CoreSetup,
    { expressions, visualizations }: TablePluginSetupDependencies
  ) {
    expressions.registerFunction(createTableVisFn);
    visualizations.createBaseVisualization(
      getTableVisTypeDefinition(core, this.initializerContext)
    );
  }

  public start(
    core: CoreStart,
    { data, opensearchDashboardsLegacy }: TablePluginStartDependencies
  ) {
    setFormatService(data.fieldFormats);
    setOpenSearchDashboardsLegacy(opensearchDashboardsLegacy);
  }
}
