/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { SavedObjectsPermissionControlContract } from './client';

export const savedObjectsPermissionControlMock: SavedObjectsPermissionControlContract = {
  setup: jest.fn(),
  validate: jest.fn(),
  batchValidate: jest.fn(),
  getPrincipalsOfObjects: jest.fn(),
  getPermittedWorkspaceIds: jest.fn(),
  getPrincipalsFromRequest: jest.fn(),
};
