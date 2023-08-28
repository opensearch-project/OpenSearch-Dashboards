/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema, TypeOf } from '@osd/config-schema';

export const configSchema = schema.object({
  dashboardAdmin: schema.object(
    {
      backendRoles: schema.arrayOf(schema.string(), {
        defaultValue: ['dashboard_admin'],
      }),
    },
    {
      defaultValue: {
        backendRoles: ['dashboard_admin'],
      },
    }
  ),
});

export type ConfigSchema = TypeOf<typeof configSchema>;

export const FEATURE_FLAG_KEY_IN_UI_SETTING = 'workspace_enabled';
