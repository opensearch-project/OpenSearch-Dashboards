/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema, TypeOf } from '@osd/config-schema';
import { fileAppenderSchema } from './audit_config';

const KEY_NAME_MIN_LENGTH: number = 1;
const KEY_NAME_MAX_LENGTH: number = 100;
// Wrapping key size should be 32 bytes, as used in envelope encryption algorithms.
const WRAPPING_KEY_SIZE: number = 32;

export const configSchema = schema.object({
  enabled: schema.boolean({ defaultValue: false }),
  hideLocalCluster: schema.boolean({ defaultValue: false }),
  encryption: schema.object({
    wrappingKeyName: schema.string({
      minLength: KEY_NAME_MIN_LENGTH,
      maxLength: KEY_NAME_MAX_LENGTH,
      defaultValue: 'changeme',
    }),
    wrappingKeyNamespace: schema.string({
      minLength: KEY_NAME_MIN_LENGTH,
      maxLength: KEY_NAME_MAX_LENGTH,
      defaultValue: 'changeme',
    }),
    wrappingKey: schema.arrayOf(schema.number(), {
      minSize: WRAPPING_KEY_SIZE,
      maxSize: WRAPPING_KEY_SIZE,
      defaultValue: new Array(32).fill(0),
    }),
  }),
  ssl: schema.object({
    verificationMode: schema.oneOf(
      [schema.literal('none'), schema.literal('certificate'), schema.literal('full')],
      { defaultValue: 'full' }
    ),
    certificateAuthorities: schema.maybe(
      schema.oneOf([schema.string(), schema.arrayOf(schema.string(), { minSize: 1 })])
    ),
  }),
  clientPool: schema.object({
    size: schema.number({ defaultValue: 5 }),
  }),
  audit: schema.object({
    enabled: schema.boolean({ defaultValue: false }),
    appender: fileAppenderSchema,
  }),
  endpointDeniedIPs: schema.maybe(schema.arrayOf(schema.string())),
  authTypes: schema.object({
    NoAuthentication: schema.object({
      enabled: schema.boolean({ defaultValue: true }),
    }),
    UsernamePassword: schema.object({
      enabled: schema.boolean({ defaultValue: true }),
    }),
    AWSSigV4: schema.object({
      enabled: schema.boolean({ defaultValue: true }),
    }),
  }),
});

export type DataSourcePluginConfigType = TypeOf<typeof configSchema>;
