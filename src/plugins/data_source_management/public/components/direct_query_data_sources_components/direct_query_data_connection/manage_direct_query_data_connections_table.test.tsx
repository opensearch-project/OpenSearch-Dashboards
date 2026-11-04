/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act } from 'react';
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
import { DirectQueryConnectionFlowRegistry } from '../../../direct_query_connection_flow_registry';

const deleteButtonIdentifier = '[data-test-subj="deleteDataSourceConnections"]';
const tableIdentifier = 'EuiInMemoryTable';
const confirmModalIdentifier = 'EuiConfirmModal';

const mockedContext = {
  ...mockManagementPlugin.createDataSourceManagementContext(),
  application: { capabilities: { dataSource: { canManage: true } } },
};
let component: ReactWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;
const history = scopedHistoryMock.create() as unknown as ScopedHistory;

describe('ManageDirectQueryDataConnectionsTable', () => {
  describe('should get direct query connections failed', () => {
    beforeEach(async () => {
      jest.spyOn(utils, 'getDataSources').mockReturnValue(Promise.reject());
      await act(async () => {
        component = await mount(
          wrapWithIntl(
            <ManageDirectQueryDataConnectionsTable
              featureFlagStatus={true}
              history={history}
              location={{} as unknown as RouteComponentProps['location']}
              match={{} as unknown as RouteComponentProps['match']}
            />
          ),
          {
            // @ts-expect-error TS2769 TODO(ts-error): fixme
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
      jest.spyOn(utils, 'getDataSources').mockReturnValue(Promise.resolve(getMappedDataSources));
      jest
        .spyOn(utils, 'fetchDataSourceConnections')
        .mockReturnValue(Promise.resolve(getMappedDataSources));
      jest.spyOn(utils, 'getHideLocalCluster').mockReturnValue(false);
      await act(async () => {
        component = await mount(
          wrapWithIntl(
            <ManageDirectQueryDataConnectionsTable
              featureFlagStatus={true}
              history={history}
              location={{} as unknown as RouteComponentProps['location']}
              match={{} as unknown as RouteComponentProps['match']}
            />
          ),
          {
            // @ts-expect-error TS2769 TODO(ts-error): fixme
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
      jest.spyOn(utils, 'deleteMultipleDataSources').mockReturnValue(Promise.resolve({}));
      jest.spyOn(utils, 'setFirstDataSourceAsDefault').mockReturnValue({});
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
    });

    it('should delete datasources & fail', async () => {
      jest.spyOn(utils, 'deleteMultipleDataSources').mockReturnValue(Promise.reject({}));
      jest.spyOn(utils, 'setFirstDataSourceAsDefault').mockReturnValue({});
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
      // @ts-ignore
      expect(component.find(confirmModalIdentifier).exists()).toBe(false);
    });
  });

  describe('fetch security lake, cloudwatch, and AWS Prometheus direct query connections', () => {
    beforeEach(async () => {
      jest.spyOn(utils, 'getDataConnections').mockReturnValue(
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
          {
            type: 'data-connection',
            id: 'connection3',
            attributes: {
              connectionId: 'Connection 3',
              type: DataConnectionType.AWSPrometheus,
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
              location={{} as unknown as RouteComponentProps['location']}
              match={{} as unknown as RouteComponentProps['match']}
            />
          ),
          {
            // @ts-expect-error TS2769 TODO(ts-error): fixme
            wrappingComponent: OpenSearchDashboardsContextProvider,
            wrappingComponentProps: {
              services: mockedContext,
            },
          }
        );
      });
      component.update();
    });

    it('should get security lake, cloudwatch, and AWS Prometheus correctly', async () => {
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
      expect(tableRows).toContainEqual(
        expect.objectContaining({
          id: 'connection3',
          title: 'Connection 3',
          type: DataConnectionType.AWSPrometheus,
        })
      );
    });

    it('should render AWSPrometheus connection as plain text without a link', async () => {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
      component.update();
      const awsPromRow = component
        .find('tr')
        .filterWhere((tr) => tr.text().includes('Connection 3'));
      // Should render as a span (plain text), not as an EuiButtonEmpty link
      expect(awsPromRow.find('EuiButtonEmpty').exists()).toBe(false);
      expect(awsPromRow.find('span').someWhere((n) => n.text().includes('Connection 3'))).toBe(
        true
      );
    });

    it('should render normally', () => {
      expect(component).toMatchSnapshot();
      expect(utils.getDataConnections).toHaveBeenCalled();
    });

    const describedConnections = [
      {
        type: 'data-connection',
        id: 'described',
        attributes: {
          connectionId: 'Described',
          type: 'example-direct-query' as DataConnectionType,
          description: 'My example connection',
        },
      },
      {
        type: 'data-connection',
        id: 'undescribed',
        attributes: {
          connectionId: 'Undescribed',
          type: 'example-direct-query' as DataConnectionType,
        },
      },
    ];

    const mountWithServices = async (services: any) => {
      await act(async () => {
        component = mount(
          wrapWithIntl(
            <ManageDirectQueryDataConnectionsTable
              featureFlagStatus={true}
              // Its own history, so these cases don't leak calls into the shared mock's snapshots.
              history={scopedHistoryMock.create() as unknown as ScopedHistory}
              location={{} as unknown as RouteComponentProps['location']}
              match={{} as unknown as RouteComponentProps['match']}
            />
          ),
          {
            // @ts-expect-error TS2769 TODO(ts-error): fixme
            wrappingComponent: OpenSearchDashboardsContextProvider,
            wrappingComponentProps: { services },
          }
        );
      });
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
      component.update();
    };

    const dataConnectionRows = (): any[] =>
      (component.find('EuiInMemoryTable').prop('items') as any[]).filter(
        (row) => row.objectType === 'data-connection'
      );

    it('should include the description of data-connection rows when a flow is visible', async () => {
      jest
        .spyOn(utils, 'getDataConnections')
        .mockReturnValue(Promise.resolve(describedConnections as any));
      const registry = new DirectQueryConnectionFlowRegistry();
      registry.registerDirectQueryConnectionFlow({
        id: 'example-flow',
        title: 'Example connection',
        buttonLabel: 'Connect example data source',
        mount: jest.fn(),
      });
      await mountWithServices({ ...mockedContext, directQueryConnectionFlowRegistry: registry });
      const tableRows: any[] = component.find('EuiInMemoryTable').prop('items');
      expect(tableRows.find((row) => row.id === 'described')).toEqual(
        expect.objectContaining({ description: 'My example connection' })
      );
      expect(tableRows.find((row) => row.id === 'undescribed')).not.toHaveProperty('description');
      expect(component.text()).toContain('My example connection');
    });

    it('should not add descriptions to data-connection rows when no flow is visible', async () => {
      jest
        .spyOn(utils, 'getDataConnections')
        .mockReturnValue(Promise.resolve(describedConnections as any));
      await mountWithServices({
        ...mockedContext,
        directQueryConnectionFlowRegistry: new DirectQueryConnectionFlowRegistry(),
      });
      const tableRows: any[] = component.find('EuiInMemoryTable').prop('items');
      expect(tableRows.find((row) => row.id === 'described')).not.toHaveProperty('description');
      expect(component.text()).not.toContain('My example connection');
    });

    it('should not wait for flow visibility to render rows', async () => {
      jest
        .spyOn(utils, 'getDataConnections')
        .mockReturnValue(Promise.resolve(describedConnections as any));
      const registry = new DirectQueryConnectionFlowRegistry();
      registry.registerDirectQueryConnectionFlow({
        id: 'hung-flow',
        title: 'Hung',
        buttonLabel: 'Hung',
        isVisible: () => new Promise<boolean>(() => {}),
        mount: jest.fn(),
        ownsConnection: () => true,
      });
      await mountWithServices({ ...mockedContext, directQueryConnectionFlowRegistry: registry });
      const tableRows = dataConnectionRows();
      expect(tableRows.map((row) => row.id)).toEqual(['described', 'undescribed']);
      tableRows.forEach((row) => expect(row).not.toHaveProperty('directQueryConnectionFlowId'));
    });

    it('should apply a flow that becomes visible after the rows have loaded', async () => {
      jest
        .spyOn(utils, 'getDataConnections')
        .mockReturnValue(Promise.resolve(describedConnections as any));
      let resolveVisible: (visible: boolean) => void = () => {};
      const registry = new DirectQueryConnectionFlowRegistry();
      registry.registerDirectQueryConnectionFlow({
        id: 'late-flow',
        title: 'Late',
        buttonLabel: 'Late',
        isVisible: () =>
          new Promise<boolean>((resolve) => {
            resolveVisible = resolve;
          }),
        mount: jest.fn(),
        ownsConnection: (so) => so.id === 'described',
      });
      (utils.getDataConnections as jest.Mock).mockClear();
      await mountWithServices({ ...mockedContext, directQueryConnectionFlowRegistry: registry });
      let tableRows: any[] = component.find('EuiInMemoryTable').prop('items');
      expect(tableRows.find((row) => row.id === 'described')).not.toHaveProperty(
        'directQueryConnectionFlowId'
      );
      await act(async () => {
        resolveVisible(true);
      });
      component.update();
      tableRows = component.find('EuiInMemoryTable').prop('items');
      expect(tableRows.find((row) => row.id === 'described')).toEqual(
        expect.objectContaining({ directQueryConnectionFlowId: 'late-flow' })
      );
      expect(utils.getDataConnections).toHaveBeenCalledTimes(1);
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
              location={{} as unknown as RouteComponentProps['location']}
              match={{} as unknown as RouteComponentProps['match']}
            />
          ),
          {
            // @ts-expect-error TS2769 TODO(ts-error): fixme
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
      jest.spyOn(utils, 'getDataSources').mockReturnValue(Promise.resolve(getMappedDataSources));
      jest
        .spyOn(utils, 'fetchDataSourceConnections')
        .mockReturnValue(Promise.resolve(getMappedDataSources));
      jest
        .spyOn(utils, 'getDataConnections')
        .mockReturnValue(Promise.resolve(mockedDataConnections));
      jest.spyOn(utils, 'getHideLocalCluster').mockReturnValue(false);

      const context = {
        ...mockedContext,
        application: {
          ...mockedContext.application,
          capabilities: {
            ...mockedContext.application.capabilities,
            dashboards: {
              // @ts-expect-error TS2339 TODO(ts-error): fixme
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
              location={{} as unknown as RouteComponentProps['location']}
              match={{} as unknown as RouteComponentProps['match']}
            />
          ),
          {
            // @ts-expect-error TS2769 TODO(ts-error): fixme
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
      } catch {
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

    mockSavedObjectsClient = {
      find: jest.fn().mockResolvedValue({ savedObjects: mockSavedObjects }),
    } as unknown as jest.Mocked<SavedObjectsClientContract>;

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
    mockSavedObjectsClient = {
      find: jest.fn().mockRejectedValue(new Error('Failed to fetch data connections')),
    } as unknown as jest.Mocked<SavedObjectsClientContract>;

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

    const mockSavedObjectsClient = {
      find: jest.fn().mockResolvedValue({
        savedObjects: mockSavedObjects,
      }),
    } as unknown as SavedObjectsClientContract;

    (utils.getDataConnections as jest.Mock).mockResolvedValue(mockSavedObjects);

    const result = await utils.getDataConnections(mockSavedObjectsClient);

    expect(utils.getDataConnections).toHaveBeenCalledWith(mockSavedObjectsClient);
    expect(result).toEqual(mockSavedObjects);
  });

  it('should handle errors when fetching data connections', async () => {
    const mockSavedObjectsClient = {
      find: jest.fn().mockRejectedValue(new Error('Failed to fetch data connections')),
    } as unknown as SavedObjectsClientContract;

    (utils.getDataConnections as jest.Mock).mockRejectedValue(
      new Error('Failed to fetch data connections')
    );

    await expect(utils.getDataConnections(mockSavedObjectsClient)).rejects.toThrow(
      'Failed to fetch data connections'
    );
  });

  describe('direct query connection flows', () => {
    const flowConnection = {
      type: 'data-connection',
      id: 'flow-1',
      attributes: {
        connectionId: 'Flow-owned connection',
        type: 'example-direct-query' as DataConnectionType,
        ownerPlugin: 'example',
      },
      workspaces: ['ws1', 'unknown-ws'],
    };
    const legacyConnection = {
      type: 'data-connection',
      id: 'legacy-1',
      attributes: {
        connectionId: 'Unowned connection',
        type: 'example-direct-query' as DataConnectionType,
      },
    };

    const mountTable = async (services: any, flowHistory: ScopedHistory) => {
      await act(async () => {
        component = mount(
          wrapWithIntl(
            <ManageDirectQueryDataConnectionsTable
              featureFlagStatus={true}
              history={flowHistory}
              location={{} as unknown as RouteComponentProps['location']}
              match={{} as unknown as RouteComponentProps['match']}
            />
          ),
          {
            // @ts-expect-error TS2769 TODO(ts-error): fixme
            wrappingComponent: OpenSearchDashboardsContextProvider,
            wrappingComponentProps: { services },
          }
        );
      });
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
      component.update();
    };

    const findRow = (text: string) =>
      component.find('tr').filterWhere((tr) => tr.text().includes(text));

    beforeEach(() => {
      jest.spyOn(utils, 'getDataSources').mockReturnValue(Promise.resolve([]));
      jest.spyOn(utils, 'fetchDataSourceConnections').mockReturnValue(Promise.resolve([]));
      jest.spyOn(utils, 'getHideLocalCluster').mockReturnValue({ enabled: false } as any);
      jest
        .spyOn(utils, 'getDataConnections')
        .mockReturnValue(Promise.resolve([flowConnection, legacyConnection] as any));
    });

    it('links owned rows to the flow manage page and adds a Workspaces column', async () => {
      const registry = new DirectQueryConnectionFlowRegistry();
      registry.registerDirectQueryConnectionFlow({
        id: 'example-flow',
        title: 'Example connection',
        buttonLabel: 'Connect example data source',
        mount: jest.fn(),
        ownsConnection: (so) => so.attributes.ownerPlugin === 'example',
      });
      const workspaces = {
        ...mockedContext.workspaces,
        workspaceList$: new BehaviorSubject([{ id: 'ws1', name: 'Workspace One' }]),
      };
      const flowHistory = scopedHistoryMock.create() as unknown as ScopedHistory;
      (flowHistory.createHref as jest.Mock).mockImplementation(
        ({ pathname }: { pathname: string }) => `/app/dataSources${pathname}`
      );

      await mountTable(
        { ...mockedContext, workspaces, directQueryConnectionFlowRegistry: registry },
        flowHistory
      );

      const tableRows = component.find('EuiInMemoryTable').prop('items') as DataSourceTableItem[];
      expect(tableRows).toContainEqual(
        expect.objectContaining({
          id: 'flow-1',
          directQueryConnectionFlowId: 'example-flow',
          workspaces: ['ws1', 'unknown-ws'],
        })
      );
      expect(tableRows.find((row) => row.id === 'legacy-1')?.directQueryConnectionFlowId).toBe(
        undefined
      );

      const link = component.find('a[data-test-subj="directQueryConnectionFlowLink-flow-1"]');
      expect(link.exists()).toBe(true);
      expect(link.prop('href')).toBe('/app/dataSources/flows/example-flow/manage/flow-1');
      link.simulate('click');
      expect(flowHistory.push).toHaveBeenCalledWith({
        pathname: '/flows/example-flow/manage/flow-1',
      });

      // Non-owned rows keep the existing plain-text rendering
      expect(
        findRow('Unowned connection')
          .find('[data-test-subj^="directQueryConnectionFlowLink"]')
          .exists()
      ).toBe(false);

      expect(component.find('th').someWhere((th) => th.text().includes('Workspaces'))).toBe(true);
      expect(findRow('Flow-owned connection').text()).toContain(
        'Workspace One, 1 unavailable workspace'
      );
      expect(findRow('Flow-owned connection').text()).not.toContain('unknown-ws');
      expect(findRow('Unowned connection').text()).toContain('—');
    });

    it.each([
      ['a typeLabel', 'Example data connection', 'Example data connection'],
      ['no typeLabel', undefined, 'example-direct-query' as DataConnectionType],
      ['a blank typeLabel', '  ', 'example-direct-query' as DataConnectionType],
    ])('shows the owning flow %s in the Type column', async (_name, typeLabel, expected) => {
      const registry = new DirectQueryConnectionFlowRegistry();
      registry.registerDirectQueryConnectionFlow({
        id: 'example-typed-flow',
        title: 'Example data connection',
        buttonLabel: 'Connect example data connection',
        ...(typeLabel !== undefined ? { typeLabel } : {}),
        mount: jest.fn(),
        ownsConnection: (so) => so.attributes.ownerPlugin === 'example',
      });
      await mountTable({ ...mockedContext, directQueryConnectionFlowRegistry: registry }, history);

      const tableRows = component.find('EuiInMemoryTable').prop('items') as DataSourceTableItem[];
      expect(tableRows.find((row) => row.id === 'flow-1')?.type).toBe(expected);
      // Rows the flow does not own keep their stored type.
      expect(tableRows.find((row) => row.id === 'legacy-1')?.type).toBe(
        'example-direct-query' as DataConnectionType
      );
      expect(findRow('Flow-owned connection').text()).toContain(expected);
      // The stored saved object attribute is not changed.
      expect(flowConnection.attributes.type).toBe('example-direct-query' as DataConnectionType);
    });

    const expectNoFlowBehaviour = () => {
      const tableRows = component.find('EuiInMemoryTable').prop('items') as DataSourceTableItem[];
      expect(tableRows.length).toBeGreaterThan(0);
      tableRows.forEach((row) => {
        expect(row).not.toHaveProperty('directQueryConnectionFlowId');
        expect(row).not.toHaveProperty('description');
      });
      // Rows keep their saved-object workspaces; only the column depends on a visible flow.
      expect(tableRows.find((row) => row.id === 'flow-1')?.workspaces).toEqual([
        'ws1',
        'unknown-ws',
      ]);
      expect(tableRows.find((row) => row.id === 'legacy-1')).not.toHaveProperty('workspaces');
      expect(component.find('a[data-test-subj^="directQueryConnectionFlowLink-"]')).toHaveLength(0);
      expect(component.find('th').someWhere((th) => th.text().includes('Workspaces'))).toBe(false);
    };

    it.each([
      ['resolves false', () => Promise.resolve(false)],
      ['rejects', () => Promise.reject(new Error('probe failed'))],
    ])(
      'does not add flow links or the Workspaces column when the only flow isVisible %s',
      async (_, isVisible) => {
        const registry = new DirectQueryConnectionFlowRegistry();
        registry.registerDirectQueryConnectionFlow({
          id: 'example-flow',
          title: 'Example connection',
          buttonLabel: 'Connect example data source',
          isVisible: isVisible as () => Promise<boolean>,
          mount: jest.fn(),
          ownsConnection: (so) => so.attributes.ownerPlugin === 'example',
        });
        (utils.getDataConnections as jest.Mock).mockClear();
        await mountTable(
          { ...mockedContext, directQueryConnectionFlowRegistry: registry },
          history
        );
        expectNoFlowBehaviour();
        expect(utils.getDataConnections).toHaveBeenCalledTimes(1);
      }
    );

    it('only links rows owned by a visible flow', async () => {
      const registry = new DirectQueryConnectionFlowRegistry();
      registry.registerDirectQueryConnectionFlow({
        id: 'hidden-flow',
        title: 'Hidden',
        buttonLabel: 'Hidden',
        isVisible: () => false,
        mount: jest.fn(),
        ownsConnection: () => true,
      });
      registry.registerDirectQueryConnectionFlow({
        id: 'example-flow',
        title: 'Example connection',
        buttonLabel: 'Connect example data source',
        isVisible: () => Promise.resolve(true),
        mount: jest.fn(),
        ownsConnection: (so) => so.attributes.ownerPlugin === 'example',
      });
      await mountTable({ ...mockedContext, directQueryConnectionFlowRegistry: registry }, history);
      const tableRows = component.find('EuiInMemoryTable').prop('items') as DataSourceTableItem[];
      expect(tableRows.find((row) => row.id === 'flow-1')?.directQueryConnectionFlowId).toBe(
        'example-flow'
      );
      expect(tableRows.find((row) => row.id === 'legacy-1')?.directQueryConnectionFlowId).toBe(
        undefined
      );
      expect(component.find('th').someWhere((th) => th.text().includes('Workspaces'))).toBe(true);
    });

    it('does not add flow links or the Workspaces column without canManage', async () => {
      const registry = new DirectQueryConnectionFlowRegistry();
      registry.registerDirectQueryConnectionFlow({
        id: 'example-flow',
        title: 'Example connection',
        buttonLabel: 'Connect example data source',
        mount: jest.fn(),
        ownsConnection: (so) => so.attributes.ownerPlugin === 'example',
      });
      await mountTable(
        {
          ...mockedContext,
          application: { capabilities: { dataSource: { canManage: false } } },
          directQueryConnectionFlowRegistry: registry,
        },
        history
      );
      expectNoFlowBehaviour();
    });

    it('does not add flow links or the Workspaces column when no flow is registered', async () => {
      await mountTable(
        {
          ...mockedContext,
          directQueryConnectionFlowRegistry: new DirectQueryConnectionFlowRegistry(),
        },
        history
      );
      expectNoFlowBehaviour();
    });
  });
});
