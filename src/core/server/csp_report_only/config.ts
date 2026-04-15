/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TypeOf, schema } from '@osd/config-schema';
import { STRICT_CSP_RULES_DEFAULT_VALUE } from '../constants';

/**
 * @internal
 */
export type CspReportOnlyConfigType = TypeOf<typeof config.schema>;

export const config = {
  path: 'csp-report-only',
  schema: schema.object({
    isEmitting: schema.boolean({ defaultValue: false }),
    rules: schema.arrayOf(schema.string(), {
      defaultValue: STRICT_CSP_RULES_DEFAULT_VALUE,
    }),
    nonceDirectives: schema.arrayOf(schema.string(), {
      defaultValue: ['style-src-elem'],
    }),
    endpoint: schema.maybe(schema.string()),
    useDeprecatedReportUriOnly: schema.boolean({ defaultValue: false }),
    allowedFrameAncestorSources: schema.maybe(schema.arrayOf(schema.string())),
    allowedConnectSources: schema.maybe(schema.arrayOf(schema.string())),
    allowedImgSources: schema.maybe(schema.arrayOf(schema.string())),
  }),
};
