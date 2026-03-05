/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { loggingSystemMock } from '../../../../core/server/mocks';
import { URI } from '../../common';
import { coerceStatusCode, definePPLArtifactRoute } from './index';

describe('coerceStatusCode', () => {
  it('should return 503 when input is 500', () => {
    expect(coerceStatusCode(500)).toBe(503);
  });

  it('should return the input status code when it is not 500', () => {
    expect(coerceStatusCode(404)).toBe(404);
  });

  it('should return 503 when input is undefined or null', () => {
    expect(coerceStatusCode((undefined as unknown) as number)).toBe(503);
    expect(coerceStatusCode((null as unknown) as number)).toBe(503);
  });
});

describe('definePPLArtifactRoute', () => {
  const createResponse = () => ({
    ok: jest.fn((v) => v),
    custom: jest.fn((v) => v),
  });

  it('should use datasource client when dataSourceId is provided', async () => {
    let handler: any;
    const router = {
      get: jest.fn((_, h) => {
        handler = h;
      }),
    } as any;
    const logger = loggingSystemMock.create().get();
    const client = { asScoped: jest.fn() } as any;

    definePPLArtifactRoute(logger, router, client);

    const requestMock = jest.fn().mockResolvedValue({
      body: { grammarHash: 'sha256:ds', language: 'ppl' },
    });
    const context = {
      dataSource: {
        opensearch: {
          getClient: jest.fn().mockResolvedValue({
            transport: {
              request: requestMock,
            },
          }),
        },
      },
      core: {
        opensearch: {
          client: {
            asCurrentUser: {
              transport: {
                request: jest.fn(),
              },
            },
          },
        },
      },
    } as any;
    const req = { query: { dataSourceId: 'ds-1' } } as any;
    const res = createResponse();

    const result = await handler(context, req, res);

    expect(context.dataSource.opensearch.getClient).toHaveBeenCalledWith('ds-1');
    expect(requestMock).toHaveBeenCalledWith({
      method: 'GET',
      path: URI.PPL_ARTIFACT,
    });
    expect(res.ok).toHaveBeenCalledWith({
      body: { grammarHash: 'sha256:ds', language: 'ppl' },
      headers: {
        'content-type': 'application/json',
        etag: '"sha256:ds"',
        'cache-control': 'public, max-age=3600',
      },
    });
    expect(result).toEqual(res.ok.mock.results[0].value);
  });

  it('should use core client when dataSourceId is not provided', async () => {
    let handler: any;
    const router = {
      get: jest.fn((_, h) => {
        handler = h;
      }),
    } as any;
    const logger = loggingSystemMock.create().get();
    const client = { asScoped: jest.fn() } as any;

    definePPLArtifactRoute(logger, router, client);

    const requestMock = jest.fn().mockResolvedValue({
      body: { language: 'ppl' },
    });
    const context = {
      dataSource: {
        opensearch: {
          getClient: jest.fn(),
        },
      },
      core: {
        opensearch: {
          client: {
            asCurrentUser: {
              transport: {
                request: requestMock,
              },
            },
          },
        },
      },
    } as any;
    const req = { query: {} } as any;
    const res = createResponse();

    await handler(context, req, res);

    expect(context.dataSource.opensearch.getClient).not.toHaveBeenCalled();
    expect(requestMock).toHaveBeenCalledWith({
      method: 'GET',
      path: URI.PPL_ARTIFACT,
    });
    expect(res.ok).toHaveBeenCalled();
  });

  it('should not set etag/cache headers when grammarHash is not header-safe', async () => {
    let handler: any;
    const router = {
      get: jest.fn((_, h) => {
        handler = h;
      }),
    } as any;
    const logger = loggingSystemMock.create().get();
    const client = { asScoped: jest.fn() } as any;

    definePPLArtifactRoute(logger, router, client);

    const requestMock = jest.fn().mockResolvedValue({
      body: { grammarHash: 'sha256:bad"\nvalue', language: 'ppl' },
    });
    const context = {
      core: {
        opensearch: {
          client: {
            asCurrentUser: {
              transport: {
                request: requestMock,
              },
            },
          },
        },
      },
    } as any;
    const req = { query: {} } as any;
    const res = createResponse();

    await handler(context, req, res);

    expect(res.ok).toHaveBeenCalledWith({
      body: { grammarHash: 'sha256:bad"\nvalue', language: 'ppl' },
      headers: {
        'content-type': 'application/json',
      },
    });
  });

  it('should coerce 500-class errors to 503 in custom response', async () => {
    let handler: any;
    const router = {
      get: jest.fn((_, h) => {
        handler = h;
      }),
    } as any;
    const logger = loggingSystemMock.create().get();
    const client = { asScoped: jest.fn() } as any;

    definePPLArtifactRoute(logger, router, client);

    const context = {
      dataSource: {
        opensearch: {
          getClient: jest.fn(),
        },
      },
      core: {
        opensearch: {
          client: {
            asCurrentUser: {
              transport: {
                request: jest.fn().mockRejectedValue({
                  statusCode: 500,
                  message: 'backend failure',
                }),
              },
            },
          },
        },
      },
    } as any;
    const req = { query: {} } as any;
    const res = createResponse();

    const result = await handler(context, req, res);

    expect(res.custom).toHaveBeenCalledWith({
      statusCode: 503,
      body: 'backend failure',
    });
    expect(result).toEqual(res.custom.mock.results[0].value);
  });

  it('should return 400 when dataSourceId is provided but data source plugin context is unavailable', async () => {
    let handler: any;
    const router = {
      get: jest.fn((_, h) => {
        handler = h;
      }),
    } as any;
    const logger = loggingSystemMock.create().get();
    const client = { asScoped: jest.fn() } as any;

    definePPLArtifactRoute(logger, router, client);

    const requestMock = jest.fn();
    const context = {
      core: {
        opensearch: {
          client: {
            asCurrentUser: {
              transport: {
                request: requestMock,
              },
            },
          },
        },
      },
    } as any;
    const req = { query: { dataSourceId: 'ds-1' } } as any;
    const res = createResponse();

    const result = await handler(context, req, res);

    expect(requestMock).not.toHaveBeenCalled();
    expect(res.custom).toHaveBeenCalledWith({
      statusCode: 400,
      body: 'dataSourceId is not supported because data source plugin is unavailable',
    });
    expect(result).toEqual(res.custom.mock.results[0].value);
  });
});
