/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { configServiceMock, loggingSystemMock } from '../mocks';
import { IdentitySourceService } from './identity_source_service';

describe('IdentitySourceService', () => {
  const logger = loggingSystemMock.create().get();
  const configService = configServiceMock.create();

  test('should return the correct handler when the source is registered', async () => {
    configService.atPath.mockReturnValueOnce(
      new BehaviorSubject({ identity: { source: 'sourceA' } })
    );
    const service = new IdentitySourceService(logger, configService);

    const mockHandler = {
      getUsers: jest.fn(),
      getRoles: jest.fn(),
    };

    service.registerSourceHandler('sourceA', mockHandler);

    const handler = await service.getSourceHandler();

    expect(handler).toBe(mockHandler);
    expect(logger.info).toHaveBeenCalledWith('Register sourceA type handler');
  });

  test('should throw an error when the source is not registered', async () => {
    configService.atPath.mockReturnValueOnce(
      new BehaviorSubject({ identity: { source: 'sourceB' } })
    );
    const service = new IdentitySourceService(logger, configService);

    await expect(service.getSourceHandler()).rejects.toThrow(
      "Identity source 'sourceB' is not supported."
    );
  });

  test('should override an existing handler when registering a new one with the same source', async () => {
    configService.atPath.mockReturnValueOnce(
      new BehaviorSubject({ identity: { source: 'sourceA' } })
    );
    const service = new IdentitySourceService(logger, configService);

    const mockHandler1 = {
      getRoles: jest.fn(),
    };

    const mockHandler2 = {
      getUsers: jest.fn(),
    };

    service.registerSourceHandler('sourceA', mockHandler1);
    service.registerSourceHandler('sourceA', mockHandler2);

    const handler = await service.getSourceHandler();

    expect(handler).toBe(mockHandler2);
  });
});
