/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Vitest compatibility layer for Jest.
 * Maps vitest APIs to their Jest equivalents so tests that
 * `import { vi, describe, ... } from 'vitest'` work under Jest.
 */

const vi = jest;

const { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, test } = globalThis;

export { vi, describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, test };
export type { Mock } from 'jest-mock';
