/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IdentitySourceRegistry } from './identity_source_registry';
import { loggingSystemMock } from '../../../../core/server/mocks';

const logger = loggingSystemMock.create().get();

describe('IdentitySourceRegistry', () => {
  test('should register a source handler and retrieve it', () => {
    const registry = new IdentitySourceRegistry(logger, 'sourceA');

    const mockHandler = {
      getUsers: jest.fn(),
      getRoles: jest.fn(),
    };

    registry.registerSourceHandler('sourceA', mockHandler);

    const handler = registry.getSourceHandler();

    expect(handler).toBe(mockHandler);
    expect(logger.info).toHaveBeenCalledWith('Register sourceA type handler');
  });

  test('should throw an error if identity source is not supported', () => {
    const registry = new IdentitySourceRegistry(logger, 'sourceB');

    expect(() => {
      registry.getSourceHandler();
    }).toThrowError("Identity source 'sourceB' is not supported.");
  });

  test('should override an existing handler when registering a new one with the same source', () => {
    const registry = new IdentitySourceRegistry(logger, 'sourceA');

    const mockHandler1 = {
      getUsers: jest.fn(),
      getRoles: jest.fn(),
    };

    const mockHandler2 = {
      getUsers: jest.fn(),
      getRoles: jest.fn(),
    };

    registry.registerSourceHandler('sourceA', mockHandler1);
    registry.registerSourceHandler('sourceA', mockHandler2);

    const handler = registry.getSourceHandler();

    expect(handler).toBe(mockHandler2);
  });
});
