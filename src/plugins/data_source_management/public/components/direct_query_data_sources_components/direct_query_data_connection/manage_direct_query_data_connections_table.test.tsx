/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act } from 'react-dom/test-utils';
import * as utils from '../../utils';
import { mount, ReactWrapper } from 'enzyme';
import { RouteComponentProps } from 'react-router-dom';
import { wrapWithIntl } from 'test_utils/enzyme_helpers';
import { SavedObjectsClientContract, ScopedHistory } from 'opensearch-dashboards/public';
import { scopedHistoryMock } from '../../../../../../core/public/mocks';
import { OpenSearchDashboardsContextProvider } from '../../../../../opensearch_dashboards_react/public';
import { getMappedDataSources, mockManagementPlugin } from '../../../mocks';
import { ManageDirectQueryDataConnectionsTable } from './manage_direct_query_data_connections_table';
import { BehaviorSubject } from 'rxjs';
import { DataSourceTableItem } from '../../../types';
import {
  DATA_CONNECTION_SAVED_OBJECT_TYPE,
  DataConnectionType,
} from '../../../../../data_source/common';
import { waitFor } from '@testing-library/dom';

const deleteButtonIdentifier = '[data-test-subj="deleteDataSourceConnections"]';
const tableIdentifier = 'EuiInMemoryTable';
const confirmModalIdentifier = 'EuiConfirmModal';

describe('ManageDirectQueryDataConnectionsTable', () => {
  const mockedContext = {
    ...mockManagementPlugin.createDataSourceManagementContext(),
    application: { capabilities: { dataSource: { canManage: true } } },
  };
  const uiSettings = mockedContext.uiSettings;
  let component: ReactWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;
  const history = (scopedHistoryMock.create() as unknown) as ScopedHistory;
  describe('should get direct query connections failed', () => {
    beforeEach(async () => {
      spyOn(utils, 'getDataSources').and.returnValue(Promise.reject());
      await act(async () => {
        component = await mount(
          wrapWithIntl(
            <ManageDirectQueryDataConnectionsTable
              featureFlagStatus={true}
              history={history}
              location={({} as unknown) as RouteComponentProps['location']}
              match={({} as unknown) as RouteComponentProps['match']}
            />
          ),
          {
            wrappingComponent: OpenSearchDashboardsContextProvider,
            wrappingComponentProps: {
              services: mockedContext,
            },
          }
        );
      });
      component.update();
    });
    test('should render empty table', () => {
      expect(component).toMatchSnapshot();
    });
  });

  describe('should get direct query connections successful', () => {
    beforeEach(async () => {
      spyOn(utils, 'getDataSources').and.returnValue(Promise.resolve(getMappedDataSources));
      spyOn(utils, 'fetchDataSourceConnections').and.returnValue(
        Promise.resolve(getMappedDataSources)
      );
      spyOn(utils, 'getHideLocalCluster').and.returnValue(false);
      spyOn(uiSettings, 'get$').and.returnValue(new BehaviorSubject('test1'));
      await act(async () => {
        component = await mount(
          wrapWithIntl(
            <ManageDirectQueryDataConnectionsTable
              featureFlagStatus={true}
              history={history}
              location={({} as unknown) as RouteComponentProps['location']}
              match={({} as unknown) as RouteComponentProps['match']}
            />
          ),
          {
            wrappingComponent: OpenSearchDashboardsContextProvider,
            wrappingComponentProps: {
              services: mockedContext,
            },
          }
        );
      });
      component.update();
    });

    it('should render normally', () => {
      expect(component).toMatchSnapshot();
      expect(utils.getDataSources).toHaveBeenCalled();
    });

    it('should show delete button when select datasources', () => {
      expect(component.find(deleteButtonIdentifier).exists()).toBe(false);

      act(() => {
        // @ts-ignore
        component.find(tableIdentifier).props().selection.onSelectionChange(getMappedDataSources);
      });
      component.update();
      expect(component.find(deleteButtonIdentifier).exists()).toBe(true);
    });

    it('should delete confirm modal pop up and cancel button work normally', () => {
      act(() => {
        // @ts-ignore
        component.find(tableIdentifier).props().selection.onSelectionChange(getMappedDataSources);
      });
      component.update();
      component.find(deleteButtonIdentifier).first().simulate('click');
      // test if modal pop up when click the delete button
      expect(component.find(confirmModalIdentifier).exists()).toBe(true);

      act(() => {
        // @ts-ignore
        component.find(confirmModalIdentifier).first().props().onCancel();
      });
      component.update();
      expect(component.find(confirmModalIdentifier).exists()).toBe(false);
    });

    it('should delete confirm modal confirm button work normally', async () => {
      spyOn(utils, 'deleteMultipleDataSources').and.returnValue(Promise.resolve({}));
      spyOn(utils, 'setFirstDataSourceAsDefault').and.returnValue({});
      act(() => {
        // @ts-ignore
        component.find(tableIdentifier).props().selection.onSelectionChange(getMappedDataSources);
      });
      component.update();
      component.find(deleteButtonIdentifier).first().simulate('click');
      expect(component.find(confirmModalIdentifier).exists()).toBe(true);

      await act(async () => {
        // @ts-ignore
        await component.find(confirmModalIdentifier).first().props().onConfirm();
      });
      component.update();
      expect(component.find(confirmModalIdentifier).exists()).toBe(false);
      expect(utils.setFirstDataSourceAsDefault).toHaveBeenCalled();
    });

    it('should delete datasources & fail', async () => {
      spyOn(utils, 'deleteMultipleDataSources').and.returnValue(Promise.reject({}));
      spyOn(utils, 'setFirstDataSourceAsDefault').and.returnValue({});
      act(() => {
        // @ts-ignore
        component.find(tableIdentifier).props().selection.onSelectionChange(getMappedDataSources);
      });

      component.update();
      component.find(deleteButtonIdentifier).first().simulate('click');
      expect(component.find(confirmModalIdentifier).exists()).toBe(true);

      await act(async () => {
        // @ts-ignore
        await component.find(confirmModalIdentifier).props().onConfirm();
      });
      component.update();
      expect(utils.deleteMultipleDataSources).toHaveBeenCalled();
      expect(utils.setFirstDataSourceAsDefault).not.toHaveBeenCalled();
      // @ts-ignore
      expect(component.find(confirmModalIdentifier).exists()).toBe(false);
    });
  });

  describe('fetch security lake and cloudwatch direct query connections', () => {
    beforeEach(async () => {
      spyOn(utils, 'getDataConnections').and.returnValue(
        Promise.resolve([
          {
            type: 'data-connection',
            id: 'connection1',
            attributes: {
              connectionId: 'Connection 1',
              type: DataConnectionType.CloudWatch,
            },
          },
          {
            type: 'data-connection',
            id: 'connection2',
            attributes: {
              connectionId: 'Connection 2',
              type: DataConnectionType.SecurityLake,
            },
          },
        ])
      );

      await act(async () => {
        component = mount(
          wrapWithIntl(
            <ManageDirectQueryDataConnectionsTable
              featureFlagStatus={true}
              history={history}
              location={({} as unknown) as RouteComponentProps['location']}
              match={({} as unknown) as RouteComponentProps['match']}
            />
          ),
          {
            wrappingComponent: OpenSearchDashboardsContextProvider,
            wrappingComponentProps: {
              services: mockedContext,
            },
          }
        );
      });
      component.update();
    });

    it('should get security lake and cloudwatch correctly correctly', async () => {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
      component.update();
      const tableRows = component.find('EuiInMemoryTable').prop('items');
      expect(tableRows).toContainEqual(
        expect.objectContaining({
          id: 'connection1',
          title: 'Connection 1',
          type: DataConnectionType.CloudWatch,
        })
      );
      expect(tableRows).toContainEqual(
        expect.objectContaining({
          id: 'connection2',
          title: 'Connection 2',
          type: DataConnectionType.SecurityLake,
        })
      );
    });

    it('should render normally', () => {
      expect(component).toMatchSnapshot();
      expect(utils.getDataConnections).toHaveBeenCalled();
    });

    it('should handle errors correctly', async () => {
      jest
        .spyOn(utils, 'getDataConnections')
        .mockImplementation(() => Promise.reject(new Error('Failed to fetch connections')));

      await act(async () => {
        component = mount(
          wrapWithIntl(
            <ManageDirectQueryDataConnectionsTable
              featureFlagStatus={true}
              history={history}
              location={({} as unknown) as RouteComponentProps['location']}
              match={({} as unknown) as RouteComponentProps['match']}
            />
          ),
          {
            wrappingComponent: OpenSearchDashboardsContextProvider,
            wrappingComponentProps: {
              services: mockedContext,
            },
          }
        );
      });
      component.update();

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
      component.update();

      const tableRows = component.find('EuiInMemoryTable').prop('items');
      expect(tableRows).toEqual(
        expect.not.arrayContaining([
          expect.objectContaining({ objectType: DATA_CONNECTION_SAVED_OBJECT_TYPE }),
        ])
      );
    });
    test('should render empty table', () => {
      expect(component).toMatchSnapshot();
    });
  });

  describe('data source association', () => {
    const mockDissociate = jest.fn();

    beforeEach(async () => {
      const mockedDataConnections = [
        {
          type: 'data-connection',
          id: 'data-connection-id',
          attributes: {
            connectionId: 'cloudWatch',
            type: 'AWS CloudWatch',
          },
        },
      ];
      spyOn(utils, 'getDataSources').and.returnValue(Promise.resolve(getMappedDataSources));
      spyOn(utils, 'fetchDataSourceConnections').and.returnValue(
        Promise.resolve(getMappedDataSources)
      );
      spyOn(utils, 'getDataConnections').and.returnValue(Promise.resolve(mockedDataConnections));
      spyOn(utils, 'getHideLocalCluster').and.returnValue(false);
      spyOn(uiSettings, 'get$').and.returnValue(new BehaviorSubject('test1'));
      const context = {
        ...mockedContext,
        application: {
          ...mockedContext.application,
          capabilities: {
            ...mockedContext.application.capabilities,
            dashboards: {
              ...mockedContext.application.capabilities.dashboards,
              isDashboardAdmin: true,
            },
          },
        },
        workspaces: {
          ...mockedContext.workspaces,
          client$: new BehaviorSubject({
            ui: () => ({
              DataSourceAssociation: undefined,
            }),
            dissociate: mockDissociate,
          }),
          currentWorkspace$: new BehaviorSubject({
            id: 'workspace_id',
            readonly: false,
          }),
        },
        overlays: {
          ...mockedContext.overlays,
          openConfirm: jest.fn().mockResolvedValue(true),
        },
      };
      await act(async () => {
        component = await mount(
          wrapWithIntl(
            <ManageDirectQueryDataConnectionsTable
              featureFlagStatus={true}
              history={history}
              location={({} as unknown) as RouteComponentProps['location']}
              match={({} as unknown) as RouteComponentProps['match']}
            />
          ),
          {
            wrappingComponent: OpenSearchDashboardsContextProvider,
            wrappingComponentProps: {
              services: context,
            },
          }
        );
      });
      component.update();
    });
    test('should be able to pass data-connection type to dissociate data connection object', async () => {
      const cloudWatchRow = component
        .find('tr')
        .filterWhere((tr) => tr.text().includes('cloudWatch'));
      cloudWatchRow
        .find('button[data-test-subj="dataSourcesManagement-dataSourceTable-dissociateButton"]')
        .simulate('click');
      component.update();
      await waitFor(() => {
        expect(mockDissociate).toHaveBeenCalledWith(
          [{ id: 'data-connection-id', type: 'data-connection' }],
          'workspace_id'
        );
      });
    });
  });
});

describe('FetchDirectQueryConnections', () => {
  let fetchDirectQueryConnections: () => Promise<DataSourceTableItem[]>;
  let mockSavedObjectsClient: jest.Mocked<SavedObjectsClientContract>;
  beforeEach(() => {
    jest.resetAllMocks();
    (utils.getDataConnections as jest.Mock) = jest.fn();

    fetchDirectQueryConnections = async (): Promise<DataSourceTableItem[]> => {
      try {
        const dataConnectionSavedObjects = await utils.getDataConnections(mockSavedObjectsClient);
        return dataConnectionSavedObjects.map((obj) => ({
          id: obj.id,
          title: obj.attributes.connectionId,
          type: obj.attributes.type,
          objectType: 'data-connection',
        }));
      } catch (error) {
        return [];
      }
    };
  });

  it('should return mapped data connections when successful', async () => {
    const mockSavedObjects = [
      {
        id: 'connection1',
        attributes: { connectionId: 'Connection 1', type: DataConnectionType.CloudWatch },
      },
      {
        id: 'connection2',
        attributes: { connectionId: 'Connection 2', type: DataConnectionType.SecurityLake },
      },
    ];

    mockSavedObjectsClient = ({
      find: jest.fn().mockResolvedValue({ savedObjects: mockSavedObjects }),
    } as unknown) as jest.Mocked<SavedObjectsClientContract>;

    (utils.getDataConnections as jest.Mock).mockResolvedValue(mockSavedObjects);

    const result = await fetchDirectQueryConnections();

    expect(utils.getDataConnections).toHaveBeenCalledWith(mockSavedObjectsClient);
    expect(result).toEqual([
      {
        id: 'connection1',
        title: 'Connection 1',
        type: DataConnectionType.CloudWatch,
        objectType: 'data-connection',
      },
      {
        id: 'connection2',
        title: 'Connection 2',
        type: DataConnectionType.SecurityLake,
        objectType: 'data-connection',
      },
    ]);
  });

  it('should return an empty array when there is an error', async () => {
    mockSavedObjectsClient = ({
      find: jest.fn().mockRejectedValue(new Error('Failed to fetch data connections')),
    } as unknown) as jest.Mocked<SavedObjectsClientContract>;

    (utils.getDataConnections as jest.Mock).mockRejectedValue(
      new Error('Failed to fetch data connections')
    );

    const result = await fetchDirectQueryConnections();

    expect(utils.getDataConnections).toHaveBeenCalledWith(mockSavedObjectsClient);
    expect(result).toEqual([]);
  });
});

describe('GetDataConnections', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (utils.getDataConnections as jest.Mock) = jest.fn();
  });

  it('should fetch data connections correctly', async () => {
    const mockSavedObjects = [
      {
        id: 'connection1',
        attributes: {
          connectionId: 'Connection 1',
          type: DataConnectionType.CloudWatch,
        },
      },
      {
        id: 'connection2',
        attributes: {
          connectionId: 'Connection 2',
          type: DataConnectionType.SecurityLake,
        },
      },
    ];

    const mockSavedObjectsClient = ({
      find: jest.fn().mockResolvedValue({
        savedObjects: mockSavedObjects,
      }),
    } as unknown) as SavedObjectsClientContract;

    (utils.getDataConnections as jest.Mock).mockResolvedValue(mockSavedObjects);

    const result = await utils.getDataConnections(mockSavedObjectsClient);

    expect(utils.getDataConnections).toHaveBeenCalledWith(mockSavedObjectsClient);
    expect(result).toEqual(mockSavedObjects);
  });

  it('should handle errors when fetching data connections', async () => {
    const mockSavedObjectsClient = ({
      find: jest.fn().mockRejectedValue(new Error('Failed to fetch data connections')),
    } as unknown) as SavedObjectsClientContract;

    (utils.getDataConnections as jest.Mock).mockRejectedValue(
      new Error('Failed to fetch data connections')
    );

    await expect(utils.getDataConnections(mockSavedObjectsClient)).rejects.toThrow(
      'Failed to fetch data connections'
    );
  });
});
