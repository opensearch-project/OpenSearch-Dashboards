/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { httpServerMock, savedObjectsClientMock, coreMock } from '../../../../core/server/mocks';
import { RepositoryWrapper } from './repository_wrapper';
import {
  ACLAuditorStateKey,
  getACLAuditor,
  initializeACLAuditor,
} from '../../../../core/server/utils';
import { loggerMock } from '@osd/logging/target/mocks';

describe('RepositoryWrapper', () => {
  const getMockedObjects = () => {
    const requestHandlerContext = coreMock.createRequestHandlerContext();
    const wrapperInstance = new RepositoryWrapper();
    const mockedClient = savedObjectsClientMock.create();
    const mockedRequest = httpServerMock.createOpenSearchDashboardsRequest();
    const mockedLogger = loggerMock.create();
    initializeACLAuditor(mockedRequest, mockedLogger);
    const wrapperClient = wrapperInstance.wrapperFactory({
      client: mockedClient,
      typeRegistry: requestHandlerContext.savedObjects.typeRegistry,
      request: mockedRequest,
    });
    return {
      client: wrapperClient,
      request: mockedRequest,
      ACLAuditorInstance: getACLAuditor(mockedRequest),
    };
  };
  describe('create', () => {
    it('should increment 1 in ACLAuditor', async () => {
      const { ACLAuditorInstance, client } = getMockedObjects();
      await client.create('dashboard', {
        name: 'foo',
      });
      expect(ACLAuditorInstance?.getState()[ACLAuditorStateKey.DATABASE_OPERATION]).toEqual(1);
    });
  });

  describe('bulkCreate', () => {
    it('should increment objects.length in ACLAuditor', async () => {
      const { ACLAuditorInstance, client } = getMockedObjects();
      await client.bulkCreate([
        {
          type: 'foo',
          id: 'foo',
          attributes: {},
        },
        {
          type: 'bar',
          id: 'bar',
          attributes: {},
        },
      ]);
      expect(ACLAuditorInstance?.getState()[ACLAuditorStateKey.DATABASE_OPERATION]).toEqual(2);
    });
  });

  describe('get', () => {
    it('should increment 1 in ACLAuditor', async () => {
      const { ACLAuditorInstance, client } = getMockedObjects();
      await client.get('foo', 'bar');
      expect(ACLAuditorInstance?.getState()[ACLAuditorStateKey.DATABASE_OPERATION]).toEqual(1);
    });
  });

  describe('bulkGet', () => {
    it('should increment objects.length in ACLAuditor', async () => {
      const { ACLAuditorInstance, client } = getMockedObjects();
      await client.bulkGet([
        {
          type: 'foo',
          id: 'foo',
        },
        {
          type: 'bar',
          id: 'bar',
        },
      ]);
      expect(ACLAuditorInstance?.getState()[ACLAuditorStateKey.DATABASE_OPERATION]).toEqual(2);
    });
  });

  describe('delete', () => {
    it('should increment 1 in ACLAuditor', async () => {
      const { ACLAuditorInstance, client } = getMockedObjects();
      await client.delete('foo', 'bar');
      expect(ACLAuditorInstance?.getState()[ACLAuditorStateKey.DATABASE_OPERATION]).toEqual(1);
    });
  });

  describe('update', () => {
    it('should increment 1 in ACLAuditor', async () => {
      const { ACLAuditorInstance, client } = getMockedObjects();
      await client.update('foo', 'bar', {});
      expect(ACLAuditorInstance?.getState()[ACLAuditorStateKey.DATABASE_OPERATION]).toEqual(1);
    });
  });

  describe('bulkUpdate', () => {
    it('should increment objects.length in ACLAuditor', async () => {
      const { ACLAuditorInstance, client } = getMockedObjects();
      await client.bulkUpdate([
        {
          type: 'foo',
          id: 'foo',
          attributes: {},
        },
        {
          type: 'bar',
          id: 'bar',
          attributes: {},
        },
      ]);
      expect(ACLAuditorInstance?.getState()[ACLAuditorStateKey.DATABASE_OPERATION]).toEqual(2);
    });
  });

  describe('deleteByWorkspace', () => {
    it('should increment 1 in ACLAuditor', async () => {
      const { ACLAuditorInstance, client } = getMockedObjects();
      await client.deleteByWorkspace('foo');
      expect(ACLAuditorInstance?.getState()[ACLAuditorStateKey.DATABASE_OPERATION]).toEqual(1);
    });
  });

  describe('addToWorkspaces', () => {
    it('should increment 1 in ACLAuditor', async () => {
      const { ACLAuditorInstance, client } = getMockedObjects();
      await client.addToWorkspaces('foo', 'bar', ['foo']);
      expect(ACLAuditorInstance?.getState()[ACLAuditorStateKey.DATABASE_OPERATION]).toEqual(1);
    });
  });

  describe('deleteFromWorkspaces', () => {
    it('should increment 1 in ACLAuditor', async () => {
      const { ACLAuditorInstance, client } = getMockedObjects();
      await client.deleteFromWorkspaces('foo', 'bar', ['foo']);
      expect(ACLAuditorInstance?.getState()[ACLAuditorStateKey.DATABASE_OPERATION]).toEqual(1);
    });
  });
});
