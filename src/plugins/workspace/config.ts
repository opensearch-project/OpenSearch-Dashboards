/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema, TypeOf } from '@osd/config-schema';

export const configSchema = schema.object({
  enabled: schema.boolean({ defaultValue: false }),
  permission: schema.object({
    enabled: schema.boolean({ defaultValue: true }),
  }),
});

export type WorkspacePluginConfigType = TypeOf<typeof configSchema>;
