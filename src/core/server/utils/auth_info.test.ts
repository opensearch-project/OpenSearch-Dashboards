/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthStatus } from '../http/auth_state_storage';
import { httpServerMock, httpServiceMock } from '../mocks';
import { getPrincipalsFromRequest } from './auth_info';

describe('utils', () => {
  const mockAuth = httpServiceMock.createAuth();
  it('should return empty map when request do not have authentication', () => {
    const mockRequest = httpServerMock.createOpenSearchDashboardsRequest();
    mockAuth.get.mockReturnValueOnce({
      status: AuthStatus.unknown,
      state: {
        authInfo: {
          user_name: 'bar',
          backend_roles: ['foo'],
        },
      },
    });
    const result = getPrincipalsFromRequest(mockRequest, mockAuth);
    expect(result).toEqual({});
  });

  it('should return normally when request has authentication', () => {
    const mockRequest = httpServerMock.createOpenSearchDashboardsRequest();
    mockAuth.get.mockReturnValueOnce({
      status: AuthStatus.authenticated,
      state: {
        authInfo: {
          user_name: 'bar',
          backend_roles: ['foo'],
        },
      },
    });
    const result = getPrincipalsFromRequest(mockRequest, mockAuth);
    expect(result.users).toEqual(['bar']);
    expect(result.groups).toEqual(['foo']);
  });

  it('should throw error when request is not authenticated', () => {
    const mockRequest = httpServerMock.createOpenSearchDashboardsRequest();
    mockAuth.get.mockReturnValueOnce({
      status: AuthStatus.unauthenticated,
      state: {},
    });
    expect(() => getPrincipalsFromRequest(mockRequest, mockAuth)).toThrow('NOT_AUTHORIZED');
  });

  it('should throw error when authentication status is not expected', () => {
    const mockRequest = httpServerMock.createOpenSearchDashboardsRequest();
    mockAuth.get.mockReturnValueOnce({
      // @ts-expect-error
      status: 'foo',
      state: {},
    });
    expect(() => getPrincipalsFromRequest(mockRequest, mockAuth)).toThrow(
      'UNEXPECTED_AUTHORIZATION_STATUS'
    );
  });
});
