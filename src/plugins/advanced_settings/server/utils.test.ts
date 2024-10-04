/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { coreMock, httpServerMock } from '../../../core/server/mocks';
import { extractUserName } from './utils';
import { AuthStatus } from '../../../core/server';

// help on write unit test on utils.ts with jest
describe('utils', () => {
  const isAuthenticatedMock = jest.fn().mockReturnValue(true);
  const getMock = jest.fn().mockReturnValue({
    status: AuthStatus.authenticated,
    state: {
      authInfo: {
        user_name: 'test_user',
      },
    },
  });
  const coreStartMock = {
    ...coreMock.createStart(),
    http: {
      ...coreMock.createStart().http,
      auth: {
        ...coreMock.createStart().http.auth,
        get: getMock,
        isAuthenticated: isAuthenticatedMock,
      },
    },
  };
  const requestMock = httpServerMock.createOpenSearchDashboardsRequest();

  // test extractUserName
  it('extractUserName when authenticated', () => {
    const result = extractUserName(requestMock, coreStartMock);
    expect(result).toBe('test_user');
  });

  it('extractUserName when not authenticated', () => {
    isAuthenticatedMock.mockReturnValue(false);
    getMock.mockReturnValue({ status: AuthStatus.unauthenticated });
    const result = extractUserName(requestMock, coreStartMock);
    expect(result).toBeFalsy();
  });

  it('extractUserName when auth status is unknown', () => {
    isAuthenticatedMock.mockReturnValue(false);
    getMock.mockReturnValue({ status: AuthStatus.unknown });
    const result = extractUserName(requestMock, coreStartMock);
    expect(result).toBeFalsy();
  });
});
