/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';

import '@testing-library/jest-dom/vitest'; // extends Vitest's expect method with methods from react-testing-library

expect.extend(matchers);

global.ResizeObserver =
  global.ResizeObserver ||
  vi.fn().mockImplementation(() => ({
    disconnect: vi.fn(),
    observe: vi.fn(),
    unobserve: vi.fn(),
  }));

afterEach(() => {
  cleanup();
});
