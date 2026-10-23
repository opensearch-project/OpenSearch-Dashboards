/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable max-classes-per-file */

/**
 * A job that is gone: expired past `keep_alive`, already cancelled, or its owner node left the
 * cluster. Separate from other failures because it is an expected lifecycle outcome.
 */
export class PPLStreamJobNotFoundError extends Error {
  constructor(public readonly jobId: string) {
    super(`PPL streaming job not found: ${jobId}`);
    this.name = 'PPLStreamJobNotFoundError';
  }
}

export const PPL_STREAM_UNAVAILABLE_ERROR_NAME = 'PPLStreamUnavailableError';

/**
 * A run that failed before publishing anything, so nothing is on screen and the query can be re-run
 * on the non-streaming path. Usually an engine that does not serve the async PPL API, which cannot
 * be detected in advance. Distinct from a mid-stream failure, where rows are already rendered.
 */
export class PPLStreamUnavailableError extends Error {
  constructor(public readonly cause: unknown) {
    super(cause instanceof Error ? cause.message : String(cause));
    this.name = PPL_STREAM_UNAVAILABLE_ERROR_NAME;
  }
}
