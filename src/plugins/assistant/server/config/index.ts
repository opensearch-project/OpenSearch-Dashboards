/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginConfigDescriptor } from '../../../../../core/server';
import { configSchema, AssistantConfigType } from './schema';
export { AssistantConfigType };

export const config: PluginConfigDescriptor<AssistantConfigType> = {
  exposeToBrowser: {
    agent: {
      enabled: true,
      type: true,
    },
  },
  schema: configSchema,
  deprecations: ({ renameFromRoot, unused }) => [
    // Future deprecations can be added here
  ],
};

export type { AssistantConfigType };
