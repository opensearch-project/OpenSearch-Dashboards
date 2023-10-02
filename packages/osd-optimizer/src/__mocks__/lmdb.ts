/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

jest.mock('lmdb', () => {
  const mockedLmdb = {
    open: jest.fn(() => ({
      openDB: jest.fn(() => ({
        get: jest.fn(),
        putSync: jest.fn(),
        remove: jest.fn(),
      })),
    })),
  };
  return mockedLmdb;
});
