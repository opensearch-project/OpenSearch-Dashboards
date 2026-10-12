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
 * Every job id the page knows of, including completed ones: a finished job holds its result until
 * `keep_alive` lapses. Releasing twice is harmless, as the route reports that as cancelled.
 */
export const collectInFlightJobIds = (state: RootState): string[] => {
  const statuses = state?.queryEditor?.queryStatusMap ?? {};
  return Object.values(statuses)
    .map((status) => status?.streaming?.jobId)
    .filter((jobId): jobId is string => typeof jobId === 'string' && jobId.length > 0);
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
  for (const jobId of collectInFlightJobIds(state)) {
    try {
      fetch(prependBasePath(`${PPL_STREAM_API.JOB}/${encodeURIComponent(jobId)}`), {
        method: 'DELETE',
        keepalive: true,
        headers: { 'osd-xsrf': 'true' },
      }).catch(() => undefined);
    } catch {
      // Unload is not a context in which to surface anything.
    }
  }
};
