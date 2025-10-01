/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema, TypeOf } from '@osd/config-schema';
import { CHAT_DEFAULT_AG_UI_URL } from '../common';

export const configSchema = schema.object({
  enabled: schema.boolean({ defaultValue: true }),
  agUiUrl: schema.string({ defaultValue: CHAT_DEFAULT_AG_UI_URL }),
});

export type ChatConfigType = TypeOf<typeof configSchema>;
