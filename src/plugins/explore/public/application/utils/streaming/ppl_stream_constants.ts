/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PPLStreamProgress, PPLStreamStatus } from '../../../../../query_enhancements/common';

/**
 * Runtime constants and helpers for streaming PPL queries, defined locally in `explore`.
 *
 * The types live in `query_enhancements/common` and are imported with `import type`, which the
 * bundler erases. Runtime *values* cannot cross that boundary: the optimizer only permits value
 * imports from a plugin's `public` entry point and `common/metrics`, and anything else fails the
 * build with "references a non-public export of the [queryEnhancements] bundle". So the handful of
 * values below are duplicated here rather than imported.
 */

/**
 * OSD route paths, which must stay in step with the routes registered in
 * `query_enhancements/server/routes/ppl_stream.ts` (`API.PPL_STREAM_SUBMIT` / `API.PPL_STREAM_JOB`).
 */
export const PPL_STREAM_API = {
  SUBMIT: '/api/enhancements/ppl/stream',
  JOB: '/api/enhancements/ppl/stream/job',
} as const;

/** Any progress counter may be this when the engine cannot supply it for a given plan. */
export const PPL_STREAM_UNKNOWN = -1;

const TERMINAL: ReadonlySet<string> = new Set(['SUCCEEDED', 'FAILED', 'CANCELLED']);

/** Terminal does not imply success, so callers must still check for `SUCCEEDED` specifically. */
export const isTerminalPPLStreamStatus = (status: PPLStreamStatus): boolean => TERMINAL.has(status);

export const isPPLStreamProgressKnown = (progress?: PPLStreamProgress): boolean =>
  typeof progress?.fraction_done === 'number' && progress.fraction_done >= 0;
