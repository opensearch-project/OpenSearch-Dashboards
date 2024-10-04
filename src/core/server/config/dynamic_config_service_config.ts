/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema, TypeOf } from '@osd/config-schema';
import { ServiceConfigDescriptor } from '../internal_types';

export type DynamicConfigServiceConfigType = TypeOf<typeof configSchema>;

export const configSchema = schema.object({
  skipMigrations: schema.boolean({ defaultValue: false }),
  // If not enabled, the core service will exist but the client returned will just return static configs
  enabled: schema.boolean({ defaultValue: false }),
});

export const config: ServiceConfigDescriptor<DynamicConfigServiceConfigType> = {
  path: 'dynamic_config_service',
  schema: configSchema,
};
