/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { httpServerMock, savedObjectsClientMock, coreMock } from '../../../../core/server/mocks';
import { WorkspaceDataSourceOperationWrapper } from './workspace_data_source_operation_wrapper';
import { DATA_SOURCE_SAVED_OBJECT_TYPE } from '../../../data_source/common';

import * as utils from '../../../../core/server/utils';

jest.mock('../../../../core/server/utils');

describe('WorkspaceDataSourceOperationWrapper', () => {
  const createWrappedClient = () => {
    const clientMock = savedObjectsClientMock.create();
    const requestHandlerContext = coreMock.createRequestHandlerContext();
    const requestMock = httpServerMock.createOpenSearchDashboardsRequest();

    clientMock.create.mockResolvedValue({
      id: 'id',
      type: '',
      attributes: {},
      references: [],
    });

    const wrapper = new WorkspaceDataSourceOperationWrapper();

    return {
      wrappedClient: wrapper.wrapperFactory({
        client: clientMock,
        request: requestMock,
        typeRegistry: requestHandlerContext.savedObjects.typeRegistry,
      }),
      clientMock,
    };
  };

  it('should allow dashboard admin overwrite create data source in a workspace', async () => {
    jest
      .spyOn(utils, 'getWorkspaceState')
      .mockReturnValue({ requestWorkspaceId: 'workspace-id', isDashboardAdmin: true });
    const { wrappedClient } = createWrappedClient();
    const result = await wrappedClient.create(
      DATA_SOURCE_SAVED_OBJECT_TYPE,
      {},
      {
        overwrite: true,
      }
    );
    expect(result).toEqual({
      id: 'id',
      type: '',
      attributes: {},
      references: [],
    });
  });

  it('should not allow non dashboard admin overwrite create data source in workspace', async () => {
    jest
      .spyOn(utils, 'getWorkspaceState')
      .mockReturnValue({ requestWorkspaceId: 'workspace-id', isDashboardAdmin: false });

    const { wrappedClient } = createWrappedClient();

    expect(() =>
      wrappedClient.create(
        DATA_SOURCE_SAVED_OBJECT_TYPE,
        {},
        {
          overwrite: true,
        }
      )
    ).toThrowError();
  });

  it('should not restrict other type objects create', async () => {
    jest
      .spyOn(utils, 'getWorkspaceState')
      .mockReturnValue({ requestWorkspaceId: 'workspace-id', isDashboardAdmin: false });

    const { wrappedClient } = createWrappedClient();

    const result = await wrappedClient.create('index-pattern', {});
    expect(result).toEqual({
      id: 'id',
      type: '',
      attributes: {},
      references: [],
    });
  });

  it('should not allow bulkCreate includes data source type', async () => {
    jest
      .spyOn(utils, 'getWorkspaceState')
      .mockReturnValue({ requestWorkspaceId: 'workspace-id', isDashboardAdmin: true });

    const { wrappedClient } = createWrappedClient();

    expect(() =>
      wrappedClient.bulkCreate([
        {
          type: 'index-pattern',
          attributes: {},
        },
        {
          type: DATA_SOURCE_SAVED_OBJECT_TYPE,
          attributes: {},
        },
      ])
    ).toThrowError();
  });

  it('should not limit bulkCreate when not including data source type', async () => {
    jest
      .spyOn(utils, 'getWorkspaceState')
      .mockReturnValue({ requestWorkspaceId: 'workspace-id', isDashboardAdmin: true });

    const { wrappedClient } = createWrappedClient();

    expect(() =>
      wrappedClient.bulkCreate([
        {
          type: 'index-pattern',
          attributes: {},
        },
        {
          type: 'index-pattern',
          attributes: {},
        },
      ])
    ).not.toThrowError();
  });

  it('should not allow delete includes data source type', async () => {
    jest
      .spyOn(utils, 'getWorkspaceState')
      .mockReturnValue({ requestWorkspaceId: 'workspace-id', isDashboardAdmin: true });

    const { wrappedClient } = createWrappedClient();

    expect(() => wrappedClient.delete(DATA_SOURCE_SAVED_OBJECT_TYPE, '')).toThrowError();
  });

  it('should not limit delete when not including data source type', async () => {
    jest
      .spyOn(utils, 'getWorkspaceState')
      .mockReturnValue({ requestWorkspaceId: 'workspace-id', isDashboardAdmin: true });

    const { wrappedClient } = createWrappedClient();

    expect(() => wrappedClient.delete('index-pattern', '')).not.toThrowError();
  });

  it('should not allow non dashboard admin update data source in workspace', async () => {
    jest
      .spyOn(utils, 'getWorkspaceState')
      .mockReturnValue({ requestWorkspaceId: 'workspace-id', isDashboardAdmin: true });

    const { wrappedClient } = createWrappedClient();

    expect(() => wrappedClient.update(DATA_SOURCE_SAVED_OBJECT_TYPE, '', {})).toThrowError();
  });

  it('should allow dashboard admin update data source in workspace', async () => {
    jest
      .spyOn(utils, 'getWorkspaceState')
      .mockReturnValue({ requestWorkspaceId: 'workspace-id', isDashboardAdmin: true });

    const { wrappedClient } = createWrappedClient();

    expect(() =>
      wrappedClient.update(DATA_SOURCE_SAVED_OBJECT_TYPE, '', {}, { workspaces: ['id1'] })
    ).not.toThrowError();
  });

  it('should not limit user update other type objects in workspace', async () => {
    jest
      .spyOn(utils, 'getWorkspaceState')
      .mockReturnValue({ requestWorkspaceId: 'workspace-id', isDashboardAdmin: false });

    const { wrappedClient } = createWrappedClient();

    expect(() =>
      wrappedClient.update('index-pattern', '', {
        workspaces: ['id1'],
      })
    ).not.toThrowError();
  });

  it('should not allow non dashboard admin bulkUpdate data source in workspace', async () => {
    jest
      .spyOn(utils, 'getWorkspaceState')
      .mockReturnValue({ requestWorkspaceId: 'workspace-id', isDashboardAdmin: true });

    const { wrappedClient } = createWrappedClient();

    expect(() =>
      wrappedClient.bulkUpdate(
        [
          {
            type: 'index-pattern',
            attributes: {},
            id: '',
          },
          {
            type: DATA_SOURCE_SAVED_OBJECT_TYPE,
            attributes: {},
            id: '',
          },
        ],
        {}
      )
    ).toThrowError();
  });

  it('should not limit user bulkUpdate other type objects in workspace', async () => {
    jest
      .spyOn(utils, 'getWorkspaceState')
      .mockReturnValue({ requestWorkspaceId: 'workspace-id', isDashboardAdmin: true });

    const { wrappedClient } = createWrappedClient();

    expect(() =>
      wrappedClient.bulkUpdate(
        [
          {
            type: 'index-pattern',
            attributes: {},
            id: '',
          },
          {
            type: 'index-pattern',
            attributes: {},
            id: '',
          },
        ],
        {}
      )
    ).not.toThrowError();
  });
});
