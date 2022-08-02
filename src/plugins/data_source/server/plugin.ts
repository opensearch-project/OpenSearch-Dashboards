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

import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
} from '../../../core/server';

import { DataSourcePluginSetup, DataSourcePluginStart } from './types';

export class DataSourcePlugin implements Plugin<DataSourcePluginSetup, DataSourcePluginStart> {
  private readonly logger: Logger;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public setup(core: CoreSetup) {
    this.logger.debug('data_source: Setup');

    return {};
  }

  public start(core: CoreStart) {
    this.logger.debug('data_source: Started');
    return {};
  }

  public stop() {}
}
