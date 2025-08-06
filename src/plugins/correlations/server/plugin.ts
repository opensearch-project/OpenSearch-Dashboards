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

import { correlationsSavedObjectType } from './saved_objects';
import { CorrelationsSetup, CorrelationsStart } from './types';

export class CorrelationsPlugin implements Plugin<CorrelationsSetup, CorrelationsStart> {
  private readonly logger: Logger;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public setup(core: CoreSetup) {
    this.logger.debug('correlations: Setup');

    core.savedObjects.registerType(correlationsSavedObjectType);

    return {};
  }

  public start(core: CoreStart) {
    this.logger.debug('correlations: Started');
    return {};
  }

  public stop() {}
}
