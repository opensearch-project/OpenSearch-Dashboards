/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as utils from '../../../../core/server/utils';
import { coreMock, httpServerMock, savedObjectsClientMock } from '../../../../core/server/mocks';
import { DATA_SOURCE_SAVED_OBJECT_TYPE, ManageableBy } from '../../common';
import { DataSourcePermissionClientWrapper } from './data_source_premission_client_wrapper';

jest.mock('../../../../core/server/utils');

describe('DataSourcePermissionClientWrapper', () => {
  const requestHandlerContext = coreMock.createRequestHandlerContext();
  const requestMock = httpServerMock.createOpenSearchDashboardsRequest();

  const attributes = {
    title: 'data-source',
    description: 'jest testing',
    endpoint: 'https://test.com',
    auth: { type: 'no_auth' },
    workspaces: ['workspace-1'],
  };

  const dataSource = {
    type: DATA_SOURCE_SAVED_OBJECT_TYPE,
    attributes,
  };
  const dashboard = {
    type: 'dashboard',
    attributes: {},
  };

  const errorMessage = 'You have no permission to perform this operation';

  describe('Data source is managed by dashboard admin', () => {
    describe('user is not dashboard admin', () => {
      jest.spyOn(utils, 'getWorkspaceState').mockReturnValue({ isDashboardAdmin: false });
      const mockedClient = savedObjectsClientMock.create();
      const wrapperInstance = new DataSourcePermissionClientWrapper(ManageableBy.DashboardAdmin);
      const wrapperClient = wrapperInstance.wrapperFactory({
        client: mockedClient,
        typeRegistry: requestHandlerContext.savedObjects.typeRegistry,
        request: requestMock,
      });

      it('should not create data source when user is not dashboard admin', async () => {
        let errorCatched;
        try {
          await wrapperClient.create(DATA_SOURCE_SAVED_OBJECT_TYPE, attributes, {});
        } catch (e) {
          errorCatched = e;
        }
        expect(errorCatched.message).toEqual(errorMessage);
      });

      it('should not bulk create data source when user is not admin', async () => {
        const mockCreateObjects = [dataSource, dashboard];
        const result = await wrapperClient.bulkCreate(mockCreateObjects);
        expect(result.saved_objects[0].error?.message).toEqual(errorMessage);
      });

      it('should not update data source when user is not admin', async () => {
        let errorCatched;
        try {
          await wrapperClient.update(DATA_SOURCE_SAVED_OBJECT_TYPE, 'data-source-id', {});
        } catch (e) {
          errorCatched = e;
        }
        expect(errorCatched.message).toEqual(errorMessage);
      });

      it('should not bulk update data source when user is not admin', async () => {
        const mockCreateObjects = [
          { ...dataSource, id: 'data-source-id' },
          { ...dashboard, id: 'dashboard-id' },
        ];
        const result = await wrapperClient.bulkUpdate(mockCreateObjects);
        expect(result.saved_objects[0].error?.message).toEqual(errorMessage);
      });

      it('should not delete data source when user is not admin', async () => {
        let errorCatched;
        try {
          await wrapperClient.delete(DATA_SOURCE_SAVED_OBJECT_TYPE, 'data-source-id');
        } catch (e) {
          errorCatched = e;
        }
        expect(errorCatched.message).toEqual(errorMessage);
      });
    });
    describe('user is osd admin', () => {
      jest.spyOn(utils, 'getWorkspaceState').mockReturnValue({ isDashboardAdmin: true });
      const mockedClient = savedObjectsClientMock.create();
      const wrapperInstance = new DataSourcePermissionClientWrapper(ManageableBy.DashboardAdmin);
      const wrapperClient = wrapperInstance.wrapperFactory({
        client: mockedClient,
        typeRegistry: requestHandlerContext.savedObjects.typeRegistry,
        request: requestMock,
      });

      it('should create data source when user is admin', async () => {
        jest.spyOn(utils, 'getWorkspaceState').mockReturnValue({ isDashboardAdmin: true });
        await wrapperClient.create(DATA_SOURCE_SAVED_OBJECT_TYPE, attributes, {});
        expect(mockedClient.create).toBeCalledWith(DATA_SOURCE_SAVED_OBJECT_TYPE, attributes, {});
      });

      it('should bulk create data source when user is admin', async () => {
        jest.spyOn(utils, 'getWorkspaceState').mockReturnValue({ isDashboardAdmin: true });
        const mockCreateObjects = [dataSource];
        await wrapperClient.bulkCreate(mockCreateObjects, { overwrite: true });
        expect(mockedClient.bulkCreate).toBeCalledWith(mockCreateObjects, { overwrite: true });
      });

      it('should update data source when user is admin', async () => {
        jest.spyOn(utils, 'getWorkspaceState').mockReturnValue({ isDashboardAdmin: true });
        await wrapperClient.update(DATA_SOURCE_SAVED_OBJECT_TYPE, 'data-source-id', {});
        expect(mockedClient.update).toBeCalledWith(
          DATA_SOURCE_SAVED_OBJECT_TYPE,
          'data-source-id',
          {}
        );
      });

      it('should bulk update data source when user is admin', async () => {
        jest.spyOn(utils, 'getWorkspaceState').mockReturnValue({ isDashboardAdmin: true });
        const mockUpdateObjects = [
          {
            ...dataSource,
            id: 'data-source-id',
          },
        ];
        await wrapperClient.bulkUpdate(mockUpdateObjects, {});
        expect(mockedClient.bulkUpdate).toBeCalledWith(mockUpdateObjects, {});
      });

      it('should delete data source', async () => {
        jest.spyOn(utils, 'getWorkspaceState').mockReturnValue({ isDashboardAdmin: true });
        await wrapperClient.delete(DATA_SOURCE_SAVED_OBJECT_TYPE, 'data-source-id');
        expect(mockedClient.delete).toBeCalledWith(DATA_SOURCE_SAVED_OBJECT_TYPE, 'data-source-id');
      });
    });
    describe('any user is osd admin when osd admin is not configured', () => {
      jest.spyOn(utils, 'getWorkspaceState').mockReturnValue({});
      const mockedClient = savedObjectsClientMock.create();
      const wrapperInstance = new DataSourcePermissionClientWrapper(ManageableBy.DashboardAdmin);
      const wrapperClient = wrapperInstance.wrapperFactory({
        client: mockedClient,
        typeRegistry: requestHandlerContext.savedObjects.typeRegistry,
        request: requestMock,
      });

      it('should create data source when user is admin', async () => {
        jest.spyOn(utils, 'getWorkspaceState').mockReturnValue({ isDashboardAdmin: true });
        await wrapperClient.create(DATA_SOURCE_SAVED_OBJECT_TYPE, attributes, {});
        expect(mockedClient.create).toBeCalledWith(DATA_SOURCE_SAVED_OBJECT_TYPE, attributes, {});
      });

      it('should bulk create data source when user is admin', async () => {
        jest.spyOn(utils, 'getWorkspaceState').mockReturnValue({ isDashboardAdmin: true });
        const mockCreateObjects = [dataSource];
        await wrapperClient.bulkCreate(mockCreateObjects, { overwrite: true });
        expect(mockedClient.bulkCreate).toBeCalledWith(mockCreateObjects, { overwrite: true });
      });

      it('should update data source when user is admin', async () => {
        jest.spyOn(utils, 'getWorkspaceState').mockReturnValue({ isDashboardAdmin: true });
        await wrapperClient.update(DATA_SOURCE_SAVED_OBJECT_TYPE, 'data-source-id', {});
        expect(mockedClient.update).toBeCalledWith(
          DATA_SOURCE_SAVED_OBJECT_TYPE,
          'data-source-id',
          {}
        );
      });

      it('should bulk update data source when user is admin', async () => {
        jest.spyOn(utils, 'getWorkspaceState').mockReturnValue({ isDashboardAdmin: true });
        const mockUpdateObjects = [
          {
            ...dataSource,
            id: 'data-source-id',
          },
        ];
        await wrapperClient.bulkUpdate(mockUpdateObjects, {});
        expect(mockedClient.bulkUpdate).toBeCalledWith(mockUpdateObjects, {});
      });

      it('should delete data source', async () => {
        jest.spyOn(utils, 'getWorkspaceState').mockReturnValue({ isDashboardAdmin: true });
        await wrapperClient.delete(DATA_SOURCE_SAVED_OBJECT_TYPE, 'data-source-id');
        expect(mockedClient.delete).toBeCalledWith(DATA_SOURCE_SAVED_OBJECT_TYPE, 'data-source-id');
      });
    });
  });

  describe('If data source is managed by none', () => {
    const mockedClient = {
      get: jest.fn().mockImplementation(async (type, id) => {
        return {
          id,
          type: DATA_SOURCE_SAVED_OBJECT_TYPE,
          attributes,
        };
      }),
      create: jest.fn(),
      bulkCreate: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
      bulkUpdate: jest.fn(),
    };
    const wrapperInstance = new DataSourcePermissionClientWrapper(ManageableBy.None);
    const wrapperClient = wrapperInstance.wrapperFactory({
      client: mockedClient,
      typeRegistry: requestHandlerContext.savedObjects.typeRegistry,
      request: requestMock,
    });

    it('should not create data source', async () => {
      let errorCatched;
      try {
        await wrapperClient.create(DATA_SOURCE_SAVED_OBJECT_TYPE, attributes, {});
      } catch (e) {
        errorCatched = e;
      }
      expect(errorCatched.message).toEqual(errorMessage);

      await wrapperClient.create('dashboard', {}, {});
      expect(mockedClient.create).toBeCalledWith('dashboard', {}, {});
    });

    it('should not bulk create data source', async () => {
      const mockCreateObjects = [dataSource, dashboard];
      const result = await wrapperClient.bulkCreate(mockCreateObjects);
      expect(result.saved_objects[0].error?.message).toEqual(errorMessage);
    });

    it('should not update data source', async () => {
      let errorCatched;
      try {
        await wrapperClient.update(DATA_SOURCE_SAVED_OBJECT_TYPE, 'data-source-id', {});
      } catch (e) {
        errorCatched = e;
      }
      expect(errorCatched.message).toEqual(errorMessage);

      await wrapperClient.update('dashboard', 'dashboard-id', {});
      expect(mockedClient.update).toBeCalledWith('dashboard', 'dashboard-id', {}, {});
    });

    it('should not bulk update data source', async () => {
      const mockCreateObjects = [
        { ...dataSource, id: 'data-source-id' },
        { ...dashboard, id: 'dashboard-id' },
      ];
      const result = await wrapperClient.bulkUpdate(mockCreateObjects);
      expect(result.saved_objects[0].error?.message).toEqual(errorMessage);
    });

    it('should not delete data source', async () => {
      let errorCatched;
      try {
        await wrapperClient.delete(DATA_SOURCE_SAVED_OBJECT_TYPE, 'data-source-id');
      } catch (e) {
        errorCatched = e;
      }
      expect(errorCatched.message).toEqual(errorMessage);

      await wrapperClient.delete('dashboard', 'dashboard-id');
      expect(mockedClient.delete).toBeCalledWith('dashboard', 'dashboard-id', {});
    });

    describe('assign workspaces to data source', () => {
      it('should update data source when options have workspaces', async () => {
        await wrapperClient.update(DATA_SOURCE_SAVED_OBJECT_TYPE, 'data-source-id', attributes, {
          workspaces: ['workspace-1'],
        });
        expect(mockedClient.update).toBeCalledWith(
          DATA_SOURCE_SAVED_OBJECT_TYPE,
          'data-source-id',
          attributes,
          { workspaces: ['workspace-1'] }
        );
      });

      it('should not update data source when attributes have changed', async () => {
        let errorCatched;
        try {
          await wrapperClient.update(
            DATA_SOURCE_SAVED_OBJECT_TYPE,
            'data-source-id',
            { title: 'new title' },
            { workspaces: ['workspace-1'] }
          );
        } catch (e) {
          errorCatched = e;
        }
        expect(errorCatched.message).toEqual(errorMessage);
      });
    });
  });

  describe('User is data source admin', () => {
    jest.spyOn(utils, 'getWorkspaceState').mockReturnValue({ isDataSourceAdmin: true });
    const mockedClient = savedObjectsClientMock.create();
    const wrapperInstance = new DataSourcePermissionClientWrapper(ManageableBy.None);
    const wrapperClient = wrapperInstance.wrapperFactory({
      client: mockedClient,
      typeRegistry: requestHandlerContext.savedObjects.typeRegistry,
      request: requestMock,
    });

    it('should create data source', async () => {
      await wrapperClient.create(DATA_SOURCE_SAVED_OBJECT_TYPE, attributes, {});
      expect(mockedClient.create).toBeCalledWith(DATA_SOURCE_SAVED_OBJECT_TYPE, attributes, {});
    });

    it('should bulk create data source', async () => {
      const mockCreateObjects = [dataSource];
      await wrapperClient.bulkCreate(mockCreateObjects, { overwrite: true });
      expect(mockedClient.bulkCreate).toBeCalledWith(mockCreateObjects, { overwrite: true });
    });

    it('should update data source', async () => {
      await wrapperClient.update(DATA_SOURCE_SAVED_OBJECT_TYPE, 'data-source-id', {});
      expect(mockedClient.update).toBeCalledWith(
        DATA_SOURCE_SAVED_OBJECT_TYPE,
        'data-source-id',
        {}
      );
    });

    it('should bulk update data source', async () => {
      const mockUpdateObjects = [
        {
          ...dataSource,
          id: 'data-source-id',
        },
      ];
      await wrapperClient.bulkUpdate(mockUpdateObjects, {});
      expect(mockedClient.bulkUpdate).toBeCalledWith(mockUpdateObjects, {});
    });

    it('should delete data source', async () => {
      await wrapperClient.delete(DATA_SOURCE_SAVED_OBJECT_TYPE, 'data-source-id');
      expect(mockedClient.delete).toBeCalledWith(DATA_SOURCE_SAVED_OBJECT_TYPE, 'data-source-id');
    });
  });
});
