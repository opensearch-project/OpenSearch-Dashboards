/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { httpServerMock } from '../../../core/server/mocks';
import {
  initializeClientCallAuditor,
  getClientCallAuditor,
  CLIENT_CALL_AUDITOR_KEY,
  cleanUpClientCallAuditor,
} from './client_call_auditor';

describe('#getClientCallAuditor', () => {
  it('should be able to get clientCallAuditor if request initialized', () => {
    const mockRequest = httpServerMock.createOpenSearchDashboardsRequest();
    const uninilizedMockRequest = httpServerMock.createOpenSearchDashboardsRequest();
    initializeClientCallAuditor(mockRequest);
    expect(getClientCallAuditor(mockRequest)).not.toBeFalsy();
    expect(getClientCallAuditor(uninilizedMockRequest)).toBeFalsy();
  });
});

describe('#cleanUpClientCallAuditor', () => {
  it('should be able to destroy the auditor', () => {
    const mockRequest = httpServerMock.createOpenSearchDashboardsRequest();
    initializeClientCallAuditor(mockRequest);
    expect(getClientCallAuditor(mockRequest)).not.toBeFalsy();
    cleanUpClientCallAuditor(mockRequest);
    expect(getClientCallAuditor(mockRequest)).toBeFalsy();
  });
});

describe('#ClientCallAuditor', () => {
  it('should return false when auditor incoming not equal outgoing', () => {
    const mockRequest = httpServerMock.createOpenSearchDashboardsRequest();
    initializeClientCallAuditor(mockRequest);
    const ACLAuditorInstance = getClientCallAuditor(mockRequest);
    ACLAuditorInstance?.increment(CLIENT_CALL_AUDITOR_KEY.incoming);
    expect(ACLAuditorInstance?.isAsyncClientCallsBalanced()).toEqual(false);
  });
});
