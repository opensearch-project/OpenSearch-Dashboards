/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { loggerMock } from '../logging/logger.mock';
import { httpServerMock } from '../mocks';
import {
  initializeACLAuditor,
  getACLAuditor,
  cleanUpACLAuditor,
  ACLAuditorStateKey,
} from './acl_auditor';

describe('#getACLAuditor', () => {
  it('should be able to get ACL auditor if request initialized', () => {
    const mockRequest = httpServerMock.createOpenSearchDashboardsRequest();
    const uninilizedMockRequest = httpServerMock.createOpenSearchDashboardsRequest();
    const mockedLogger = loggerMock.create();
    initializeACLAuditor(mockRequest, mockedLogger);
    expect(getACLAuditor(mockRequest)).not.toBeFalsy();
    expect(getACLAuditor(uninilizedMockRequest)).toBeFalsy();
  });
});

describe('#cleanUpACLAuditor', () => {
  it('should be able to destroy the auditor', () => {
    const mockRequest = httpServerMock.createOpenSearchDashboardsRequest();
    const mockedLogger = loggerMock.create();
    initializeACLAuditor(mockRequest, mockedLogger);
    expect(getACLAuditor(mockRequest)).not.toBeFalsy();
    cleanUpACLAuditor(mockRequest);
    expect(getACLAuditor(mockRequest)).toBeFalsy();
  });
});

describe('#ACLAuditor', () => {
  it('should log error when auditor value is not correct', () => {
    const mockRequest = httpServerMock.createOpenSearchDashboardsRequest();
    const mockedLogger = loggerMock.create();
    initializeACLAuditor(mockRequest, mockedLogger);
    const ACLAuditorInstance = getACLAuditor(mockRequest);
    ACLAuditorInstance?.increment(ACLAuditorStateKey.DATABASE_OPERATION, 1);
    ACLAuditorInstance?.checkout();
    expect(
      mockedLogger.error.mock.calls[0][0].toString().startsWith('[ACLCounterCheckoutFailed]')
    ).toEqual(true);
    ACLAuditorInstance?.checkout();
    expect(mockedLogger.error).toBeCalledTimes(1);
  });
});
