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
    registerAlias: jest.fn(),
  };
  return mock;
};

const createStartMock = (): jest.Mocked<SavedObjectsManagementNamespaceServiceStart> => {
  const mock = {
    getAll: jest.fn(),
    getAlias: jest.fn(),
  };

  mock.getAll.mockReturnValue([]);
  mock.getAlias.mockReturnValue('Namespace');

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
