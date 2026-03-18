/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema, TypeOf } from '@osd/config-schema';
import { CHAT_DEFAULT_MAX_FILE_UPLOAD_BYTES, CHAT_MAX_FILE_ATTACHMENTS } from '../common';

export const configSchema = schema.object({
  enabled: schema.boolean({ defaultValue: false }),
  agUiUrl: schema.maybe(schema.string()),
  mlCommonsAgentId: schema.maybe(schema.string()),
  observabilityAgentId: schema.maybe(schema.string()),
  fileUploadEnabled: schema.boolean({ defaultValue: true }),
  maxFileUploadBytes: schema.number({ defaultValue: CHAT_DEFAULT_MAX_FILE_UPLOAD_BYTES, min: 1 }),
  maxFileAttachments: schema.number({ defaultValue: CHAT_MAX_FILE_ATTACHMENTS, min: 1, max: 50 }),
});

export type ChatConfigType = TypeOf<typeof configSchema>;
