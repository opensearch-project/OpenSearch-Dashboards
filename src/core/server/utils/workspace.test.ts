/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { httpServerMock } from '../mocks';
import { getWorkspaceState, updateWorkspaceState } from './workspace';

describe('updateWorkspaceState', () => {
  it('update with payload', () => {
    const requestMock = httpServerMock.createOpenSearchDashboardsRequest();
    updateWorkspaceState(requestMock, {
      requestWorkspaceId: 'foo',
      isDashboardAdmin: true,
      isDataSourceAdmin: true,
    });
    expect(getWorkspaceState(requestMock)).toEqual({
      requestWorkspaceId: 'foo',
      isDashboardAdmin: true,
      isDataSourceAdmin: true,
    });
  });
});
