/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginInitializerContext } from '../../../core/server';
import { CorrelationsPlugin } from './plugin';

export function plugin(initializerContext: PluginInitializerContext) {
  return new CorrelationsPlugin(initializerContext);
}

export { CorrelationsSetup, CorrelationsStart } from './types';
