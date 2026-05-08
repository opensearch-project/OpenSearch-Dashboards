/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenSearchDashboardsRequest } from '../index';
import { mockCoreContext } from '../core_context.mock';
import { SecurityService } from './security_service';
import { httpServerMock } from '../http/http_server.mocks';
import { IReadOnlyService } from './types';
import { httpServiceMock } from '../mocks';
import { InternalHttpServiceSetupMock } from '../http/http_service.mock';

describe('SecurityService', () => {
  let securityService: SecurityService;
  let request: OpenSearchDashboardsRequest;
  let http: InternalHttpServiceSetupMock;

  beforeEach(() => {
    const coreContext = mockCoreContext.create();
    securityService = new SecurityService(coreContext);
    request = httpServerMock.createOpenSearchDashboardsRequest();
    http = httpServiceMock.createInternalSetupContract();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('#readonlyService', () => {
    it("uses core's readonly service by default", () => {
      const setupContext = securityService.setup({ http });
      expect(setupContext.readonlyService().isReadonly(request)).resolves.toBeFalsy();
    });

    it('registers custom readonly service and it uses it', () => {
      const setupContext = securityService.setup({ http });
      const readonlyServiceMock: jest.Mocked<IReadOnlyService> = {
        isReadonly: jest.fn(),
        hideForReadonly: jest.fn(),
      };

      setupContext.registerReadonlyService(readonlyServiceMock);
      setupContext.readonlyService().isReadonly(request);

      expect(readonlyServiceMock.isReadonly).toBeCalledTimes(1);
    });
  });

  describe('#identitySourceService', () => {
    it('should register identity source service and uses it', () => {
      const setupContext = securityService.setup({ http });
      const mockIdentitySourceHandler = { getIdentityEntries: jest.fn() };
      const registerIdentitySourceHandlerMock = jest.fn();
      setupContext.registerIdentitySourceHandler = registerIdentitySourceHandlerMock;
      setupContext.registerIdentitySourceHandler('source1', mockIdentitySourceHandler);

      expect(registerIdentitySourceHandlerMock).toBeCalledTimes(1);
      expect(registerIdentitySourceHandlerMock).toHaveBeenCalledWith(
        'source1',
        mockIdentitySourceHandler
      );
    });
  });
});
