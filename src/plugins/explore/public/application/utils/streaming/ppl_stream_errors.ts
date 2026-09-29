/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable max-classes-per-file */

/**
 * Thrown when a streaming job is gone: expired past its `keep_alive`, already cancelled, or its
 * owner node left the cluster. Distinguished from other failures because it is an expected
 * lifecycle outcome, not an error condition.
 */
export class PPLStreamJobNotFoundError extends Error {
  constructor(public readonly jobId: string) {
    super(`PPL streaming job not found: ${jobId}`);
    this.name = 'PPLStreamJobNotFoundError';
  }
}

export const PPL_STREAM_UNAVAILABLE_ERROR_NAME = 'PPLStreamUnavailableError';

/**
 * Thrown when a streaming run failed before publishing anything, so nothing is on screen and the
 * query can simply be re-run on the non-streaming path. The common cause is an engine that does not
 * serve the async PPL API, which cannot be detected reliably in advance.
 *
 * Distinguished from a mid-stream failure, where rows are already rendered and re-running would
 * replace them.
 */
export class PPLStreamUnavailableError extends Error {
  constructor(public readonly cause: unknown) {
    super(cause instanceof Error ? cause.message : String(cause));
    this.name = PPL_STREAM_UNAVAILABLE_ERROR_NAME;
  }
}
