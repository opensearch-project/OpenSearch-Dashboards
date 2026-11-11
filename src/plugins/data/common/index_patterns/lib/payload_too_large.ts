/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';

// HTTP 413 from the Dashboards server: the request body exceeded server.maxPayloadBytes.
export const isPayloadTooLargeError = (err: any): boolean =>
  err?.res?.status === 413 || err?.body?.statusCode === 413 || err?.statusCode === 413;

export const getPayloadTooLargeToast = (title: string, fieldCount: number) => ({
  title: i18n.translate('data.indexPatterns.payloadTooLargeTitle', {
    defaultMessage: 'Index pattern {title} is too large to save',
    values: { title },
  }),
  text: i18n.translate('data.indexPatterns.payloadTooLargeText', {
    defaultMessage:
      'Its field list ({fieldCount} fields) exceeds the OpenSearch Dashboards request size limit ' +
      '(server.maxPayloadBytes). Narrow the index pattern to fewer indexes or fields, or ask your ' +
      'administrator to increase the limit.',
    values: { fieldCount },
  }),
  color: 'danger' as const,
  iconType: 'alert',
  toastLifeTimeMs: 30000,
});
