/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TypeOf, schema } from '@osd/config-schema';
import { CSP_TRUSTED_ENDPOINTS } from '../constants';

/**
 * @internal
 */
export type CspReportOnlyConfigType = TypeOf<typeof config.schema>;

export const config = {
  path: 'csp-report-only',
  schema: schema.object({
    isEmitting: schema.boolean({ defaultValue: false }),
    rules: schema.arrayOf(schema.string(), {
      defaultValue: [
        `default-src 'self'`,
        `script-src 'self'`,
        `script-src-attr 'none'`,
        `style-src 'self'`,
        `style-src-elem 'self'`,
        `style-src-attr 'self' 'unsafe-inline'`,
        `child-src 'none'`,
        `worker-src 'self'`,
        `frame-src 'none'`,
        `object-src 'none'`,
        `manifest-src 'self'`,
        `media-src 'none'`,
        `font-src 'self'`,
        `connect-src 'self' ${CSP_TRUSTED_ENDPOINTS.join(' ')}`,
        `img-src 'self' data: ${CSP_TRUSTED_ENDPOINTS.join(' ')}`,
        `form-action 'self'`,
        `frame-ancestors 'self'`,
      ],
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
