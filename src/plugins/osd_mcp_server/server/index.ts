/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginInitializerContext } from '../../../core/server';
import { OsdMcpServerPlugin } from './plugin';

export function plugin(initializerContext: PluginInitializerContext) {
  return new OsdMcpServerPlugin(initializerContext);
}

export {
  OsdMcpServerPluginSetup,
  OsdMcpServerPluginStart,
} from './plugin';
export { configSchema } from '../config';