/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export declare function extractCodeMessages(
  buffer: Buffer,
  reporter: unknown
): Generator<[string, { message: string; description?: string }], void>;
