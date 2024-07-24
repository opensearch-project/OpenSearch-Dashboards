/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema, TypeOf } from '@osd/config-schema';

export const configSchema = schema.object({
  manageableBy: schema.oneOf(
    [schema.literal('all'), schema.literal('dashboard_admin'), schema.literal('none')],
    { defaultValue: 'all' }
  ),
});

export type ConfigSchema = TypeOf<typeof configSchema>;
