/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
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
import { setFormatService } from './services';
import { ConfigSchema } from '../config';
import { getTableVisRenderer } from './table_vis_renderer';
export interface TableVisPluginSetupDependencies {
  expressions: ReturnType<ExpressionsPublicPlugin['setup']>;
  visualizations: VisualizationsSetup;
}
export interface TableVisPluginStartDependencies {
  data: DataPublicPluginStart;
}

const setupTableVis = async (
  core: CoreSetup,
  { expressions, visualizations }: TableVisPluginSetupDependencies
) => {
  const [coreStart] = await core.getStartServices();
  expressions.registerFunction(createTableVisFn);
  expressions.registerRenderer(getTableVisRenderer(coreStart));
  visualizations.createBaseVisualization(getTableVisTypeDefinition());
};
export class TableVisPlugin implements Plugin<void, void> {
  initializerContext: PluginInitializerContext<ConfigSchema>;

  constructor(initializerContext: PluginInitializerContext<ConfigSchema>) {
    this.initializerContext = initializerContext;
  }

  public async setup(core: CoreSetup, dependencies: TableVisPluginSetupDependencies) {
    setupTableVis(core, dependencies);
  }

  public start(core: CoreStart, { data }: TableVisPluginStartDependencies) {
    setFormatService(data.fieldFormats);
  }
}
