/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { loggingSystemMock } from '../../../../core/server/mocks';
import { definePPLCalciteSettingsRoute } from './ppl_calcite_settings';

// Matches CALCITE_SETTINGS_PATH in ppl_calcite_settings.ts. The escaped dots are
// required: flat_settings keeps each key as a literal dotted string, and
// filter_path would otherwise read '.' as nesting and return an empty body.
const EXPECTED_PATH =
  '/_cluster/settings?flat_settings=true&include_defaults=true' +
  '&filter_path=*.plugins\\.calcite\\.enabled,*.plugins\\.calcite\\.all_join_types\\.allowed';

describe('definePPLCalciteSettingsRoute', () => {
  const createResponse = () => ({
    ok: jest.fn((v) => v),
    custom: jest.fn((v) => v),
  });

  const captureHandler = () => {
    let handler: any;
    const router = {
      get: jest.fn((_, h) => {
        handler = h;
      }),
    } as any;
    const logger = loggingSystemMock.create().get();
    definePPLCalciteSettingsRoute(logger, router);
    return { handler: () => handler, router, logger };
  };

  it('uses the datasource client and GETs /_cluster/settings', async () => {
    const { handler } = captureHandler();

    const settings = {
      body: {
        defaults: {
          'plugins.calcite.enabled': 'true',
          'plugins.calcite.all_join_types.allowed': 'false',
        },
      },
    };
    const requestMock = jest.fn().mockResolvedValue(settings);
    const context = {
      dataSource: {
        opensearch: {
          getClient: jest.fn().mockResolvedValue({
            transport: { request: requestMock },
          }),
        },
      },
      core: {
        opensearch: { client: { asCurrentUser: { transport: { request: jest.fn() } } } },
      },
    } as any;
    const req = { query: { dataSourceId: 'ds-1' } } as any;
    const res = createResponse();

    const result = await handler()(context, req, res);

    expect(context.dataSource.opensearch.getClient).toHaveBeenCalledWith('ds-1');
    expect(requestMock).toHaveBeenCalledWith({
      method: 'GET',
      path: EXPECTED_PATH,
    });
    expect(res.ok).toHaveBeenCalledWith({
      body: { calciteEnabled: true, allJoinTypesAllowed: false },
    });
    expect(result).toEqual(res.ok.mock.results[0].value);
  });

  it('uses the core client when no dataSourceId is provided', async () => {
    const { handler } = captureHandler();

    const requestMock = jest.fn().mockResolvedValue({ body: { defaults: {} } });
    const context = {
      dataSource: { opensearch: { getClient: jest.fn() } },
      core: {
        opensearch: { client: { asCurrentUser: { transport: { request: requestMock } } } },
      },
    } as any;
    const req = { query: {} } as any;
    const res = createResponse();

    await handler()(context, req, res);

    expect(context.dataSource.opensearch.getClient).not.toHaveBeenCalled();
    expect(requestMock).toHaveBeenCalledWith({
      method: 'GET',
      path: EXPECTED_PATH,
    });
    // Absent setting => calcite treated as enabled (not 'false'), join types not allowed.
    expect(res.ok).toHaveBeenCalledWith({
      body: { calciteEnabled: true, allJoinTypesAllowed: false },
    });
  });

  it('honors transient over persistent over defaults precedence', async () => {
    const { handler } = captureHandler();

    const requestMock = jest.fn().mockResolvedValue({
      body: {
        transient: { 'plugins.calcite.enabled': 'false' },
        persistent: {
          'plugins.calcite.enabled': 'true',
          'plugins.calcite.all_join_types.allowed': 'true',
        },
        defaults: {
          'plugins.calcite.enabled': 'true',
          'plugins.calcite.all_join_types.allowed': 'false',
        },
      },
    });
    const context = {
      dataSource: { opensearch: { getClient: jest.fn() } },
      core: {
        opensearch: { client: { asCurrentUser: { transport: { request: requestMock } } } },
      },
    } as any;
    const req = { query: {} } as any;
    const res = createResponse();

    await handler()(context, req, res);

    // transient 'false' wins for calcite.enabled; persistent 'true' wins for join types.
    expect(res.ok).toHaveBeenCalledWith({
      body: { calciteEnabled: false, allJoinTypesAllowed: true },
    });
  });

  it('returns 400 when dataSourceId is provided but the data source plugin is unavailable', async () => {
    const { handler } = captureHandler();

    const requestMock = jest.fn();
    const context = {
      core: {
        opensearch: { client: { asCurrentUser: { transport: { request: requestMock } } } },
      },
    } as any;
    const req = { query: { dataSourceId: 'ds-1' } } as any;
    const res = createResponse();

    const result = await handler()(context, req, res);

    expect(requestMock).not.toHaveBeenCalled();
    expect(res.custom).toHaveBeenCalledWith({
      statusCode: 400,
      body: 'dataSourceId is not supported because data source plugin is unavailable',
    });
    expect(result).toEqual(res.custom.mock.results[0].value);
  });

  it('swallows transport errors, logs, and returns safe defaults', async () => {
    const { handler, logger } = captureHandler();

    const context = {
      dataSource: { opensearch: { getClient: jest.fn() } },
      core: {
        opensearch: {
          client: {
            asCurrentUser: {
              transport: { request: jest.fn().mockRejectedValue(new Error('boom')) },
            },
          },
        },
      },
    } as any;
    const req = { query: {} } as any;
    const res = createResponse();

    await handler()(context, req, res);

    expect(res.ok).toHaveBeenCalledWith({
      body: { calciteEnabled: true, allJoinTypesAllowed: false },
    });
    expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('boom'));
  });

  it('unwraps a non-body transport result', async () => {
    const { handler } = captureHandler();

    const rawSettings = {
      defaults: { 'plugins.calcite.enabled': 'false' },
    };
    const context = {
      dataSource: { opensearch: { getClient: jest.fn() } },
      core: {
        opensearch: {
          client: {
            asCurrentUser: { transport: { request: jest.fn().mockResolvedValue(rawSettings) } },
          },
        },
      },
    } as any;
    const req = { query: {} } as any;
    const res = createResponse();

    await handler()(context, req, res);

    expect(res.ok).toHaveBeenCalledWith({
      body: { calciteEnabled: false, allJoinTypesAllowed: false },
    });
  });

  it('normalizes typed-boolean setting values before comparing', async () => {
    const { handler } = captureHandler();

    // A future transport could serialize the values as real booleans rather than
    // strings. String() normalization makes `false`/`true` compare like '"false"'/'"true"'.
    const requestMock = jest.fn().mockResolvedValue({
      body: {
        defaults: {
          'plugins.calcite.enabled': false,
          'plugins.calcite.all_join_types.allowed': true,
        },
      },
    });
    const context = {
      dataSource: { opensearch: { getClient: jest.fn() } },
      core: {
        opensearch: { client: { asCurrentUser: { transport: { request: requestMock } } } },
      },
    } as any;
    const req = { query: {} } as any;
    const res = createResponse();

    await handler()(context, req, res);

    expect(res.ok).toHaveBeenCalledWith({
      body: { calciteEnabled: false, allJoinTypesAllowed: true },
    });
  });

  it('logs auth failures at warn while still failing open', async () => {
    const { handler, logger } = captureHandler();

    const context = {
      dataSource: { opensearch: { getClient: jest.fn() } },
      core: {
        opensearch: {
          client: {
            asCurrentUser: {
              transport: {
                request: jest.fn().mockRejectedValue({ statusCode: 403, message: 'forbidden' }),
              },
            },
          },
        },
      },
    } as any;
    const req = { query: {} } as any;
    const res = createResponse();

    await handler()(context, req, res);

    // Still fails open so the editor is never blocked...
    expect(res.ok).toHaveBeenCalledWith({
      body: { calciteEnabled: true, allJoinTypesAllowed: false },
    });
    // ...but the permission failure is surfaced at warn, not buried at debug.
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('403'));
    expect(logger.debug).not.toHaveBeenCalled();
  });
});
