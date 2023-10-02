/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema, TypeOf } from '@osd/config-schema';

export const configSchema = schema.object({
  pluginAugmentationEnabled: schema.boolean({ defaultValue: true }),
});

export type VisAugmenterPluginConfigType = TypeOf<typeof configSchema>;
