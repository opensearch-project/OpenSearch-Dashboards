/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreSetup, CoreStart, Plugin } from 'opensearch-dashboards/public';
import { Plugin as ExpressionsPublicPlugin } from '../../expressions/public';

import { createTableVisFn } from './table_vis_fn';
import { DataPublicPluginStart } from '../../data/public';
import { setFormatService } from './services';
import { getTableVisRenderer } from './table_vis_renderer';

export interface TableVisPluginSetupDependencies {
  expressions: ReturnType<ExpressionsPublicPlugin['setup']>;
}

export interface TableVisPluginStartDependencies {
  data: DataPublicPluginStart;
}

const setupTableVis = async (core: CoreSetup, { expressions }: TableVisPluginSetupDependencies) => {
  const [coreStart] = await core.getStartServices();
  expressions.registerFunction(createTableVisFn);
  expressions.registerRenderer(getTableVisRenderer(coreStart));
};

export class TableVisPlugin implements Plugin<void, void> {
  public async setup(core: CoreSetup, dependencies: TableVisPluginSetupDependencies) {
    setupTableVis(core, dependencies);
  }

  public start(core: CoreStart, { data }: TableVisPluginStartDependencies) {
    setFormatService(data.fieldFormats);
  }
}
