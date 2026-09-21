/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

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
