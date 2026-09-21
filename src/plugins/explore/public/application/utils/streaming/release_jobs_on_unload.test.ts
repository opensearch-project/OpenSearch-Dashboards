/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { collectInFlightJobIds, releaseInFlightJobs } from './release_jobs_on_unload';

const stateWith = (statuses: Record<string, unknown>) =>
  ({ queryEditor: { queryStatusMap: statuses } }) as any;

describe('collectInFlightJobIds', () => {
  it('collects ids of runs still polling', () => {
    expect(
      collectInFlightJobIds(
        stateWith({
          table: { streaming: { isPolling: true, jobId: 'job-1' } },
          histogram: { streaming: { isPolling: true, jobId: 'job-2' } },
        })
      )
    ).toEqual(['job-1', 'job-2']);
  });

  it('includes finished runs, whose job still holds its result until keep_alive lapses', () => {
    expect(
      collectInFlightJobIds(stateWith({ a: { streaming: { isPolling: false, jobId: 'job-1' } } }))
    ).toEqual(['job-1']);
  });

  it('ignores the fast path, which never created a job', () => {
    expect(collectInFlightJobIds(stateWith({ a: { streaming: { isPolling: true } } }))).toEqual([]);
  });

  it('ignores non-streaming queries', () => {
    expect(collectInFlightJobIds(stateWith({ a: { status: 'loading' } }))).toEqual([]);
  });

  it('tolerates an empty or absent status map', () => {
    expect(collectInFlightJobIds(stateWith({}))).toEqual([]);
    expect(collectInFlightJobIds({} as any)).toEqual([]);
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
