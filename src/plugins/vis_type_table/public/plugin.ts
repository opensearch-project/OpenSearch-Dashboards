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
import { tableVisRenderer } from './table_vis_renderer';

/** @internal */
export interface TableVisPluginSetupDependencies {
  expressions: ReturnType<ExpressionsPublicPlugin['setup']>;
  visualizations: VisualizationsSetup;
}

/** @internal */
export interface TableVisPluginStartDependencies {
  data: DataPublicPluginStart;
}

/** @internal */
export class TableVisPlugin implements Plugin<void, void> {
  initializerContext: PluginInitializerContext<ConfigSchema>;

  constructor(initializerContext: PluginInitializerContext<ConfigSchema>) {
    this.initializerContext = initializerContext;
  }

  public setup(core: CoreSetup, { expressions, visualizations }: TableVisPluginSetupDependencies) {
    expressions.registerFunction(createTableVisFn);
    expressions.registerRenderer(tableVisRenderer);
    visualizations.createBaseVisualization(getTableVisTypeDefinition());
  }

  public start(core: CoreStart, { data }: TableVisPluginStartDependencies) {
    setFormatService(data.fieldFormats);
  }
}
