/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { registerResolveIndexRoute } from './resolve_index';

type Handler = (context: any, req: any, res: any) => Promise<any>;

const setup = () => {
  let handler: Handler = async () => undefined;
  const router = {
    get: jest.fn((_config: any, h: Handler) => {
      handler = h;
    }),
  };
  registerResolveIndexRoute(router as any);
  return { router, getHandler: () => handler };
};

const resFactory = () => ({
  ok: jest.fn((v: any) => ({ ok: v })),
  customError: jest.fn((v: any) => ({ error: v })),
});

describe('registerResolveIndexRoute', () => {
  it('uses the modern data source client transport when data_source is provided', async () => {
    const { getHandler } = setup();
    const transportRequest = jest.fn().mockResolvedValue({ body: { indices: [] } });
    const getClient = jest.fn().mockResolvedValue({ transport: { request: transportRequest } });

    const context = {
      core: { opensearch: { client: { asCurrentUser: { transport: { request: jest.fn() } } } } },
      dataSource: { opensearch: { getClient } },
    };
    const req = { params: { query: '*' }, query: { data_source: 'ds-1' } };
    const res = resFactory();

    await getHandler()(context, req, res);

    expect(getClient).toHaveBeenCalledWith('ds-1');
    expect(transportRequest).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', path: expect.stringContaining('/_resolve/index/') })
    );
    expect(res.ok).toHaveBeenCalled();
  });

  it('uses the core client when no data_source is provided', async () => {
    const { getHandler } = setup();
    const transportRequest = jest.fn().mockResolvedValue({ body: { indices: [] } });

    const context = {
      core: {
        opensearch: { client: { asCurrentUser: { transport: { request: transportRequest } } } },
      },
      dataSource: { opensearch: { getClient: jest.fn() } },
    };
    const req = { params: { query: '*' }, query: {} };
    const res = resFactory();

    await getHandler()(context, req, res);

    expect(context.dataSource.opensearch.getClient).not.toHaveBeenCalled();
    expect(transportRequest).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', path: expect.stringContaining('/_resolve/index/') })
    );
    expect(res.ok).toHaveBeenCalled();
  });

  it('maps an opensearch-js ResponseError to res.customError preserving statusCode and body.error', async () => {
    const { getHandler } = setup();
    const transportRequest = jest.fn().mockRejectedValue({
      statusCode: 404,
      message: 'index_not_found',
      body: { error: { type: 'index_not_found_exception' } },
    });
    const getClient = jest.fn().mockResolvedValue({ transport: { request: transportRequest } });

    const context = {
      core: { opensearch: { client: { asCurrentUser: { transport: { request: jest.fn() } } } } },
      dataSource: { opensearch: { getClient } },
    };
    const req = { params: { query: '*' }, query: { data_source: 'ds-1' } };
    const res = resFactory();

    await getHandler()(context, req, res);

    expect(res.ok).not.toHaveBeenCalled();
    expect(res.customError).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        body: expect.objectContaining({
          message: 'index_not_found',
          attributes: { error: { type: 'index_not_found_exception' } },
        }),
      })
    );
  });

  it('maps a transport-level error (no statusCode, no body) to a 500 with message fallbacks', async () => {
    const { getHandler } = setup();
    const transportRequest = jest.fn().mockRejectedValue(new Error('connection refused'));

    const context = {
      core: {
        opensearch: { client: { asCurrentUser: { transport: { request: transportRequest } } } },
      },
      dataSource: { opensearch: { getClient: jest.fn() } },
    };
    const req = { params: { query: '*' }, query: {} };
    const res = resFactory();

    await getHandler()(context, req, res);

    expect(res.ok).not.toHaveBeenCalled();
    expect(res.customError).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        body: expect.objectContaining({
          message: 'connection refused',
          attributes: { error: 'connection refused' },
        }),
      })
    );
  });
});
