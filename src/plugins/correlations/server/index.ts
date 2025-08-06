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

import { PluginInitializerContext } from '../../../core/server';
import { CorrelationsPlugin } from './plugin';

export function plugin(initializerContext: PluginInitializerContext) {
  return new CorrelationsPlugin(initializerContext);
}

export { CorrelationsSetup, CorrelationsStart } from './types';
