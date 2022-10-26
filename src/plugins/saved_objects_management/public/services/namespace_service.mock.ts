/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import {
  SavedObjectsManagementNamespaceService,
  SavedObjectsManagementNamespaceServiceSetup,
  SavedObjectsManagementNamespaceServiceStart,
} from './namespace_service';

const createSetupMock = (): jest.Mocked<SavedObjectsManagementNamespaceServiceSetup> => {
  const mock = {
    register: jest.fn(),
  };
  return mock;
};

const createStartMock = (): jest.Mocked<SavedObjectsManagementNamespaceServiceStart> => {
  const mock = {
    has: jest.fn(),
    getAll: jest.fn(),
  };

  mock.has.mockReturnValue(true);
  mock.getAll.mockReturnValue([]);

  return mock;
};

const createServiceMock = (): jest.Mocked<
  PublicMethodsOf<SavedObjectsManagementNamespaceService>
> => {
  const mock = {
    setup: jest.fn().mockReturnValue(createSetupMock()),
    start: jest.fn().mockReturnValue(createStartMock()),
  };
  return mock;
};

export const namespaceServiceMock = {
  create: createServiceMock,
  createSetup: createSetupMock,
  createStart: createStartMock,
};
