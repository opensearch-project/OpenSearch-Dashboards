/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { loggingSystemMock } from '../../../../core/server/mocks';
import { registerPPLCancelRoute } from './ppl_cancel';

describe('registerPPLCancelRoute', () => {
  let handler: any;
  let logger: ReturnType<typeof loggingSystemMock.create>['get'];

  const createResponse = () => ({
    ok: jest.fn((v) => v),
    notFound: jest.fn((v) => v),
    custom: jest.fn((v) => v),
  });

  const createContext = (transportRequestMock: jest.Mock) =>
    ({
      core: {
        opensearch: {
          client: {
            asCurrentUser: {
              transport: {
                request: transportRequestMock,
              },
            },
          },
        },
      },
      dataSource: {
        opensearch: {
          getClient: jest.fn().mockResolvedValue({
            transport: {
              request: transportRequestMock,
            },
          }),
        },
      },
    } as any);

  const tasksResponseWithMatch = (queryId: string) => ({
    body: {
      nodes: {
        node1: {
          tasks: {
            'node1:12345': {
              description: `PPL [queryId=${queryId}]: source=test`,
              action: 'indices:data/read/ppl',
            },
          },
        },
      },
    },
  });

  const tasksResponseNoMatch = {
    body: {
      nodes: {
        node1: {
          tasks: {
            'node1:99999': {
              description: 'PPL [queryId=other-id]: source=test',
              action: 'indices:data/read/ppl',
            },
          },
        },
      },
    },
  };

  const tasksResponseEmpty = {
    body: {
      nodes: {},
    },
  };

  beforeEach(() => {
    const router = {
      post: jest.fn((_, h) => {
        handler = h;
      }),
    } as any;
    logger = loggingSystemMock.create().get();
    registerPPLCancelRoute(router, logger);
  });

  it('should cancel a matching PPL task successfully', async () => {
    const queryId = 'test-uuid-1234';
    const transportRequest = jest
      .fn()
      .mockResolvedValueOnce(tasksResponseWithMatch(queryId))
      .mockResolvedValueOnce({ body: { nodes: {} } });

    const context = createContext(transportRequest);
    const req = { body: { queryId } } as any;
    const res = createResponse();

    await handler(context, req, res);

    expect(transportRequest).toHaveBeenCalledWith({
      method: 'GET',
      path: '/_tasks',
      querystring: { actions: '*ppl*', detailed: 'true' },
    });
    expect(transportRequest).toHaveBeenCalledWith({
      method: 'POST',
      path: '/_tasks/node1:12345/_cancel',
    });
    expect(res.ok).toHaveBeenCalledWith({
      body: {
        cancelled: true,
        queryId,
        tasks: [
          expect.objectContaining({
            taskId: 'node1:12345',
            nodeId: 'node1',
          }),
        ],
      },
    });
  });

  it('should return 404 when no matching task is found', async () => {
    const queryId = 'nonexistent-uuid';
    const transportRequest = jest.fn().mockResolvedValueOnce(tasksResponseNoMatch);

    const context = createContext(transportRequest);
    const req = { body: { queryId } } as any;
    const res = createResponse();

    await handler(context, req, res);

    expect(transportRequest).toHaveBeenCalledTimes(1);
    expect(res.notFound).toHaveBeenCalledWith({
      body: { message: `No running PPL task found for queryId: ${queryId}` },
    });
  });

  it('should return 404 when no tasks exist', async () => {
    const queryId = 'some-uuid';
    const transportRequest = jest.fn().mockResolvedValueOnce(tasksResponseEmpty);

    const context = createContext(transportRequest);
    const req = { body: { queryId } } as any;
    const res = createResponse();

    await handler(context, req, res);

    expect(res.notFound).toHaveBeenCalled();
  });

  it('should use data source client when dataSourceId is provided', async () => {
    const queryId = 'ds-uuid';
    const dataSourceId = 'ds-1';
    const transportRequest = jest
      .fn()
      .mockResolvedValueOnce(tasksResponseWithMatch(queryId))
      .mockResolvedValueOnce({ body: {} });

    const context = createContext(transportRequest);
    const req = { body: { queryId, dataSourceId } } as any;
    const res = createResponse();

    await handler(context, req, res);

    expect(context.dataSource.opensearch.getClient).toHaveBeenCalledWith(dataSourceId);
    expect(res.ok).toHaveBeenCalled();
  });

  it('should use core client when dataSourceId is not provided', async () => {
    const queryId = 'local-uuid';
    const transportRequest = jest
      .fn()
      .mockResolvedValueOnce(tasksResponseWithMatch(queryId))
      .mockResolvedValueOnce({ body: {} });

    const context = createContext(transportRequest);
    const req = { body: { queryId } } as any;
    const res = createResponse();

    await handler(context, req, res);

    expect(context.dataSource.opensearch.getClient).not.toHaveBeenCalled();
    expect(res.ok).toHaveBeenCalled();
  });

  it('should handle OpenSearch errors and coerce 500 to 503', async () => {
    const queryId = 'error-uuid';
    const transportRequest = jest.fn().mockRejectedValueOnce({
      statusCode: 500,
      message: 'internal server error',
    });

    const context = createContext(transportRequest);
    const req = { body: { queryId } } as any;
    const res = createResponse();

    await handler(context, req, res);

    expect(res.custom).toHaveBeenCalledWith({
      statusCode: 503,
      body: 'internal server error',
    });
  });

  it('should cancel all matching tasks across multiple nodes', async () => {
    const queryId = 'multi-task-uuid';
    const transportRequest = jest
      .fn()
      .mockResolvedValueOnce({
        body: {
          nodes: {
            node1: {
              tasks: {
                'node1:111': {
                  description: `PPL [queryId=${queryId}]: source=test`,
                },
              },
            },
            node2: {
              tasks: {
                'node2:222': {
                  description: `PPL [queryId=${queryId}]: source=test | stats count()`,
                },
                'node2:333': {
                  description: 'PPL [queryId=other]: source=other',
                },
              },
            },
          },
        },
      })
      .mockResolvedValue({ body: {} });

    const context = createContext(transportRequest);
    const req = { body: { queryId } } as any;
    const res = createResponse();

    await handler(context, req, res);

    // Should cancel both matching tasks, not the non-matching one
    expect(transportRequest).toHaveBeenCalledWith({
      method: 'POST',
      path: '/_tasks/node1:111/_cancel',
    });
    expect(transportRequest).toHaveBeenCalledWith({
      method: 'POST',
      path: '/_tasks/node2:222/_cancel',
    });
    expect(transportRequest).not.toHaveBeenCalledWith({
      method: 'POST',
      path: '/_tasks/node2:333/_cancel',
    });
    expect(res.ok).toHaveBeenCalledWith({
      body: {
        cancelled: true,
        queryId,
        tasks: expect.arrayContaining([
          expect.objectContaining({ taskId: 'node1:111', nodeId: 'node1' }),
          expect.objectContaining({ taskId: 'node2:222', nodeId: 'node2' }),
        ]),
      },
    });
  });
});
