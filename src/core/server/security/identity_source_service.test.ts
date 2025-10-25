/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { loggingSystemMock } from '../mocks';
import { IdentitySourceService } from './identity_source_service';

describe('IdentitySourceService', () => {
  const logger = loggingSystemMock.create().get();
  const sourceA = 'sourceA';
  const sourceB = 'sourceB';

  test('should return the correct handler when the source is registered', async () => {
    const service = new IdentitySourceService(logger);

    const mockHandler = {
      getIdentityEntries: jest.fn(),
      getIdentityEntriesByIds: jest.fn(),
    };

    service.registerIdentitySourceHandler(sourceA, mockHandler);
    const handler = service.getIdentitySourceHandler(sourceA);

    expect(handler).toBe(mockHandler);
    expect(logger.info).toHaveBeenCalledWith('Register sourceA type handler');
  });

  test('should throw an error when the source is not registered', async () => {
    const service = new IdentitySourceService(logger);
    expect(() => {
      service.getIdentitySourceHandler(sourceB);
    }).toThrowError("Identity source 'sourceB' is not supported.");
  });

  test('should override an existing handler when registering a new one with the same source', async () => {
    const service = new IdentitySourceService(logger);

    const mockHandler1 = {
      getIdentityEntries: jest.fn(),
    };

    const mockHandler2 = {
      getIdentityEntriesByIds: jest.fn(),
    };

    service.registerIdentitySourceHandler(sourceA, mockHandler1);
    service.registerIdentitySourceHandler(sourceA, mockHandler2);

    const handler = service.getIdentitySourceHandler(sourceA);

    expect(handler).toBe(mockHandler2);
  });

  test('should support to register multiple sources', async () => {
    const service = new IdentitySourceService(logger);

    const mockHandler1 = {
      getIdentityEntries: jest.fn(),
    };

    const mockHandler2 = {
      getIdentityEntriesByIds: jest.fn(),
    };

    service.registerIdentitySourceHandler(sourceA, mockHandler1);
    service.registerIdentitySourceHandler(sourceB, mockHandler2);

    const handlerA = service.getIdentitySourceHandler(sourceA);
    const handlerB = service.getIdentitySourceHandler(sourceB);

    expect(handlerA).toBe(mockHandler1);
    expect(handlerB).toBe(mockHandler2);
  });
});
