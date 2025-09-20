/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema, TypeOf } from '@osd/config-schema';

export const configSchema = schema.object({
  enabled: schema.boolean({ defaultValue: true }),
  stdio: schema.object({
    enabled: schema.boolean({ defaultValue: true }),
    autoStart: schema.boolean({ defaultValue: true }),
  }),
});

export type OsdMcpServerConfig = TypeOf<typeof configSchema>;