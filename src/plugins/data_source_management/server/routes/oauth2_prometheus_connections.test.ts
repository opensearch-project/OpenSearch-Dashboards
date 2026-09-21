/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  listOAuth2PrometheusConnections,
  findOAuth2PrometheusConnection,
} from './oauth2_prometheus_connections';

const mockLogger: any = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  trace: jest.fn(),
  fatal: jest.fn(),
  log: jest.fn(),
  get: jest.fn(),
};

const savedObject = (connectionId: string, allowedRoles: string[], oauth2 = true) => ({
  id: `so-${connectionId}`,
  type: 'data-connection',
  attributes: {
    connectionId,
    connector: 'prometheus',
    dataSourceType: 'prometheus',
    allowedRoles,
    properties: oauth2
      ? {
          'prometheus.uri': 'https://prom.example.com',
          'prometheus.oauth2.enabled': 'true',
          'prometheus.oauth2.tokenUrl': 'https://auth.example.com/token',
        }
      : { 'prometheus.uri': 'https://prom.example.com' },
  },
  references: [],
});

/**
 * @param roles null models the security plugin being absent - authinfo answers 404.
 */
const buildContext = (savedObjects: any[], roles: string[] | null) => ({
  core: {
    savedObjects: {
      client: { find: jest.fn().mockResolvedValue({ saved_objects: savedObjects }) },
    },
    opensearch: {
      client: {
        asCurrentUser: {
          transport: {
            request:
              roles === null
                ? jest
                    .fn()
                    .mockRejectedValue(
                      Object.assign(new Error('no handler found for uri'), { statusCode: 404 })
                    )
                : jest.fn().mockResolvedValue({ body: { roles, backend_roles: [] } }),
          },
        },
      },
    },
  },
});

/** authinfo reachable but failing, e.g. a 503 - roles cannot be established. */
const buildContextWithRolesUnavailable = (savedObjects: any[]) => ({
  core: {
    savedObjects: {
      client: { find: jest.fn().mockResolvedValue({ saved_objects: savedObjects }) },
    },
    opensearch: {
      client: {
        asCurrentUser: {
          transport: {
            request: jest
              .fn()
              .mockRejectedValue(
                Object.assign(new Error('service unavailable'), { statusCode: 503 })
              ),
          },
        },
      },
    },
  },
});

describe('OAuth2 Prometheus connection helpers', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('listOAuth2PrometheusConnections', () => {
    it('returns only OAuth2 connections', async () => {
      const context = buildContext(
        [savedObject('with-oauth2', ['r1']), savedObject('plain', ['r1'], false)],
        ['r1']
      );

      const result = await listOAuth2PrometheusConnections(context, mockLogger);

      expect(result.map((c) => c.name)).toEqual(['with-oauth2']);
    });

    it('hides connections whose allowedRoles the caller does not hold', async () => {
      const context = buildContext(
        [savedObject('mine', ['prom_reader']), savedObject('theirs', ['other_team'])],
        ['prom_reader']
      );

      const result = await listOAuth2PrometheusConnections(context, mockLogger);

      // Without this filter an unauthorized caller would see 'theirs' - including its
      // tokenUrl, scopes and role list - even though the backend listing excludes it.
      expect(result.map((c) => c.name)).toEqual(['mine']);
    });

    it('returns everything for a caller with all_access', async () => {
      const context = buildContext(
        [savedObject('a', ['team_a']), savedObject('b', ['team_b'])],
        ['all_access']
      );

      const result = await listOAuth2PrometheusConnections(context, mockLogger);

      expect(result.map((c) => c.name)).toEqual(['a', 'b']);
    });

    it('hides a connection with empty allowedRoles from a non all_access caller', async () => {
      const context = buildContext([savedObject('unscoped', [])], ['prom_reader']);

      // Matches DataSourceUserAuthorizationHelperImpl: empty allowedRoles grants access to
      // all_access holders only.
      expect(await listOAuth2PrometheusConnections(context, mockLogger)).toEqual([]);
    });

    it('does not filter when the security plugin is not installed', async () => {
      const context = buildContext([savedObject('unscoped', [])], null);

      // A 404 from authinfo means there is no security plugin, so there is no authorization to
      // enforce - the same condition under which the SQL backend skips its own check.
      const result = await listOAuth2PrometheusConnections(context, mockLogger);

      expect(result.map((c) => c.name)).toEqual(['unscoped']);
    });

    it('withholds connections when the caller roles cannot be established', async () => {
      const context = buildContextWithRolesUnavailable([savedObject('scoped', ['prom_reader'])]);

      // Anything other than "security absent" - a 503, a timeout - must not be treated as
      // "no authorization required", or an unauthorized caller would receive every
      // connection's uri, tokenUrl and role list.
      expect(await listOAuth2PrometheusConnections(context, mockLogger)).toEqual([]);
    });

    it('skips the roles lookup entirely when there are no OAuth2 connections', async () => {
      const context = buildContext([savedObject('plain', ['r1'], false)], ['r1']);

      expect(await listOAuth2PrometheusConnections(context, mockLogger)).toEqual([]);
      expect(context.core.opensearch.client.asCurrentUser.transport.request).not.toHaveBeenCalled();
    });

    it('returns an empty list when the saved objects lookup fails', async () => {
      const context: any = buildContext([], ['r1']);
      context.core.savedObjects.client.find = jest.fn().mockRejectedValue(new Error('boom'));

      expect(await listOAuth2PrometheusConnections(context, mockLogger)).toEqual([]);
    });
  });

  describe('findOAuth2PrometheusConnection', () => {
    it('matches on the exact connectionId, not the fuzzy search hits', async () => {
      // `search` is tokenized, so a request for 'prom' can return 'prom-metrics' too.
      const context = buildContext(
        [savedObject('prom-metrics', ['r1']), savedObject('prom', ['r1'])],
        ['r1']
      );

      const result = await findOAuth2PrometheusConnection(context, 'prom', mockLogger);

      expect(result?.name).toBe('prom');
      expect(result?.savedObjectId).toBe('so-prom');
    });

    it('returns undefined when the only match is not an OAuth2 connection', async () => {
      const context = buildContext([savedObject('plain', ['r1'], false)], ['r1']);

      expect(await findOAuth2PrometheusConnection(context, 'plain', mockLogger)).toBeUndefined();
    });

    it('returns undefined when the caller is not allowed to see it', async () => {
      const context = buildContext([savedObject('theirs', ['other_team'])], ['prom_reader']);

      expect(await findOAuth2PrometheusConnection(context, 'theirs', mockLogger)).toBeUndefined();
    });

    it('returns undefined when no saved object has that name', async () => {
      const context = buildContext([savedObject('other', ['r1'])], ['r1']);

      expect(await findOAuth2PrometheusConnection(context, 'missing', mockLogger)).toBeUndefined();
    });
  });
});
