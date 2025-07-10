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

export type BannerPluginConfigType = TypeOf<typeof configSchema>;

export const configSchema = schema.object({
  enabled: schema.boolean({ defaultValue: false }),
  text: schema.string({
    defaultValue:
      'This is an important announcement for all users. [Learn more](https://opensearch.org) about OpenSearch.',
  }),
  color: schema.oneOf(
    [schema.literal('primary'), schema.literal('success'), schema.literal('warning')],
    { defaultValue: 'primary' }
  ),
  iconType: schema.string({ defaultValue: 'iInCircle' }),
  isVisible: schema.boolean({ defaultValue: true }),
  useMarkdown: schema.boolean({ defaultValue: true }),
});
