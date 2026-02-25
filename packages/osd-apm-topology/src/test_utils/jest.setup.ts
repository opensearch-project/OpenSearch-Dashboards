/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';

// Mock ResizeObserver which is not available in jsdom
global.ResizeObserver =
  global.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));

afterEach(() => {
  cleanup();
});
