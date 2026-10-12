/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PPLStreamProgress, PPLStreamStatus } from '../../../../../query_enhancements/common';

/**
 * Runtime constants for streaming PPL queries, duplicated here rather than imported.
 *
 * Types cross from `query_enhancements/common` via `import type`, which the bundler erases. Values
 * cannot: the optimizer only permits value imports from a plugin's `public` entry point, and
 * anything else fails the build as "references a non-public export".
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
