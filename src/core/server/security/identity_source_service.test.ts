/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { loggingSystemMock } from '../mocks';
import { IdentitySourceService } from './identity_source_service';
import { IdentitySourceHandler } from './types';

describe('IdentitySourceService', () => {
  const sourceA = 'sourceA';
  const sourceB = 'sourceB';

  const createMockHandler = (
    options: Partial<IdentitySourceHandler> = {}
  ): IdentitySourceHandler => ({
    getIdentityEntries: jest.fn(),
    getIdentityEntriesByIds: jest.fn(),
    ...options,
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerIdentitySourceHandler', () => {
    it('should register a handler and log the registration', () => {
      const logger = loggingSystemMock.create().get();
      const service = new IdentitySourceService(logger);
      const mockHandler = createMockHandler();

      service.registerIdentitySourceHandler(sourceA, mockHandler);

      expect(logger.info).toHaveBeenCalledTimes(1);
      expect(logger.info).toHaveBeenCalledWith('Register sourceA type identity source handler');
    });

    it('should throw an error when registering with the same source', () => {
      const logger = loggingSystemMock.create().get();
      const service = new IdentitySourceService(logger);
      const mockHandler1 = createMockHandler();
      const mockHandler2 = createMockHandler();

      service.registerIdentitySourceHandler(sourceA, mockHandler1);

      expect(() => {
        service.registerIdentitySourceHandler(sourceA, mockHandler2);
      }).toThrow("Identity source 'sourceA' has already been registered");
    });

    it('should support registering multiple different sources', () => {
      const logger = loggingSystemMock.create().get();
      const service = new IdentitySourceService(logger);
      const mockHandlerA = createMockHandler();
      const mockHandlerB = createMockHandler();

      service.registerIdentitySourceHandler(sourceA, mockHandlerA);
      service.registerIdentitySourceHandler(sourceB, mockHandlerB);

      expect(service.getIdentitySourceHandler(sourceA)).toBe(mockHandlerA);
      expect(service.getIdentitySourceHandler(sourceB)).toBe(mockHandlerB);
    });
  });

  describe('getIdentitySourceHandler', () => {
    it('should return the correct handler when the source is registered', () => {
      const logger = loggingSystemMock.create().get();
      const service = new IdentitySourceService(logger);
      const mockHandler = createMockHandler();

      service.registerIdentitySourceHandler(sourceA, mockHandler);
      const handler = service.getIdentitySourceHandler(sourceA);

      expect(handler).toBe(mockHandler);
    });

    it('should throw an error when the source is not registered', () => {
      const logger = loggingSystemMock.create().get();
      const service = new IdentitySourceService(logger);

      expect(() => {
        service.getIdentitySourceHandler(sourceB);
      }).toThrow("Identity source 'sourceB' has not been registered");
    });

    it('should throw an error with the correct source name in the message', () => {
      const logger = loggingSystemMock.create().get();
      const service = new IdentitySourceService(logger);
      const unknownSource = 'unknown-source';

      expect(() => {
        service.getIdentitySourceHandler(unknownSource);
      }).toThrow(`Identity source 'unknown-source' has not been registered`);
    });
  });
});
