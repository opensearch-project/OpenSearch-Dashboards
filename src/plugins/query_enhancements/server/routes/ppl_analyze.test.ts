/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { loggingSystemMock } from '../../../../core/server/mocks';
import { registerPPLAnalyzeRoute } from './ppl_analyze';

describe('registerPPLAnalyzeRoute', () => {
  let handler: any;
  let logger: ReturnType<typeof loggingSystemMock.create>['get'];

  const createResponse = () => ({
    ok: jest.fn((v) => v),
    custom: jest.fn((v) => v),
  });

  // sampleSize is what `discover:sampleSize` resolves to; pass a number, or `undefined`
  // to simulate the setting being unset. Defaults to 500 when the arg is omitted.
  const createContext = (transportRequestMock: jest.Mock, ...rest: Array<number | undefined>) =>
    ({
      core: {
        opensearch: {
          client: {
            asCurrentUser: {
              transport: { request: transportRequestMock },
            },
          },
        },
        uiSettings: {
          client: {
            get: jest.fn().mockResolvedValue(rest.length > 0 ? rest[0] : 500),
          },
        },
      },
      dataSource: {
        opensearch: {
          getClient: jest.fn().mockResolvedValue({
            transport: { request: transportRequestMock },
          }),
        },
      },
    }) as any;

  beforeEach(() => {
    const router = {
      post: jest.fn((_, h) => {
        handler = h;
      }),
    } as any;
    // @ts-expect-error TS2322 TODO(ts-error): fixme
    logger = loggingSystemMock.create().get();
    // @ts-expect-error TS2345 TODO(ts-error): fixme
    registerPPLAnalyzeRoute(router, logger);
  });

  it('sends fetch_size from discover:sampleSize when the query has no head', async () => {
    const transportRequest = jest.fn().mockResolvedValue({ body: { profile: {} } });
    const context = createContext(transportRequest, 500);
    const req = { body: { query: 'source=accounts' } } as any;
    const res = createResponse();

    await handler(context, req, res);

    expect(context.core.uiSettings.client.get).toHaveBeenCalledWith('discover:sampleSize');
    expect(transportRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        path: '/_plugins/_ppl',
        querystring: { fetch_size: 500 },
        body: expect.objectContaining({ query: 'source=accounts', analyze: true }),
      })
    );
  });

  it('omits fetch_size when the query already ends with a head command', async () => {
    const transportRequest = jest.fn().mockResolvedValue({ body: { profile: {} } });
    const context = createContext(transportRequest, 500);
    const req = { body: { query: 'source=accounts | head 10' } } as any;
    const res = createResponse();

    await handler(context, req, res);

    // No sample-size lookup and no fetch_size when the user set an explicit limit.
    expect(context.core.uiSettings.client.get).not.toHaveBeenCalled();
    expect(transportRequest).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/_plugins/_ppl', querystring: undefined })
    );
  });

  it('omits fetch_size when the sample-size setting is unset', async () => {
    const transportRequest = jest.fn().mockResolvedValue({ body: { profile: {} } });
    const context = createContext(transportRequest, undefined);
    const req = { body: { query: 'source=accounts' } } as any;
    const res = createResponse();

    await handler(context, req, res);

    expect(transportRequest).toHaveBeenCalledWith(
      expect.objectContaining({ querystring: undefined })
    );
  });

  it('forwards queryId in the request body when provided', async () => {
    const transportRequest = jest.fn().mockResolvedValue({ body: { profile: {} } });
    const context = createContext(transportRequest);
    const req = { body: { query: 'source=accounts', queryId: 'uuid-123' } } as any;
    const res = createResponse();

    await handler(context, req, res);

    expect(transportRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({ analyze: true, queryId: 'uuid-123' }),
      })
    );
  });

  it('does not include queryId in the body when it is absent', async () => {
    const transportRequest = jest.fn().mockResolvedValue({ body: { profile: {} } });
    const context = createContext(transportRequest);
    const req = { body: { query: 'source=accounts' } } as any;
    const res = createResponse();

    await handler(context, req, res);

    const sentBody = transportRequest.mock.calls[0][0].body;
    expect(sentBody).not.toHaveProperty('queryId');
  });

  it('uses the data source client when dataSourceId is provided', async () => {
    const transportRequest = jest.fn().mockResolvedValue({ body: { profile: {} } });
    const context = createContext(transportRequest);
    const req = { body: { query: 'source=accounts', dataSourceId: 'ds-1' } } as any;
    const res = createResponse();

    await handler(context, req, res);

    expect(context.dataSource.opensearch.getClient).toHaveBeenCalledWith('ds-1');
    expect(res.ok).toHaveBeenCalledWith({ body: { profile: {} } });
  });

  it('returns 400 when a dataSourceId is given but the data source plugin is unavailable', async () => {
    const transportRequest = jest.fn();
    const context = createContext(transportRequest);
    // Simulate the data source plugin being disabled/absent.
    context.dataSource = {};
    const req = { body: { query: 'source=accounts', dataSourceId: 'ds-1' } } as any;
    const res = createResponse();

    await handler(context, req, res);

    expect(transportRequest).not.toHaveBeenCalled();
    expect(res.custom).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
  });

  it('unwraps result.body into the response', async () => {
    const transportRequest = jest.fn().mockResolvedValue({ body: { profile: { plan: {} } } });
    const context = createContext(transportRequest);
    const req = { body: { query: 'source=accounts' } } as any;
    const res = createResponse();

    await handler(context, req, res);

    expect(res.ok).toHaveBeenCalledWith({ body: { profile: { plan: {} } } });
  });

  it('coerces a 500-class error to 503', async () => {
    const transportRequest = jest
      .fn()
      .mockRejectedValue({ statusCode: 500, message: 'boom', body: { error: 'boom' } });
    const context = createContext(transportRequest);
    const req = { body: { query: 'source=accounts' } } as any;
    const res = createResponse();

    await handler(context, req, res);

    expect(res.custom).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 503, body: JSON.stringify('boom') })
    );
  });
});
