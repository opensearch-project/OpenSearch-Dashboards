/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PPL_STREAM_API } from './ppl_stream_constants';
import { RootState } from '../state_management/store';

/**
 * Releases server-side streaming jobs when the page goes away.
 *
 * The client is the sole holder of a job id — the backend cannot enumerate jobs and the id does not
 * survive a reload — so an abandoned job can be cancelled by no one and holds its result in cluster
 * heap until `keep_alive` lapses. Best effort: an unload handler is not guaranteed to run.
 */

/**
 * Every job the page knows of, including completed ones: a finished job holds its result until
 * `keep_alive` lapses. Releasing twice is harmless, as the route reports that as cancelled. The
 * `dataSourceId` is carried so the DELETE reaches the job's own cluster — without it the route
 * falls back to the local cluster, where a remote job 404s and leaks.
 */
export const collectInFlightJobs = (
  state: RootState
): Array<{ jobId: string; dataSourceId?: string }> => {
  const statuses = state?.queryEditor?.queryStatusMap ?? {};
  return Object.values(statuses)
    .map((status) => status?.streaming)
    .filter((s): s is NonNullable<typeof s> => typeof s?.jobId === 'string' && s.jobId.length > 0)
    .map((s) => ({ jobId: s.jobId as string, dataSourceId: s.dataSourceId }));
};

export interface ReleaseInFlightJobsArgs {
  state: RootState;
  /** Prepends the OSD base path; the raw `fetch` below bypasses the http client that would do it. */
  prependBasePath: (path: string) => string;
}

/**
 * `keepalive` is what allows the request to outlive the document. A normal `fetch` is cancelled during
 * teardown, and `sendBeacon` cannot be used because it only issues POST while the route is a DELETE.
 */
export const releaseInFlightJobs = ({ state, prependBasePath }: ReleaseInFlightJobsArgs): void => {
  for (const { jobId, dataSourceId } of collectInFlightJobs(state)) {
    try {
      const query = dataSourceId ? `?dataSourceId=${encodeURIComponent(dataSourceId)}` : '';
      fetch(prependBasePath(`${PPL_STREAM_API.JOB}/${encodeURIComponent(jobId)}${query}`), {
        method: 'DELETE',
        keepalive: true,
        headers: { 'osd-xsrf': 'true' },
      }).catch(() => undefined);
    } catch {
      // Unload is not a context in which to surface anything.
    }
  }
};
