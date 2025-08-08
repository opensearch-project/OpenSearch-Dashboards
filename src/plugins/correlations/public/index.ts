/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginInitializerContext } from '../../../core/public';
import { CorrelationsPlugin } from './plugin';

export const plugin = (initializerContext: PluginInitializerContext) => {
  return new CorrelationsPlugin(initializerContext);
};

export type { CorrelationsSetup, CorrelationsStart } from './plugin';
