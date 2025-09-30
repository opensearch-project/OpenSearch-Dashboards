/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
} from 'opensearch-dashboards/server';

import { ConfigSchema } from '../common/config';

export class DatasetManagementPlugin implements Plugin<{}, {}> {
  private readonly logger: Logger;

  constructor(initializerContext: PluginInitializerContext<ConfigSchema>) {
    this.logger = initializerContext.logger.get();
  }

  public setup(core: CoreSetup) {
    this.logger.debug('dataset_management: Setup');
    return {};
  }

  public start(core: CoreStart) {
    this.logger.debug('dataset_management: Started');
    return {};
  }

  public stop() {}
}
