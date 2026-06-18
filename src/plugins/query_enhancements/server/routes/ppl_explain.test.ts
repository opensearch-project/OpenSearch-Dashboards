/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { loggingSystemMock } from '../../../../core/server/mocks';
import { URI } from '../../common';
import { definePPLExplainRoute } from './ppl_explain';

describe('definePPLExplainRoute', () => {
  const createResponse = () => ({
    ok: jest.fn((v) => v),
    custom: jest.fn((v) => v),
  });

  const captureHandler = () => {
    let handler: any;
    const router = {
      post: jest.fn((_, h) => {
        handler = h;
      }),
    } as any;
    const logger = loggingSystemMock.create().get();
    definePPLExplainRoute(logger, router);
    return { handler: () => handler, router };
  };

  it('uses the datasource client and POSTs to /_plugins/_ppl/_explain', async () => {
    const { handler } = captureHandler();

    const calcitePlan = { calcite: { logical: 'L', physical: 'P' } };
    const requestMock = jest.fn().mockResolvedValue({ body: calcitePlan });
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
    const req = {
      query: { dataSourceId: 'ds-1' },
      body: { query: 'source=accounts | head 1' },
    } as any;
    const res = createResponse();

    const result = await handler()(context, req, res);

    expect(context.dataSource.opensearch.getClient).toHaveBeenCalledWith('ds-1');
    expect(requestMock).toHaveBeenCalledWith({
      method: 'POST',
      path: `${URI.PPL}/_explain`,
      body: { query: 'source=accounts | head 1' },
    });
    expect(res.ok).toHaveBeenCalledWith({ body: calcitePlan });
    expect(result).toEqual(res.ok.mock.results[0].value);
  });

  it('uses the core client when no dataSourceId is provided', async () => {
    const { handler } = captureHandler();

    const requestMock = jest.fn().mockResolvedValue({ body: { calcite: {} } });
    const context = {
      dataSource: { opensearch: { getClient: jest.fn() } },
      core: {
        opensearch: { client: { asCurrentUser: { transport: { request: requestMock } } } },
      },
    } as any;
    const req = { query: {}, body: { query: 'source=accounts' } } as any;
    const res = createResponse();

    await handler()(context, req, res);

    expect(context.dataSource.opensearch.getClient).not.toHaveBeenCalled();
    expect(requestMock).toHaveBeenCalledWith({
      method: 'POST',
      path: `${URI.PPL}/_explain`,
      body: { query: 'source=accounts' },
    });
    // requestMock resolves { body: { calcite: {} } }, so the unwrapped body is { calcite: {} }.
    expect(res.ok).toHaveBeenCalledWith({ body: { calcite: {} } });
  });

  it('coerces 500-class errors to 503', async () => {
    const { handler } = captureHandler();

    const context = {
      dataSource: { opensearch: { getClient: jest.fn() } },
      core: {
        opensearch: {
          client: {
            asCurrentUser: {
              transport: {
                request: jest
                  .fn()
                  .mockRejectedValue({ statusCode: 500, message: 'backend failure' }),
              },
            },
          },
        },
      },
    } as any;
    const req = { query: {}, body: { query: 'source=accounts' } } as any;
    const res = createResponse();

    const result = await handler()(context, req, res);

    expect(res.custom).toHaveBeenCalledWith({ statusCode: 503, body: 'backend failure' });
    expect(result).toEqual(res.custom.mock.results[0].value);
  });

  it('reads err.status when only that field is set (older opensearch-js shape)', async () => {
    const { handler } = captureHandler();

    const context = {
      dataSource: { opensearch: { getClient: jest.fn() } },
      core: {
        opensearch: {
          client: {
            asCurrentUser: {
              transport: {
                request: jest.fn().mockRejectedValue({ status: 400, message: 'bad request' }),
              },
            },
          },
        },
      },
    } as any;
    const req = { query: {}, body: { query: 'source=accounts' } } as any;
    const res = createResponse();

    await handler()(context, req, res);

    expect(res.custom).toHaveBeenCalledWith({ statusCode: 400, body: 'bad request' });
  });

  it('reads err.meta.statusCode when only that field is set (opensearch-js 2.x ResponseError shape)', async () => {
    const { handler } = captureHandler();

    const context = {
      dataSource: { opensearch: { getClient: jest.fn() } },
      core: {
        opensearch: {
          client: {
            asCurrentUser: {
              transport: {
                request: jest
                  .fn()
                  .mockRejectedValue({ meta: { statusCode: 404 }, message: 'not found' }),
              },
            },
          },
        },
      },
    } as any;
    const req = { query: {}, body: { query: 'source=accounts' } } as any;
    const res = createResponse();

    await handler()(context, req, res);

    expect(res.custom).toHaveBeenCalledWith({ statusCode: 404, body: 'not found' });
  });

  it('returns 400 when dataSourceId is provided but the data source plugin is unavailable', async () => {
    const { handler } = captureHandler();

    const requestMock = jest.fn();
    const context = {
      core: {
        opensearch: { client: { asCurrentUser: { transport: { request: requestMock } } } },
      },
    } as any;
    const req = { query: { dataSourceId: 'ds-1' }, body: { query: 'source=accounts' } } as any;
    const res = createResponse();

    const result = await handler()(context, req, res);

    expect(requestMock).not.toHaveBeenCalled();
    expect(res.custom).toHaveBeenCalledWith({
      statusCode: 400,
      body: 'dataSourceId is not supported because data source plugin is unavailable',
    });
    expect(result).toEqual(res.custom.mock.results[0].value);
  });

  it('unwraps a non-body transport result', async () => {
    const { handler } = captureHandler();

    const rawPlan = { calcite: { logical: 'L', physical: 'P' } };
    const context = {
      dataSource: { opensearch: { getClient: jest.fn() } },
      core: {
        opensearch: {
          client: {
            asCurrentUser: { transport: { request: jest.fn().mockResolvedValue(rawPlan) } },
          },
        },
      },
    } as any;
    const req = { query: {}, body: { query: 'source=accounts' } } as any;
    const res = createResponse();

    await handler()(context, req, res);

    expect(res.ok).toHaveBeenCalledWith({ body: rawPlan });
  });
});
