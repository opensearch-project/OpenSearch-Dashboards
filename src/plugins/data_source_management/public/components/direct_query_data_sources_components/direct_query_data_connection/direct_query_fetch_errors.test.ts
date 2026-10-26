/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  extractErrorText,
  getHttpStatusCode,
  isQueryDatasourcesUnavailable,
} from './direct_query_fetch_errors';

describe('direct_query_fetch_errors', () => {
  const noHandlerMessage =
    'no handler found for uri [/_plugins/_query/_datasources] and method [GET]';

  describe('isQueryDatasourcesUnavailable', () => {
    it('detects the Dashboards proxy body used when MDS is disabled', () => {
      expect(
        isQueryDatasourcesUnavailable({
          body: { error: noHandlerMessage },
          response: { status: 400 },
        })
      ).toBe(true);
    });

    it('detects the wrapped MDS route error body', () => {
      expect(
        isQueryDatasourcesUnavailable({
          body: {
            error: { error: noHandlerMessage },
            message: noHandlerMessage,
          },
          response: { status: 400 },
        })
      ).toBe(true);
    });

    it('detects a string OpenSearch response body', () => {
      expect(
        isQueryDatasourcesUnavailable({
          body: JSON.stringify({ error: noHandlerMessage }),
          statusCode: 400,
        })
      ).toBe(true);
    });

    it('does not treat an empty datasource list as unavailable', () => {
      expect(isQueryDatasourcesUnavailable([])).toBe(false);
    });

    it('does not treat 401/403 as unavailable', () => {
      expect(
        isQueryDatasourcesUnavailable({
          body: { message: 'Unauthorized' },
          response: { status: 401 },
        })
      ).toBe(false);
      expect(
        isQueryDatasourcesUnavailable({
          body: { message: 'Forbidden' },
          response: { status: 403 },
        })
      ).toBe(false);
    });

    it('does not treat 5xx or generic 400 errors as unavailable', () => {
      expect(
        isQueryDatasourcesUnavailable({
          body: { message: 'Internal server error' },
          response: { status: 500 },
        })
      ).toBe(false);
      expect(
        isQueryDatasourcesUnavailable({
          body: { error: noHandlerMessage },
          response: { status: 500 },
        })
      ).toBe(false);
      expect(
        isQueryDatasourcesUnavailable({
          body: { error: 'invalid request' },
          response: { status: 400 },
        })
      ).toBe(false);
    });

    it('detects an error that includes the URI on path', () => {
      expect(
        isQueryDatasourcesUnavailable({
          path: '/_plugins/_query/_datasources',
          body: { error: 'no handler found' },
          statusCode: 400,
        })
      ).toBe(true);
    });

    it('does not treat "no handler found" on an unrelated path as this feature', () => {
      expect(
        isQueryDatasourcesUnavailable({
          body: { error: 'no handler found for uri [/_plugins/_other] and method [GET]' },
          response: { status: 400 },
        })
      ).toBe(false);
    });
  });

  describe('getHttpStatusCode', () => {
    it('reads HttpFetchError response.status', () => {
      expect(getHttpStatusCode({ response: { status: 403 }, body: {} })).toBe(403);
    });

    it('falls back to statusCode', () => {
      expect(getHttpStatusCode({ statusCode: 401 })).toBe(401);
    });
  });

  describe('extractErrorText', () => {
    it('flattens nested error objects', () => {
      expect(
        extractErrorText({
          body: { error: { error: noHandlerMessage } },
        })
      ).toContain(noHandlerMessage);
    });
  });
});
