/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { collectInFlightJobs, releaseInFlightJobs } from './release_jobs_on_unload';

const stateWith = (statuses: Record<string, unknown>) =>
  ({ queryEditor: { queryStatusMap: statuses } }) as any;

describe('collectInFlightJobs', () => {
  it('collects runs still polling, with their data source', () => {
    expect(
      collectInFlightJobs(
        stateWith({
          table: { streaming: { isPolling: true, jobId: 'job-1' } },
          histogram: { streaming: { isPolling: true, jobId: 'job-2', dataSourceId: 'ds-1' } },
        })
      )
    ).toEqual([
      { jobId: 'job-1', dataSourceId: undefined },
      { jobId: 'job-2', dataSourceId: 'ds-1' },
    ]);
  });

  it('includes finished runs, whose job still holds its result until keep_alive lapses', () => {
    expect(
      collectInFlightJobs(stateWith({ a: { streaming: { isPolling: false, jobId: 'job-1' } } }))
    ).toEqual([{ jobId: 'job-1', dataSourceId: undefined }]);
  });

  it('ignores the fast path, which never created a job', () => {
    expect(collectInFlightJobs(stateWith({ a: { streaming: { isPolling: true } } }))).toEqual([]);
  });

  it('ignores non-streaming queries', () => {
    expect(collectInFlightJobs(stateWith({ a: { status: 'loading' } }))).toEqual([]);
  });

  it('tolerates an empty or absent status map', () => {
    expect(collectInFlightJobs(stateWith({}))).toEqual([]);
    expect(collectInFlightJobs({} as any)).toEqual([]);
  });
});

describe('releaseInFlightJobs', () => {
  const originalFetch = global.fetch;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn().mockResolvedValue(undefined);
    global.fetch = fetchMock as any;
  });
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('issues a keepalive DELETE per in-flight job, so it outlives the document', () => {
    releaseInFlightJobs({
      state: stateWith({ a: { streaming: { isPolling: true, jobId: 'job-1' } } }),
      prependBasePath: (path) => `/base${path}`,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/base/api/enhancements/ppl/stream/job/job-1');
    expect(init).toMatchObject({ method: 'DELETE', keepalive: true });
    expect(init.headers).toMatchObject({ 'osd-xsrf': 'true' });
  });

  it('encodes the job id, which is opaque and base64-ish', () => {
    releaseInFlightJobs({
      state: stateWith({ a: { streaming: { isPolling: true, jobId: 'a/b+c=' } } }),
      prependBasePath: (path) => path,
    });

    expect(fetchMock.mock.calls[0][0]).toBe('/api/enhancements/ppl/stream/job/a%2Fb%2Bc%3D');
  });

  it('targets the job data source, so a remote job is released against its own cluster', () => {
    releaseInFlightJobs({
      state: stateWith({
        a: { streaming: { isPolling: true, jobId: 'job-1', dataSourceId: 'ds/1' } },
      }),
      prependBasePath: (path) => path,
    });

    expect(fetchMock.mock.calls[0][0]).toBe(
      '/api/enhancements/ppl/stream/job/job-1?dataSourceId=ds%2F1'
    );
  });

  it('does nothing when there is no job to release', () => {
    releaseInFlightJobs({ state: stateWith({}), prependBasePath: (path) => path });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('never throws during unload, even if fetch is unavailable', () => {
    global.fetch = (() => {
      throw new Error('gone');
    }) as any;

    expect(() =>
      releaseInFlightJobs({
        state: stateWith({ a: { streaming: { isPolling: true, jobId: 'job-1' } } }),
        prependBasePath: (path) => path,
      })
    ).not.toThrow();
  });
});
