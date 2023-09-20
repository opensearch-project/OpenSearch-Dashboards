/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { SavedObjectsPermissionControlContract } from './client';

export const savedObjectsPermissionControlMock: SavedObjectsPermissionControlContract = {
  validate: jest.fn(),
  batchValidate: jest.fn(),
  getPrincipalsOfObjects: jest.fn(),
  getPermittedWorkspaceIds: jest.fn(),
  setup: jest.fn(),
};
