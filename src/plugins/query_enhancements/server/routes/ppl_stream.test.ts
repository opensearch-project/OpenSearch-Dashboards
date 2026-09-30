/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { loggingSystemMock } from '../../../../core/server/mocks';
import { API, URI } from '../../common';
import { registerPPLStreamRoutes } from './ppl_stream';

describe('registerPPLStreamRoutes', () => {
  const createResponse = () => ({
    ok: jest.fn((v) => v),
    custom: jest.fn((v) => v),
    notFound: jest.fn((v) => v),
  });

  /** Captures the three handlers and the route configs so validation schemas can be exercised. */
  const setup = () => {
    const routes: Record<string, { config: any; handler: any }> = {};
    const capture = (method: string) => (config: any, handler: any) => {
      routes[`${method} ${config.path}`] = { config, handler };
    };
    const router = {
      post: jest.fn(capture('post')),
      get: jest.fn(capture('get')),
      delete: jest.fn(capture('delete')),
    } as any;
    registerPPLStreamRoutes(router, loggingSystemMock.create().get());
    return {
      submit: routes[`post ${API.PPL_STREAM_SUBMIT}`],
      poll: routes[`get ${API.PPL_STREAM_JOB}/{id}`],
      cancel: routes[`delete ${API.PPL_STREAM_JOB}/{id}`],
    };
  };

  const SAMPLE_SIZES: Record<string, number> = {
    'discover:sampleSize': 500,
    'discover:aggregationSampleSize': 10000,
  };

  const contextWith = (request: jest.Mock, getClient?: jest.Mock, uiSettingsGet?: jest.Mock) =>
    ({
      ...(getClient ? { dataSource: { opensearch: { getClient } } } : {}),
      core: {
        opensearch: { client: { asCurrentUser: { transport: { request } } } },
        uiSettings: {
          client: {
            get: uiSettingsGet ?? jest.fn(async (key: string) => SAMPLE_SIZES[key]),
          },
        },
        // These routes are gated on the pplStreaming feature flag, resolved per request.
        dynamicConfig: {
          client: {
            getConfig: jest.fn().mockResolvedValue({ ppl: { streaming: { enabled: true } } }),
          },
          asyncLocalStore: undefined,
        },
      },
    }) as any;

  describe('submit', () => {
    it('selects the async path with defaults and requests the JDBC format', async () => {
      const { submit } = setup();
      const request = jest.fn().mockResolvedValue({ body: { id: 'job-1', status: 'RUNNING' } });
      const res = createResponse();

      await submit.handler(
        contextWith(request),
        { query: {}, body: { query: 'source=logs' } } as any,
        res
      );

      expect(request).toHaveBeenCalledWith({
        method: 'POST',
        path: URI.PPL,
        querystring: { format: 'jdbc' },
        body: {
          query: 'source=logs',
          fetch_size: 500,
          // Long enough that an interactive query completes inline rather than costing a job
          // id plus a poll interval before any rows appear.
          wait_for_completion_timeout: '1s',
          keep_alive: '5m',
        },
      });
      expect(res.ok).toHaveBeenCalledWith({ body: { id: 'job-1', status: 'RUNNING' } });
    });

    describe('row limit', () => {
      const submitBody = async (query: string, uiSettingsGet?: jest.Mock) => {
        const { submit } = setup();
        const request = jest.fn().mockResolvedValue({ body: {} });
        await submit.handler(
          contextWith(request, undefined, uiSettingsGet),
          { query: {}, body: { query } } as any,
          createResponse()
        );
        return request.mock.calls[0][0].body;
      };

      it('caps a document search at discover:sampleSize', async () => {
        const get = jest.fn(async (key: string) => SAMPLE_SIZES[key]);
        const body = await submitBody('source=logs | where level = "ERROR"', get);
        expect(get).toHaveBeenCalledWith('discover:sampleSize');
        expect(body.fetch_size).toBe(500);
      });

      it('caps an aggregation at discover:aggregationSampleSize, since its rows are buckets', async () => {
        const get = jest.fn(async (key: string) => SAMPLE_SIZES[key]);
        const body = await submitBody('source=logs | stats count() by span(@timestamp, 1h)', get);
        expect(get).toHaveBeenCalledWith('discover:aggregationSampleSize');
        expect(body.fetch_size).toBe(10000);
      });

      it('sends no limit when the query already ends with head', async () => {
        const get = jest.fn(async (key: string) => SAMPLE_SIZES[key]);
        const body = await submitBody('source=logs | head 20', get);
        expect(get).not.toHaveBeenCalled();
        expect(body).not.toHaveProperty('fetch_size');
      });

      it('still limits when head appears only inside a subquery', async () => {
        const body = await submitBody('source=logs | where id in [ source=other | head 5 ]');
        expect(body.fetch_size).toBe(500);
      });

      it('follows a changed sample size', async () => {
        const body = await submitBody('source=logs', jest.fn().mockResolvedValue(250));
        expect(body.fetch_size).toBe(250);
      });
    });

    it('forwards caller-supplied lifecycle durations', async () => {
      const { submit } = setup();
      const request = jest.fn().mockResolvedValue({ body: {} });

      await submit.handler(
        contextWith(request),
        {
          query: {},
          body: { query: 'source=logs', waitForCompletionTimeout: '2s', keepAlive: '10m' },
        } as any,
        createResponse()
      );

      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            wait_for_completion_timeout: '2s',
            keep_alive: '10m',
          }),
        })
      );
    });

    it('passes through a fast-path response that carries no job id', async () => {
      const { submit } = setup();
      const final = { status: 'SUCCEEDED', took: 205, total: 5, size: 5, datarows: [[1]] };
      const res = createResponse();

      await submit.handler(
        contextWith(jest.fn().mockResolvedValue({ body: final })),
        { query: {}, body: { query: 'source=logs' } } as any,
        res
      );

      expect(res.ok).toHaveBeenCalledWith({ body: final });
    });

    it('uses the data source client when a dataSourceId is given', async () => {
      const { submit } = setup();
      const request = jest.fn().mockResolvedValue({ body: {} });
      const getClient = jest.fn().mockResolvedValue({ transport: { request } });

      await submit.handler(
        contextWith(jest.fn(), getClient),
        { query: { dataSourceId: 'ds-1' }, body: { query: 'source=logs' } } as any,
        createResponse()
      );

      expect(getClient).toHaveBeenCalledWith('ds-1');
      expect(request).toHaveBeenCalled();
    });

    it('returns 400 when a dataSourceId is given but the plugin is unavailable', async () => {
      const { submit } = setup();
      const request = jest.fn();
      const res = createResponse();

      await submit.handler(
        contextWith(request),
        { query: { dataSourceId: 'ds-1' }, body: { query: 'source=logs' } } as any,
        res
      );

      expect(request).not.toHaveBeenCalled();
      expect(res.custom).toHaveBeenCalledWith({
        statusCode: 400,
        body: 'dataSourceId is not supported because data source plugin is unavailable',
      });
    });

    it('coerces a 500 from the cluster to 503', async () => {
      const { submit } = setup();
      const res = createResponse();

      await submit.handler(
        contextWith(jest.fn().mockRejectedValue({ statusCode: 500, message: 'boom' })),
        { query: {}, body: { query: 'source=logs' } } as any,
        res
      );

      expect(res.custom).toHaveBeenCalledWith({ statusCode: 503, body: 'boom' });
    });
  });

  describe('submit validation', () => {
    const validateBody = (body: unknown) => () =>
      setup().submit.config.validate.body.validate(body);

    it('rejects a wait_for_completion_timeout above the contract maximum of 30s', () => {
      expect(validateBody({ query: 'source=logs', waitForCompletionTimeout: '31s' })).toThrow(
        /must not exceed 30000ms/
      );
    });

    it('accepts a wait_for_completion_timeout at the maximum', () => {
      expect(validateBody({ query: 'source=logs', waitForCompletionTimeout: '30s' })).not.toThrow();
    });

    it('rejects a keep_alive above the contract maximum of 24h', () => {
      expect(validateBody({ query: 'source=logs', keepAlive: '25h' })).toThrow(
        /must not exceed 86400000ms/
      );
    });

    it('rejects a zero duration', () => {
      expect(validateBody({ query: 'source=logs', keepAlive: '0s' })).toThrow(
        /must be greater than zero/
      );
    });

    it('rejects a malformed duration', () => {
      expect(validateBody({ query: 'source=logs', keepAlive: 'soon' })).toThrow(
        /must be a duration/
      );
    });

    it('rejects an empty query', () => {
      expect(validateBody({ query: '' })).toThrow();
    });
  });

  describe('poll', () => {
    it('applies window and sequence defaults', async () => {
      const { poll } = setup();
      const request = jest.fn().mockResolvedValue({ body: { status: 'RUNNING' } });

      await poll.handler(
        contextWith(request),
        { params: { id: 'job-1' }, query: {} } as any,
        createResponse()
      );

      expect(request).toHaveBeenCalledWith({
        method: 'GET',
        path: `${URI.PPL_JOBS}/job-1`,
        querystring: { offset: '0', count: '500' },
      });
    });

    it('forwards an explicit window and long-poll parameters', async () => {
      const { poll } = setup();
      const request = jest.fn().mockResolvedValue({ body: {} });

      await poll.handler(
        contextWith(request),
        {
          params: { id: 'job-1' },
          query: {
            offset: 1000,
            count: 250,
            waitForCompletionTimeout: '1s',
            keepAlive: '5m',
          },
        } as any,
        createResponse()
      );

      expect(request).toHaveBeenCalledWith({
        method: 'GET',
        path: `${URI.PPL_JOBS}/job-1`,
        querystring: {
          offset: '1000',
          count: '250',
          wait_for_completion_timeout: '1s',
          keep_alive: '5m',
        },
      });
    });

    it('percent-encodes the job id, which is an opaque base64-ish handle', async () => {
      const { poll } = setup();
      const request = jest.fn().mockResolvedValue({ body: {} });

      await poll.handler(
        contextWith(request),
        { params: { id: 'a/b+c=' }, query: {} } as any,
        createResponse()
      );

      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({ path: `${URI.PPL_JOBS}/a%2Fb%2Bc%3D` })
      );
    });

    it('maps a cluster 404 to notFound, since expiry and cancellation are expected', async () => {
      const { poll } = setup();
      const res = createResponse();

      await poll.handler(
        contextWith(jest.fn().mockRejectedValue({ meta: { statusCode: 404 } })),
        { params: { id: 'job-1' }, query: {} } as any,
        res
      );

      expect(res.notFound).toHaveBeenCalledWith({ body: 'No such PPL job: job-1' });
      expect(res.custom).not.toHaveBeenCalled();
    });

    it('reads a status reported only under meta', async () => {
      const { poll } = setup();
      const res = createResponse();

      await poll.handler(
        contextWith(jest.fn().mockRejectedValue({ meta: { statusCode: 400 }, message: 'bad' })),
        { params: { id: 'job-1' }, query: {} } as any,
        res
      );

      expect(res.custom).toHaveBeenCalledWith({ statusCode: 400, body: 'bad' });
    });

    it('unwraps a transport result that is not wrapped in a body', async () => {
      const { poll } = setup();
      const raw = { status: 'RUNNING', total: 10 };
      const res = createResponse();

      await poll.handler(
        contextWith(jest.fn().mockResolvedValue(raw)),
        { params: { id: 'job-1' }, query: {} } as any,
        res
      );

      expect(res.ok).toHaveBeenCalledWith({ body: raw });
    });

    it('rejects a count below one', () => {
      const { poll } = setup();
      expect(() => poll.config.validate.query.validate({ count: 0 })).toThrow();
    });

    it('does not cap count, since max_page_size is a cluster setting', () => {
      const { poll } = setup();
      expect(() => poll.config.validate.query.validate({ count: 100000 })).not.toThrow();
    });
  });

  describe('cancel', () => {
    it('deletes the job', async () => {
      const { cancel } = setup();
      const request = jest.fn().mockResolvedValue({ body: { id: 'job-1', status: 'CANCELLED' } });
      const res = createResponse();

      await cancel.handler(
        contextWith(request),
        { params: { id: 'job-1' }, query: {} } as any,
        res
      );

      expect(request).toHaveBeenCalledWith({
        method: 'DELETE',
        path: `${URI.PPL_JOBS}/job-1`,
      });
      expect(res.ok).toHaveBeenCalledWith({ body: { id: 'job-1', status: 'CANCELLED' } });
    });

    it('reports an already-released job as cancelled so aborting is idempotent', async () => {
      const { cancel } = setup();
      const res = createResponse();

      await cancel.handler(
        contextWith(jest.fn().mockRejectedValue({ meta: { statusCode: 404 } })),
        { params: { id: 'job-1' }, query: {} } as any,
        res
      );

      expect(res.ok).toHaveBeenCalledWith({ body: { id: 'job-1', status: 'CANCELLED' } });
      expect(res.custom).not.toHaveBeenCalled();
    });

    it('surfaces other failures', async () => {
      const { cancel } = setup();
      const res = createResponse();

      await cancel.handler(
        contextWith(jest.fn().mockRejectedValue({ statusCode: 403, message: 'forbidden' })),
        { params: { id: 'job-1' }, query: {} } as any,
        res
      );

      expect(res.custom).toHaveBeenCalledWith({ statusCode: 403, body: 'forbidden' });
    });
  });
});
