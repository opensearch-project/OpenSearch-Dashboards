/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';

/**
 * CSP modifications config schema for dynamic config service.
 */
export const config = {
  path: 'csp-modifications',
  schema: schema.object({
    modifications: schema.arrayOf(
      schema.object({
        directive: schema.string(),
        action: schema.oneOf([
          schema.literal('add'),
          schema.literal('remove'),
          schema.literal('set'),
        ]),
        values: schema.arrayOf(schema.string()),
      }),
      { defaultValue: [] }
    ),
  }),
};
