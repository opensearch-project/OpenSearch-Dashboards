/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PPL_STREAM_API } from './ppl_stream_constants';
import { RootState } from '../state_management/store';

/**
 * Releases server-side streaming jobs when the page goes away.
 *
 * The client is the only holder of a job id: the backend exposes no way to enumerate jobs, and the id
 * is not persisted across a reload. A job abandoned without being released therefore cannot be
 * cancelled by anyone, and holds its entire result in cluster heap until `keep_alive` lapses.
 *
 * Reading is what renews `keep_alive`, so an abandoned job does expire a few minutes after its last
 * poll. This makes that reclamation prompt rather than delayed; it is best effort by nature, since an
 * unload handler is not guaranteed to run.
 */

/**
 * Every job id the page knows of, whether or not its run is still polling.
 *
 * A completed job keeps holding its result until `keep_alive` lapses, so it is worth releasing too —
 * a finished high-cardinality histogram can be holding millions of buckets. Releasing twice is
 * harmless: the route reports an already-released job as cancelled.
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
