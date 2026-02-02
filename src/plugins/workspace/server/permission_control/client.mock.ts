/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { SavedObjectsPermissionControlContract } from './client';

export const savedObjectsPermissionControlMock: SavedObjectsPermissionControlContract = {
  validate: jest.fn(),
  batchValidate: jest.fn(),
  getPrincipalsFromRequest: jest.fn(),
  setup: jest.fn(),
  validateSavedObjectsACL: jest.fn(),
  addToCacheAllowlist: jest.fn(),
  clearSavedObjectsCache: jest.fn(),
};
