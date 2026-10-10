/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PPL_STREAM_API } from './ppl_stream_constants';
import { PPLStreamJobNotFoundError, PPLStreamService } from './ppl_stream_service';

describe('PPLStreamService', () => {
  const createHttp = () => ({
    post: jest.fn().mockResolvedValue({ status: 'RUNNING' }),
    get: jest.fn().mockResolvedValue({ status: 'RUNNING' }),
    delete: jest.fn().mockResolvedValue({}),
  });

  describe('submit', () => {
    it('posts the query and omits absent lifecycle fields', async () => {
      const http = createHttp();
      await new PPLStreamService(http as any).submit({ query: 'source=logs' });

      expect(http.post).toHaveBeenCalledWith(PPL_STREAM_API.SUBMIT, {
        body: JSON.stringify({ query: 'source=logs' }),
        signal: undefined,
      });
    });

    it('includes lifecycle fields and dataSourceId when given', async () => {
      const http = createHttp();
      await new PPLStreamService(http as any).submit({
        query: 'source=logs',
        waitForCompletionTimeout: '1ms',
        keepAlive: '5m',
        dataSourceId: 'ds-1',
      });

      expect(http.post).toHaveBeenCalledWith(PPL_STREAM_API.SUBMIT, {
        body: JSON.stringify({
          query: 'source=logs',
          waitForCompletionTimeout: '1ms',
          keepAlive: '5m',
        }),
        query: { dataSourceId: 'ds-1' },
        signal: undefined,
      });
    });

    it('returns a fast-path snapshot unchanged', async () => {
      const http = createHttp();
      const final = { status: 'SUCCEEDED', total: 5, size: 5 };
      http.post.mockResolvedValue(final);

      await expect(
        new PPLStreamService(http as any).submit({ query: 'source=logs' })
      ).resolves.toBe(final);
    });
  });

  describe('poll', () => {
    it('sends only the parameters provided', async () => {
      const http = createHttp();
      await new PPLStreamService(http as any).poll({ id: 'job-1', offset: 0, count: 500 });

      expect(http.get).toHaveBeenCalledWith(`${PPL_STREAM_API.JOB}/job-1`, {
        query: { offset: 0, count: 500 },
        signal: undefined,
      });
    });

    it('forwards offset 0 rather than dropping it as falsy', async () => {
      const http = createHttp();
      await new PPLStreamService(http as any).poll({ id: 'job-1', offset: 0 });

      expect(http.get).toHaveBeenCalledWith(
        `${PPL_STREAM_API.JOB}/job-1`,
        expect.objectContaining({ query: { offset: 0 } })
      );
    });

    it('percent-encodes the opaque job id', async () => {
      const http = createHttp();
      await new PPLStreamService(http as any).poll({ id: 'a/b+c=' });

      expect(http.get).toHaveBeenCalledWith(
        `${PPL_STREAM_API.JOB}/a%2Fb%2Bc%3D`,
        expect.anything()
      );
    });

    it('translates a 404 body into PPLStreamJobNotFoundError', async () => {
      const http = createHttp();
      http.get.mockRejectedValue({ body: { statusCode: 404 } });

      await expect(new PPLStreamService(http as any).poll({ id: 'job-1' })).rejects.toBeInstanceOf(
        PPLStreamJobNotFoundError
      );
    });

    it('translates a 404 response status into PPLStreamJobNotFoundError', async () => {
      const http = createHttp();
      http.get.mockRejectedValue({ response: { status: 404 } });

      await expect(new PPLStreamService(http as any).poll({ id: 'job-1' })).rejects.toBeInstanceOf(
        PPLStreamJobNotFoundError
      );
    });

    it('rethrows other errors untouched so callers can distinguish them', async () => {
      const http = createHttp();
      const boom = { body: { statusCode: 503 }, message: 'unavailable' };
      http.get.mockRejectedValue(boom);

      await expect(new PPLStreamService(http as any).poll({ id: 'job-1' })).rejects.toBe(boom);
    });
  });

  describe('cancel', () => {
    it('deletes the job', async () => {
      const http = createHttp();
      await new PPLStreamService(http as any).cancel('job-1');

      expect(http.delete).toHaveBeenCalledWith(`${PPL_STREAM_API.JOB}/job-1`, {});
    });

    it('passes dataSourceId through', async () => {
      const http = createHttp();
      await new PPLStreamService(http as any).cancel('job-1', 'ds-1');

      expect(http.delete).toHaveBeenCalledWith(`${PPL_STREAM_API.JOB}/job-1`, {
        query: { dataSourceId: 'ds-1' },
      });
    });
  });
});
