/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OsdMcpServerPlugin } from './plugin';

export function plugin() {
  return new OsdMcpServerPlugin();
}

export { OsdMcpServerPluginSetup, OsdMcpServerPluginStart } from './plugin';