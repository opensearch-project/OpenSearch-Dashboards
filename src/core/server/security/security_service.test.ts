/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenSearchDashboardsRequest } from '../index';
import { mockCoreContext } from '../core_context.mock';
import { SecurityService } from './security_service';
import { httpServerMock } from '../http/http_server.mocks';
import { IReadOnlyService } from './types';

describe('SecurityService', () => {
  let securityService: SecurityService;
  let request: OpenSearchDashboardsRequest;

  beforeEach(() => {
    const coreContext = mockCoreContext.create();
    securityService = new SecurityService(coreContext);
    request = httpServerMock.createOpenSearchDashboardsRequest();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('#readonlyService', () => {
    it("uses core's readonly service by default", () => {
      const setupContext = securityService.setup();
      expect(setupContext.readonlyService().isReadonly(request)).resolves.toBeFalsy();
    });

    it('registers custom readonly service and it uses it', () => {
      const setupContext = securityService.setup();
      const readonlyServiceMock: jest.Mocked<IReadOnlyService> = {
        isReadonly: jest.fn(),
        hideForReadonly: jest.fn(),
      };

      setupContext.registerReadonlyService(readonlyServiceMock);
      setupContext.readonlyService().isReadonly(request);

      expect(readonlyServiceMock.isReadonly).toBeCalledTimes(1);
    });
  });
});
