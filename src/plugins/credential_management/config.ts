/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { schema, TypeOf } from '@osd/config-schema';

export const configSchema = schema.object({
  keyName: schema.string({
    defaultValue: 'keyName',
  }),
  keyNamespace: schema.string({
    defaultValue: 'keyNamespace',
  }),
  materialPath: schema.string({
    defaultValue: 'data/crypto_material',
  }),
});

export type ConfigSchema = TypeOf<typeof configSchema>;
