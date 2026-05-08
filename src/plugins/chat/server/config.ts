/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema, TypeOf } from '@osd/config-schema';

export const configSchema = schema.object({
  enabled: schema.boolean({ defaultValue: false }),
  agUiUrl: schema.maybe(schema.string()),
  forwardCredentials: schema.boolean({ defaultValue: false }),
  mlCommonsAgentId: schema.maybe(schema.string()),
  observabilityAgentId: schema.maybe(schema.string()),
});

export type ChatConfigType = TypeOf<typeof configSchema>;
