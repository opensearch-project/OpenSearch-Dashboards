/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TypeOf, schema } from '@osd/config-schema';

/**
 * @internal
 */
export type CspReportOnlyConfigType = TypeOf<typeof config.schema>;

export const config = {
  path: 'csp-report-only',
  schema: schema.object({
    isEmitting: schema.boolean({ defaultValue: false }),
    rules: schema.arrayOf(schema.string(), {
      defaultValue: [`script-src 'self'`, `worker-src 'self'`, `style-src 'self'`],
    }),
  }),
};
