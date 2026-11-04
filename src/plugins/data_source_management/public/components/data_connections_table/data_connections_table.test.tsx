/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act } from 'react';
import * as utils from '../utils';
import { mount, ReactWrapper } from 'enzyme';
import { RouteComponentProps } from 'react-router-dom';
import { wrapWithIntl } from 'test_utils/enzyme_helpers';
import { SavedObjectsClientContract, ScopedHistory } from 'opensearch-dashboards/public';
import { scopedHistoryMock } from '../../../../../core/public/mocks';
import { OpenSearchDashboardsContextProvider } from '../../../../opensearch_dashboards_react/public';
import { getMappedDataSources, mockManagementPlugin } from '../../mocks';
import { DataConnectionsTable } from './data_connections_table';
import { BehaviorSubject } from 'rxjs';
import { DataSourceConnectionType, DataSourceTableItem } from '../../types';
import {
  DATA_CONNECTION_SAVED_OBJECT_TYPE,
  DataConnectionType,
} from '../../../../data_source/common';
import { DataSourceEngineType } from '../../../../data_source/common/data_sources';
import { LOCAL_CLUSTER } from '../../constants';
import { DEFAULT_DATA_SOURCE_UI_SETTINGS_ID } from '../constants';
import { UiSettingScope } from '../../../../../core/public';
import { waitFor } from '@testing-library/dom';
import { DirectQueryConnectionFlowRegistry } from '../../direct_query_connection_flow_registry';

/** Types a fixture as a util's resolved value; fixtures carry only the fields the table reads. */
const fixture = <F extends (...args: never[]) => Promise<unknown>>(value: unknown) =>
  value as Awaited<ReturnType<F>>;

const deleteButtonIdentifier = '[data-test-subj="deleteDataSourceConnections"]';
const tableIdentifier = 'EuiInMemoryTable';
const confirmModalIdentifier = 'EuiConfirmModal';

const mockedContext = {
  ...mockManagementPlugin.createDataSourceManagementContext(),
  application: { capabilities: { dataSource: { canManage: true } } },
};
let component: ReactWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;
const history = scopedHistoryMock.create() as unknown as ScopedHistory;

describe('DataConnectionsTable', () => {
  describe('should get direct query connections failed', () => {
    beforeEach(async () => {
      jest.spyOn(utils, 'getDataSources').mockReturnValue(Promise.reject());
      await act(async () => {
        component = await mount(
          wrapWithIntl(
            <DataConnectionsTable
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
      jest
        .spyOn(utils, 'getDataSources')
        .mockResolvedValue(fixture<typeof utils.getDataSources>(getMappedDataSources));
      jest
        .spyOn(utils, 'fetchDataSourceConnections')
        .mockResolvedValue(fixture<typeof utils.fetchDataSourceConnections>(getMappedDataSources));
      jest.spyOn(utils, 'getHideLocalCluster').mockReturnValue({ enabled: false });
      await act(async () => {
        component = await mount(
          wrapWithIntl(
            <DataConnectionsTable
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
      jest.spyOn(utils, 'deleteMultipleDataSources').mockResolvedValue(undefined);
      jest.spyOn(utils, 'setFirstDataSourceAsDefault').mockResolvedValue(true);
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
      jest.spyOn(utils, 'setFirstDataSourceAsDefault').mockResolvedValue(true);
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
      jest.spyOn(utils, 'getDataConnections').mockResolvedValue(
        fixture<typeof utils.getDataConnections>([
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
            <DataConnectionsTable
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
            <DataConnectionsTable
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
            <DataConnectionsTable
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
    test('should render empty table', async () => {
      jest
        .spyOn(utils, 'getDataSources')
        .mockResolvedValue(fixture<typeof utils.getDataSources>([]));
      jest
        .spyOn(utils, 'fetchDataSourceConnections')
        .mockResolvedValue(fixture<typeof utils.fetchDataSourceConnections>([]));
      jest
        .spyOn(utils, 'getDataConnections')
        .mockImplementation(() => Promise.reject(new Error('Failed to fetch connections')));
      await mountWithServices(mockedContext);

      expect(utils.getDataConnections).toHaveBeenCalled();
      expect(component.find(tableIdentifier).exists()).toBe(false);
      expect(component.text()).toContain('No Data Source Connections have been created yet.');
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
      jest
        .spyOn(utils, 'getDataSources')
        .mockResolvedValue(fixture<typeof utils.getDataSources>(getMappedDataSources));
      jest
        .spyOn(utils, 'fetchDataSourceConnections')
        .mockResolvedValue(fixture<typeof utils.fetchDataSourceConnections>(getMappedDataSources));
      jest
        .spyOn(utils, 'getDataConnections')
        .mockResolvedValue(fixture<typeof utils.getDataConnections>(mockedDataConnections));
      jest.spyOn(utils, 'getHideLocalCluster').mockReturnValue({ enabled: false });

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
            <DataConnectionsTable
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
            <DataConnectionsTable
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
      // Names break only between words, never inside one.
      expect(findRow('Flow-owned connection').find('span.eui-textBreakNormal').text()).toBe(
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

describe('DataConnectionsTable rows and the features of the former tabs', () => {
  const { OpenSearchConnection, DirectQueryConnection } = DataSourceConnectionType;

  /** A row as fetchDataSourceConnections returns it: a data source, or the local cluster. */
  const dataSource = (id: string, type: string, extra: Partial<DataSourceTableItem> = {}) =>
    ({
      id,
      title: id,
      type,
      connectionType: OpenSearchConnection,
      ...extra,
    }) as DataSourceTableItem;
  /** A `data-connection` saved object as getDataConnections returns it. */
  const dataConnection = (
    connectionId: string,
    type: string,
    attributes: Record<string, unknown> = {}
  ) => ({
    type: DATA_CONNECTION_SAVED_OBJECT_TYPE,
    id: `${connectionId}-id`,
    attributes: { connectionId, type, ...attributes },
  });

  const localClusterRow = dataSource(LOCAL_CLUSTER, DataSourceEngineType.OpenSearch, {
    relatedConnections: [
      {
        id: 'glue-under-local',
        title: 'glue-under-local',
        type: 'Amazon S3',
        connectionType: DirectQueryConnection,
        parentId: LOCAL_CLUSTER,
      } as DataSourceTableItem,
    ],
  });

  const createServices = ({
    canManage = true,
    workspace = false,
    admin = false,
    newHomePage = false,
    defaultId = null,
    registry,
  }: {
    canManage?: boolean;
    workspace?: boolean;
    admin?: boolean;
    newHomePage?: boolean;
    defaultId?: string | null;
    registry?: DirectQueryConnectionFlowRegistry;
  } = {}) => {
    const context = mockManagementPlugin.createDataSourceManagementContext();
    (context.uiSettings.getUserProvidedWithScope as jest.Mock).mockResolvedValue(defaultId);
    (context.uiSettings.get as jest.Mock).mockImplementation((key: string) =>
      key === 'home:useNewHomePage' ? newHomePage : undefined
    );
    // As the workspace client resolves (it never rejects): one result per object, with an
    // `error` for an object the server refused.
    const dissociate: jest.Mock = jest.fn(async (objects: Array<{ id: string }>) => ({
      success: true,
      result: objects.map(({ id }) => ({ id })),
    }));
    // As the client resolves a saved setting; it resolves false when the save fails.
    (context.uiSettings.set as jest.Mock).mockResolvedValue(true);
    const DataSourceAssociation = () => null;
    const services = {
      ...context,
      application: {
        ...context.application,
        capabilities: { dataSource: { canManage }, dashboards: { isDashboardAdmin: admin } },
      },
      workspaces: workspace
        ? {
            ...context.workspaces,
            currentWorkspace$: new BehaviorSubject({ id: 'ws-1', name: 'Ws', readonly: false }),
            client$: new BehaviorSubject({ ui: () => ({ DataSourceAssociation }), dissociate }),
          }
        : context.workspaces,
      overlays: { ...context.overlays, openConfirm: jest.fn().mockResolvedValue(true) },
      ...(registry ? { directQueryConnectionFlowRegistry: registry } : {}),
    };
    return { services, dissociate };
  };

  /** Lets the table's fetches, and the calls that follow them, finish. */
  const settle = async (table: ReactWrapper) => {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    table.update();
  };

  const mountWith = async (services: object, featureFlagStatus = true) => {
    const tableHistory = scopedHistoryMock.create() as unknown as ScopedHistory;
    (tableHistory.createHref as jest.Mock).mockImplementation(
      ({ pathname }: { pathname: string }) => `/app/dataSources/${pathname}`
    );
    let table!: ReactWrapper;
    await act(async () => {
      table = mount(
        wrapWithIntl(
          <DataConnectionsTable
            featureFlagStatus={featureFlagStatus}
            history={tableHistory}
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
    await settle(table);
    return table;
  };

  const rowsOf = (table: ReactWrapper) =>
    table.find('EuiInMemoryTable').first().prop('items') as DataSourceTableItem[];
  const rowOf = (table: ReactWrapper, title: string) =>
    table
      .find('tr')
      .hostNodes()
      .filterWhere((tr) => tr.text().includes(title));

  /** How a row's name shows (the page it links to, or text), and whether it is indented. */
  const nameShape = (table: ReactWrapper, title: string) => {
    // The outermost element whose text is the name: the link or button itself, or the text.
    const name = table
      .findWhere(
        (node) =>
          ['a', 'button', 'span'].includes(node.type() as string) && node.text().trim() === title
      )
      .first();
    const href = name.prop('href') as string | undefined;
    const testSubj = name.prop('data-test-subj') as string | undefined;
    let shownAs = 'text';
    if (name.type() === 'button') {
      shownAs = name.prop('disabled') ? 'disabled' : 'button';
    } else if (testSubj?.startsWith('directQueryConnectionFlowLink-')) {
      shownAs = 'flow page';
    } else if (href?.includes('/manage/')) {
      shownAs = 'details page';
    } else if (name.type() === 'a') {
      shownAs = 'data source page';
    }
    const style = name.prop('style') as { marginLeft?: string } | undefined;
    return { shownAs, indented: style?.marginLeft === '20px' };
  };

  beforeEach(() => {
    jest.spyOn(utils, 'getDataSources').mockResolvedValue(fixture<typeof utils.getDataSources>([]));
    jest
      .spyOn(utils, 'fetchDataSourceConnections')
      .mockResolvedValue(fixture<typeof utils.fetchDataSourceConnections>([]));
    jest
      .spyOn(utils, 'getDataConnections')
      .mockResolvedValue(fixture<typeof utils.getDataConnections>([]));
    jest.spyOn(utils, 'getHideLocalCluster').mockReturnValue({ enabled: false });
    jest.spyOn(utils, 'deleteMultipleDataSources').mockResolvedValue(undefined);
    jest.spyOn(utils, 'setFirstDataSourceAsDefault').mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('every connection type', () => {
    // Connections under a data source, shown when its row is expanded.
    const nestedRows = [
      {
        id: 'opensearch-ds-glue-under-ds',
        title: 'glue-under-ds',
        type: 'Amazon S3',
        connectionType: DirectQueryConnection,
        parentId: 'opensearch-ds',
      },
      {
        id: 'opensearch-ds:remote-under-ds',
        title: 'remote-under-ds',
        type: DataSourceEngineType.OpenSearchCrossCluster,
        connectionType: OpenSearchConnection,
        parentId: 'opensearch-ds',
      },
    ] as DataSourceTableItem[];
    const dataSourceRows = [
      dataSource('opensearch-ds', DataSourceEngineType.OpenSearch, {
        relatedConnections: nestedRows,
      }),
      dataSource('serverless-ds', DataSourceEngineType.OpenSearchServerless),
      dataSource('elasticsearch-ds', DataSourceEngineType.Elasticsearch),
      dataSource('analyticengine-ds', DataSourceEngineType.AnalyticEngine),
      dataSource('noengine-ds', DataSourceEngineType.NA),
      localClusterRow,
    ];
    const dataConnections = [
      dataConnection('cloudwatch-dc', DataConnectionType.CloudWatch),
      dataConnection('securitylake-dc', DataConnectionType.SecurityLake),
      dataConnection('amp-dc', DataConnectionType.AWSPrometheus),
      dataConnection('prometheus-dc', DataConnectionType.Prometheus),
      dataConnection('apm-dc', DataConnectionType.ApplicationPerformanceMonitoring),
      dataConnection('none-dc', DataConnectionType.NA),
      // Flows own these two, as an application's own connection flows do.
      dataConnection('exampleflow-dc', 'Example source', {
        connectionKind: 'DATA_CONNECTION',
        dataConnectionType: 'EXAMPLE_TYPE',
      }),
      dataConnection('otherflow-dc', 'OTHER_EXAMPLE_TYPE', {
        connectionKind: 'DATA_CONNECTION',
        dataConnectionType: 'OTHER_EXAMPLE_TYPE',
      }),
      // A native data source of the application, which no flow owns.
      dataConnection('nativeexample-dc', 'Example native source', {
        nativeDataSourceType: 'EXAMPLE',
      }),
    ];
    const exampleFlowsRegistry = () => {
      const registry = new DirectQueryConnectionFlowRegistry();
      registry.registerDirectQueryConnectionFlow({
        id: 'example',
        title: 'Example source',
        buttonLabel: 'Connect Example source',
        typeLabel: 'Example source',
        mount: jest.fn(),
        ownsConnection: (so) => so.attributes.dataConnectionType === 'EXAMPLE_TYPE',
      });
      registry.registerDirectQueryConnectionFlow({
        id: 'other-example',
        title: 'Other example source',
        buttonLabel: 'Connect Other example source',
        typeLabel: 'Other example source',
        mount: jest.fn(),
        ownsConnection: (so) =>
          so.attributes.connectionKind === 'DATA_CONNECTION' &&
          so.attributes.dataConnectionType !== 'EXAMPLE_TYPE',
      });
      return registry;
    };

    it.each([
      ['opensearch-ds', DataSourceEngineType.OpenSearch, 'data source page'],
      ['serverless-ds', DataSourceEngineType.OpenSearchServerless, 'data source page'],
      ['elasticsearch-ds', DataSourceEngineType.Elasticsearch, 'data source page'],
      ['analyticengine-ds', DataSourceEngineType.AnalyticEngine, 'data source page'],
      ['noengine-ds', DataSourceEngineType.NA, 'data source page'],
      [LOCAL_CLUSTER, DataSourceEngineType.OpenSearch, 'disabled'],
    ])('lists %s once with type %s, its name shown as %s', async (title, type, shownAs) => {
      jest
        .spyOn(utils, 'fetchDataSourceConnections')
        .mockResolvedValue(fixture<typeof utils.fetchDataSourceConnections>(dataSourceRows));
      const table = await mountWith(createServices().services);
      expect(rowsOf(table).filter((row) => row.title === title)).toEqual([
        expect.objectContaining({ type }),
      ]);
      expect(nameShape(table, title)).toEqual({ shownAs, indented: false });
    });

    it.each([
      ['cloudwatch-dc', DataConnectionType.CloudWatch, 'text'],
      ['securitylake-dc', DataConnectionType.SecurityLake, 'text'],
      ['amp-dc', DataConnectionType.AWSPrometheus, 'text'],
      ['prometheus-dc', DataConnectionType.Prometheus, 'details page'],
      ['apm-dc', DataConnectionType.ApplicationPerformanceMonitoring, 'text'],
      ['none-dc', DataConnectionType.NA, 'text'],
      ['exampleflow-dc', 'Example source', 'flow page'],
      ['otherflow-dc', 'Other example source', 'flow page'],
      ['nativeexample-dc', 'Example native source', 'text'],
    ])(
      'lists %s once with type %s, not indented, its name shown as %s',
      async (title, type, shownAs) => {
        jest
          .spyOn(utils, 'getDataConnections')
          .mockResolvedValue(fixture<typeof utils.getDataConnections>(dataConnections));
        const table = await mountWith(
          createServices({ registry: exampleFlowsRegistry() }).services
        );
        expect(rowsOf(table).filter((row) => row.title === title)).toEqual([
          expect.objectContaining({ type }),
        ]);
        expect(nameShape(table, title)).toEqual({ shownAs, indented: false });
      }
    );

    // A user who can't manage data sources sees no flows, so a flow's connection has no page to
    // open for them: its name is plain text, never a link to the legacy details page
    // (/manage/<name>), whose route refuses those connections.
    it.each(['exampleflow-dc', 'otherflow-dc'])(
      'shows %s, which a flow owns, as plain text to a user who cannot manage data sources',
      async (title) => {
        jest
          .spyOn(utils, 'getDataConnections')
          .mockResolvedValue(fixture<typeof utils.getDataConnections>(dataConnections));
        const table = await mountWith(
          createServices({ canManage: false, registry: exampleFlowsRegistry() }).services
        );
        expect(nameShape(table, title)).toEqual({ shownAs: 'text', indented: false });
        expect(table.find(`a[href*="/manage/${title}"]`)).toHaveLength(0);
      }
    );

    it('links a connection to its flow page for a user who cannot manage data sources when the flow does not require it', async () => {
      jest
        .spyOn(utils, 'getDataConnections')
        .mockResolvedValue(fixture<typeof utils.getDataConnections>(dataConnections));
      const registry = new DirectQueryConnectionFlowRegistry();
      registry.registerDirectQueryConnectionFlow({
        id: 'example',
        title: 'Example source',
        buttonLabel: 'Connect Example source',
        typeLabel: 'Example source',
        requiresDataSourceManagement: false,
        mount: jest.fn(),
        ownsConnection: (so) => so.attributes.dataConnectionType === 'EXAMPLE_TYPE',
      });
      const table = await mountWith(createServices({ canManage: false, registry }).services);
      expect(nameShape(table, 'exampleflow-dc')).toEqual({ shownAs: 'flow page', indented: false });
    });

    it.each([
      ['glue-under-ds', 'Amazon S3', 'details page'],
      ['remote-under-ds', DataSourceEngineType.OpenSearchCrossCluster, 'data source page'],
    ])(
      'shows %s (%s) indented under its data source once expanded',
      async (title, type, shownAs) => {
        jest
          .spyOn(utils, 'fetchDataSourceConnections')
          .mockResolvedValue(fixture<typeof utils.fetchDataSourceConnections>(dataSourceRows));
        const table = await mountWith(createServices().services);
        expect(rowsOf(table).some((row) => row.title === title)).toBe(false);
        rowOf(table, 'opensearch-ds').find('button[aria-label="Expand"]').simulate('click');
        table.update();
        expect(table.find('EuiInMemoryTable').at(1).prop('items')).toContainEqual(
          expect.objectContaining({ title, type })
        );
        expect(nameShape(table, title)).toEqual({ shownAs, indented: true });
      }
    );

    it('asks for the cross-cluster connections of each data source', async () => {
      await mountWith(createServices().services);
      expect(utils.fetchDataSourceConnections).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        true,
        false,
        true
      );
    });

    it('lets every row but the local cluster be selected', async () => {
      jest
        .spyOn(utils, 'fetchDataSourceConnections')
        .mockResolvedValue(fixture<typeof utils.fetchDataSourceConnections>(dataSourceRows));
      const table = await mountWith(createServices().services);
      const { selectable } = table.find('EuiInMemoryTable').first().prop('selection') as {
        selectable: (row: DataSourceTableItem) => boolean;
      };
      expect(rowsOf(table).filter((row) => !selectable(row))).toEqual([localClusterRow]);
    });

    it("doesn't let a flow's connections be selected for Delete, and says why", async () => {
      jest
        .spyOn(utils, 'getDataConnections')
        .mockResolvedValue(fixture<typeof utils.getDataConnections>(dataConnections));
      const table = await mountWith(createServices({ registry: exampleFlowsRegistry() }).services);
      const { selectable } = table.find('EuiInMemoryTable').first().prop('selection') as {
        selectable: (row: DataSourceTableItem) => boolean;
      };
      expect(
        rowsOf(table)
          .filter((row) => !selectable(row))
          .map((row) => row.title)
          .sort()
      ).toEqual(['exampleflow-dc', 'otherflow-dc']);
      const checkbox = (title: string) =>
        table.find(`input[data-test-subj="checkboxSelectRow-${title}-id"]`);
      expect(checkbox('otherflow-dc').prop('disabled')).toBe(true);
      expect(checkbox('otherflow-dc').prop('aria-label')).toBe(
        'otherflow-dc is managed on its own page. Remove it from its page.'
      );
      // Other connections keep the default label and stay selectable.
      expect(checkbox('cloudwatch-dc').prop('disabled')).toBe(false);
      expect(checkbox('cloudwatch-dc').prop('aria-label')).toBe('Select this row');
    });

    it.each([
      ['lists the local cluster when it has direct query connections', true],
      ['leaves out the local cluster when it has none', false],
    ])('%s', async (_name, hasConnections) => {
      jest
        .spyOn(utils, 'fetchDataSourceConnections')
        .mockResolvedValue(
          fixture<typeof utils.fetchDataSourceConnections>([
            dataSource('opensearch-ds', DataSourceEngineType.OpenSearch),
            hasConnections ? localClusterRow : { ...localClusterRow, relatedConnections: [] },
          ])
        );
      const table = await mountWith(createServices().services);
      expect(rowsOf(table).some((row) => row.id === LOCAL_CLUSTER)).toBe(hasConnections);
    });
  });

  describe('features of the former OpenSearch connections tab', () => {
    const alpha = dataSource('ds-alpha', DataSourceEngineType.OpenSearch);
    const beta = dataSource('ds-beta', DataSourceEngineType.OpenSearch);
    const gamma = dataConnection('dc-gamma', DataConnectionType.CloudWatch);
    const setAsDefaultButton =
      '[data-test-subj="dataSourcesManagement-dataSourceTable-setAsDefaultButton"]';

    beforeEach(() => {
      jest
        .spyOn(utils, 'fetchDataSourceConnections')
        .mockResolvedValue(fixture<typeof utils.fetchDataSourceConnections>([alpha, beta]));
      jest
        .spyOn(utils, 'getDataConnections')
        .mockResolvedValue(fixture<typeof utils.getDataConnections>([gamma]));
    });

    const hasDefaultBadge = (table: ReactWrapper, title: string) =>
      rowOf(table, title)
        .find('EuiBadge')
        .filterWhere((badge) => badge.text() === 'Default')
        .exists();

    const deleteRows = async (table: ReactWrapper, ids: string[]) => {
      const { onSelectionChange } = table.find('EuiInMemoryTable').first().prop('selection') as {
        onSelectionChange: (rows: DataSourceTableItem[]) => void;
      };
      act(() => onSelectionChange(rowsOf(table).filter((row) => ids.includes(row.id))));
      table.update();
      table.find('[data-test-subj="deleteDataSourceConnections"]').first().simulate('click');
      await act(async () => {
        (table.find('EuiConfirmModal').first().prop('onConfirm') as () => void)();
      });
      await settle(table);
    };

    it('shows the Default badge on the default data source only', async () => {
      const table = await mountWith(createServices({ defaultId: 'ds-beta' }).services);
      expect(
        ['ds-alpha', 'ds-beta', 'dc-gamma'].filter((title) => hasDefaultBadge(table, title))
      ).toEqual(['ds-beta']);
    });

    it.each([
      ['outside a workspace', false, UiSettingScope.GLOBAL],
      ['inside a workspace', true, UiSettingScope.WORKSPACE],
    ])('reads the default data source %s', async (_name, workspace, scope) => {
      const { services } = createServices({ workspace });
      await mountWith(services);
      expect(services.uiSettings.getUserProvidedWithScope).toHaveBeenCalledWith(
        DEFAULT_DATA_SOURCE_UI_SETTINGS_ID,
        scope
      );
    });

    it('warns when the default data source cannot be read', async () => {
      const { services } = createServices();
      (services.uiSettings.getUserProvidedWithScope as jest.Mock).mockRejectedValue(
        new Error('No default data source')
      );
      await mountWith(services);
      expect(services.notifications.toasts.addWarning).toHaveBeenCalledWith(
        'No default data source'
      );
    });

    it('offers Set as default on data sources in a workspace, and moves the badge', async () => {
      const { services } = createServices({ workspace: true, defaultId: 'ds-alpha' });
      const table = await mountWith(services);
      const setAsDefault = (title: string) =>
        rowOf(table, title).find(`button${setAsDefaultButton}`);
      expect(setAsDefault('dc-gamma').exists()).toBe(false);
      expect(setAsDefault('ds-alpha').prop('disabled')).toBe(true);

      await act(async () => {
        setAsDefault('ds-beta').simulate('click');
      });
      table.update();
      expect(services.uiSettings.set).toHaveBeenCalledWith(
        DEFAULT_DATA_SOURCE_UI_SETTINGS_ID,
        'ds-beta',
        UiSettingScope.WORKSPACE
      );
      expect(['ds-alpha', 'ds-beta'].filter((title) => hasDefaultBadge(table, title))).toEqual([
        'ds-beta',
      ]);
    });

    it('does not offer Set as default outside a workspace', async () => {
      const table = await mountWith(createServices({ defaultId: 'ds-alpha' }).services);
      expect(table.find(setAsDefaultButton).exists()).toBe(false);
    });

    it.each([
      ['the default data source', 'ds-beta', true],
      ['another data source', 'ds-alpha', false],
    ])('picks a new default after deleting %s: %s', async (_name, deleted, picksNew) => {
      const { services } = createServices({ defaultId: 'ds-beta' });
      const table = await mountWith(services);
      await deleteRows(table, [deleted]);
      expect(utils.deleteMultipleDataSources).toHaveBeenCalled();
      expect((utils.setFirstDataSourceAsDefault as jest.Mock).mock.calls).toEqual(
        picksNew
          ? [[services.savedObjects.client, services.uiSettings, true, UiSettingScope.GLOBAL]]
          : []
      );
    });

    it('says so when no new default can be set after deleting the default', async () => {
      jest.spyOn(utils, 'setFirstDataSourceAsDefault').mockRejectedValue(new Error('None left'));
      const { services } = createServices({ defaultId: 'ds-beta' });
      const table = await mountWith(services);
      await deleteRows(table, ['ds-beta']);
      expect(services.notifications.toasts.addDanger).toHaveBeenCalledWith(
        'Unable to find a default datasource. Please set a new default datasource.'
      );
    });

    it('says so when the new default after deleting the default is not saved', async () => {
      // uiSettings.set resolves false when the save fails.
      jest.spyOn(utils, 'setFirstDataSourceAsDefault').mockResolvedValue(false);
      const { services } = createServices({ defaultId: 'ds-beta' });
      const table = await mountWith(services);
      await deleteRows(table, ['ds-beta']);
      expect(services.notifications.toasts.addDanger).toHaveBeenCalledWith(
        'Unable to find a default datasource. Please set a new default datasource.'
      );
    });

    it.each([
      ['the default data source', 'ds-beta', true],
      ['another data source', 'ds-alpha', false],
    ])(
      'picks a new default after removing the association of %s: %s',
      async (_name, removed, picksNew) => {
        const { services, dissociate } = createServices({
          workspace: true,
          admin: true,
          defaultId: 'ds-beta',
        });
        const table = await mountWith(services);
        await act(async () => {
          rowOf(table, removed)
            .find('button[data-test-subj="dataSourcesManagement-dataSourceTable-dissociateButton"]')
            .simulate('click');
        });
        await settle(table);
        expect(dissociate).toHaveBeenCalledWith([{ id: removed, type: 'data-source' }], 'ws-1');
        expect((utils.setFirstDataSourceAsDefault as jest.Mock).mock.calls).toEqual(
          picksNew
            ? [[services.savedObjects.client, services.uiSettings, true, UiSettingScope.WORKSPACE]]
            : []
        );
      }
    );

    it('makes the first data source the default after an association, not another row', async () => {
      // The local cluster comes first, but only a data source can be the default.
      jest
        .spyOn(utils, 'fetchDataSourceConnections')
        .mockResolvedValue(
          fixture<typeof utils.fetchDataSourceConnections>([localClusterRow, alpha, beta])
        );
      const { services } = createServices({ workspace: true, admin: true, newHomePage: true });
      await mountWith(services);
      const headerControl = services.navigation.ui.HeaderControl as jest.Mock;
      const { controls } = headerControl.mock.calls[headerControl.mock.calls.length - 1][0];
      await act(async () => {
        await controls[0].renderComponent.props.onComplete();
      });
      expect(services.uiSettings.set).toHaveBeenCalledWith(
        DEFAULT_DATA_SOURCE_UI_SETTINGS_ID,
        'ds-alpha',
        UiSettingScope.WORKSPACE
      );
    });

    it.each([
      ['offers to create the first connection', true],
      ['shows no Create button to a user who cannot manage data sources', false],
    ])('%s when there is none', async (_name, canManage) => {
      jest
        .spyOn(utils, 'fetchDataSourceConnections')
        .mockResolvedValue(fixture<typeof utils.fetchDataSourceConnections>([]));
      jest
        .spyOn(utils, 'getDataConnections')
        .mockResolvedValue(fixture<typeof utils.getDataConnections>([]));
      const table = await mountWith(createServices({ canManage }).services);
      expect(table.find('[data-test-subj="datasourceTableEmptyState"]').hostNodes()).toHaveLength(
        1
      );
      expect(
        table.find('[data-test-subj="createDataSourceButtonEmptyState"]').hostNodes().exists()
      ).toBe(canManage);
      expect(table.find('EuiInMemoryTable').exists()).toBe(false);
    });

    it('offers to create the first connection to a user who cannot manage data sources but has a type card', async () => {
      const registry = new DirectQueryConnectionFlowRegistry();
      registry.registerDirectQueryConnectionFlow({
        id: 'example',
        title: 'Example source',
        buttonLabel: 'Connect Example source',
        requiresDataSourceManagement: false,
        createPageCard: { description: 'Example data connection' },
        mount: jest.fn(),
      });
      jest
        .spyOn(utils, 'fetchDataSourceConnections')
        .mockResolvedValue(fixture<typeof utils.fetchDataSourceConnections>([]));
      jest
        .spyOn(utils, 'getDataConnections')
        .mockResolvedValue(fixture<typeof utils.getDataConnections>([]));
      const table = await mountWith(createServices({ canManage: false, registry }).services);
      expect(table.find('[data-test-subj="datasourceTableEmptyState"]').hostNodes()).toHaveLength(
        1
      );
      expect(
        table.find('[data-test-subj="createDataSourceButtonEmptyState"]').hostNodes().exists()
      ).toBe(true);
    });

    it('keeps the empty table when multiple data sources is off', async () => {
      jest
        .spyOn(utils, 'getDataConnections')
        .mockResolvedValue(fixture<typeof utils.getDataConnections>([]));
      const { services } = createServices();
      (services.http.get as jest.Mock).mockResolvedValue([]);
      const table = await mountWith(services, false);
      expect(table.find('[data-test-subj="datasourceTableEmptyState"]').exists()).toBe(false);
      expect(table.find('EuiInMemoryTable').exists()).toBe(true);
    });

    it.each([
      ['on', true, [['Data Sources']]],
      ['off', false, []],
    ])(
      'sets the tab title as the former tab did when multiple data sources is %s',
      async (_name, featureFlagStatus, calls) => {
        (utils.getDataConnections as jest.Mock).mockResolvedValue([]);
        const { services } = createServices();
        (services.http.get as jest.Mock).mockResolvedValue([]);
        await mountWith(services, featureFlagStatus);
        expect((services.chrome.docTitle.change as jest.Mock).mock.calls).toEqual(calls);
      }
    );
  });

  describe('code review fixes', () => {
    const removeAssociationButton =
      'button[data-test-subj="dataSourcesManagement-dataSourceTable-dissociateButton"]';
    const setAsDefaultButton =
      'button[data-test-subj="dataSourcesManagement-dataSourceTable-setAsDefaultButton"]';

    it("never deletes a flow's connection selected before its flow was known", async () => {
      let resolveVisible!: (visible: boolean) => void;
      const registry = new DirectQueryConnectionFlowRegistry();
      registry.registerDirectQueryConnectionFlow({
        id: 'example',
        title: 'Example source',
        buttonLabel: 'Connect Example source',
        typeLabel: 'Example source',
        isVisible: () =>
          new Promise<boolean>((resolve) => {
            resolveVisible = resolve;
          }),
        mount: jest.fn(),
        ownsConnection: (so) => so.attributes.dataConnectionType === 'EXAMPLE_TYPE',
      });
      jest.spyOn(utils, 'getDataConnections').mockResolvedValue(
        fixture<typeof utils.getDataConnections>([
          dataConnection('exampleflow-dc', 'Example source', {
            connectionKind: 'DATA_CONNECTION',
            dataConnectionType: 'EXAMPLE_TYPE',
          }),
          dataConnection('other-dc', DataConnectionType.SecurityLake),
        ])
      );
      // The real delete, so the request to the SQL plugin can be checked.
      (utils.deleteMultipleDataSources as jest.Mock).mockRestore();
      const { services } = createServices({ registry });
      (services.savedObjects.client.get as jest.Mock).mockResolvedValue({ references: [] });
      const table = await mountWith(services);

      // The flow is still resolving, so its connection can be selected.
      ['exampleflow-dc', 'other-dc'].forEach((title) =>
        table
          .find(`input[data-test-subj="checkboxSelectRow-${title}-id"]`)
          .simulate('change', { target: { checked: true } })
      );
      table.update();
      await act(async () => resolveVisible(true));
      await settle(table);
      expect(
        rowsOf(table).find((row) => row.id === 'exampleflow-dc-id')?.directQueryConnectionFlowId
      ).toBe('example');

      table.find('button[data-test-subj="deleteDataSourceConnections"]').simulate('click');
      await act(async () => {
        (table.find('EuiConfirmModal').first().prop('onConfirm') as () => void)();
      });
      await settle(table);
      expect((services.http.delete as jest.Mock).mock.calls).toEqual([
        [expect.stringContaining('/other-dc/')],
      ]);
    });

    const withTwoDataSources = () =>
      jest
        .spyOn(utils, 'fetchDataSourceConnections')
        .mockResolvedValue(
          fixture<typeof utils.fetchDataSourceConnections>([
            dataSource('ds-alpha', DataSourceEngineType.OpenSearch),
            dataSource('ds-beta', DataSourceEngineType.OpenSearch),
          ])
        );
    const dangerToasts = (services: { notifications: { toasts: { addDanger: unknown } } }) =>
      (services.notifications.toasts.addDanger as jest.Mock).mock.calls;
    const fetchCount = () => (utils.fetchDataSourceConnections as jest.Mock).mock.calls.length;
    const removeAssociationOf = async (table: ReactWrapper, title: string) => {
      await act(async () => {
        rowOf(table, title).find(removeAssociationButton).simulate('click');
      });
      await settle(table);
    };
    const refuseEvery = async (objects: Array<{ id: string }>) => ({
      success: true,
      result: objects.map(({ id }) => ({ id, error: 'Forbidden' })),
    });

    it.each([
      [
        'the request fails',
        (dissociate: jest.Mock) =>
          dissociate.mockResolvedValue({ success: false, error: 'denied' }),
        [['Could not remove 1 association. Please try it again']],
      ],
      [
        'the server refuses the object',
        (dissociate: jest.Mock) => dissociate.mockImplementation(refuseEvery),
        [['Could not remove 1 association. Please try it again']],
      ],
      [
        'the client rejects, which it is not expected to do',
        (dissociate: jest.Mock) => dissociate.mockRejectedValue(new Error('denied')),
        [['Could not remove 1 association. Please try it again']],
      ],
      ['there is no workspace client', undefined, []],
    ])(
      'stops loading, keeps the default and says so when Remove association fails because %s',
      async (_name, fail, toasts) => {
        withTwoDataSources();
        const { services, dissociate } = createServices({
          workspace: true,
          admin: true,
          defaultId: 'ds-alpha',
        });
        fail?.(dissociate);
        const table = await mountWith(services);
        if (!fail) {
          // The client goes away after the table rendered with it.
          await act(async () => {
            (services.workspaces.client$ as BehaviorSubject<unknown>).next(undefined);
          });
          table.update();
        }
        const fetches = fetchCount();
        await removeAssociationOf(table, 'ds-alpha');
        expect(table.find('EuiLoadingSpinner').exists()).toBe(false);
        expect(table.find('EuiInMemoryTable').exists()).toBe(true);
        expect(dangerToasts(services)).toEqual(toasts);
        // Nothing was removed: the rows are not fetched again, and the default stays.
        expect(fetchCount()).toBe(fetches);
        expect(utils.setFirstDataSourceAsDefault).not.toHaveBeenCalled();
      }
    );

    it('removes the associations the server took and names how many it refused, keeping a refused default', async () => {
      withTwoDataSources();
      const { services, dissociate } = createServices({
        canManage: false,
        workspace: true,
        admin: true,
        defaultId: 'ds-beta',
      });
      dissociate.mockImplementation(async (objects: Array<{ id: string }>) => ({
        success: true,
        result: objects.map(({ id }) => (id === 'ds-beta' ? { id, error: 'Forbidden' } : { id })),
      }));
      const table = await mountWith(services);
      const { onSelectionChange } = table.find('EuiInMemoryTable').first().prop('selection') as {
        onSelectionChange: (rows: DataSourceTableItem[]) => void;
      };
      act(() => onSelectionChange(rowsOf(table)));
      table.update();
      const fetches = fetchCount();
      await act(async () => {
        table.find('button[data-test-subj="dissociateSelectedDataSources"]').simulate('click');
      });
      await settle(table);
      expect(dissociate).toHaveBeenCalledWith(
        [
          { id: 'ds-alpha', type: 'data-source' },
          { id: 'ds-beta', type: 'data-source' },
        ],
        'ws-1'
      );
      expect(dangerToasts(services)).toEqual([
        ['Could not remove 1 association. Please try it again'],
      ]);
      expect(fetchCount()).toBe(fetches + 1);
      expect(table.find('button[data-test-subj="dissociateSelectedDataSources"]').exists()).toBe(
        false
      );
      expect(utils.setFirstDataSourceAsDefault).not.toHaveBeenCalled();
    });

    it.each([
      [
        'it is not saved',
        () => jest.spyOn(utils, 'setFirstDataSourceAsDefault').mockResolvedValue(false),
      ],
      [
        'it throws',
        () =>
          jest
            .spyOn(utils, 'setFirstDataSourceAsDefault')
            .mockRejectedValue(new Error('None left')),
      ],
    ])(
      'says only that no new default was set when replacing a dissociated default fails because %s',
      async (_name, fail) => {
        withTwoDataSources();
        fail();
        const { services } = createServices({
          workspace: true,
          admin: true,
          defaultId: 'ds-alpha',
        });
        const table = await mountWith(services);
        const fetches = fetchCount();
        await removeAssociationOf(table, 'ds-alpha');
        expect(fetchCount()).toBe(fetches + 1);
        expect(utils.setFirstDataSourceAsDefault).toHaveBeenCalledTimes(1);
        expect(dangerToasts(services)).toEqual([
          ['Unable to find a default datasource. Please set a new default datasource.'],
        ]);
      }
    );

    it('says nothing when a dissociated default leaves no data source to replace it', async () => {
      withTwoDataSources();
      jest.spyOn(utils, 'setFirstDataSourceAsDefault').mockResolvedValue(undefined);
      const { services } = createServices({ workspace: true, admin: true, defaultId: 'ds-alpha' });
      const table = await mountWith(services);
      await removeAssociationOf(table, 'ds-alpha');
      expect(utils.setFirstDataSourceAsDefault).toHaveBeenCalledTimes(1);
      expect(dangerToasts(services)).toEqual([]);
    });

    const clickSetAsDefaultOnBeta = async (fail: (set: jest.Mock) => void) => {
      withTwoDataSources();
      const { services } = createServices({ workspace: true, defaultId: 'ds-alpha' });
      fail(services.uiSettings.set as jest.Mock);
      const table = await mountWith(services);
      await act(async () => {
        rowOf(table, 'ds-beta').find(setAsDefaultButton).simulate('click');
      });
      await settle(table);
      return { services, table };
    };

    const expectDefaultUnchanged = (table: ReactWrapper) => {
      expect(rowOf(table, 'ds-alpha').find(setAsDefaultButton).prop('disabled')).toBe(true);
      expect(rowOf(table, 'ds-beta').find(setAsDefaultButton).prop('disabled')).toBe(false);
    };

    it('leaves a failed Set as default save to the core toast, and keeps the default', async () => {
      const { services, table } = await clickSetAsDefaultOnBeta((set) =>
        set.mockResolvedValue(false)
      );
      expect(dangerToasts(services)).toEqual([]);
      expectDefaultUnchanged(table);
    });

    it('says so when Set as default may not change the setting, and keeps the default', async () => {
      const { services, table } = await clickSetAsDefaultOnBeta((set) =>
        set.mockRejectedValue(new Error('overridden by the server'))
      );
      expect(dangerToasts(services)).toEqual([
        ['Could not set ds-beta as the default data source'],
      ]);
      expectDefaultUnchanged(table);
    });

    describe('expanded rows', () => {
      const nested = (title: string) =>
        ({
          id: `ds-alpha-${title}`,
          title,
          type: 'Amazon S3',
          connectionType: DataSourceConnectionType.DirectQueryConnection,
          parentId: 'ds-alpha',
        }) as DataSourceTableItem;
      const withChildren = (...titles: string[]) =>
        fixture<typeof utils.fetchDataSourceConnections>([
          dataSource('ds-alpha', DataSourceEngineType.OpenSearch, {
            relatedConnections: titles.map(nested),
          }),
        ]);
      const nestedTitles = (table: ReactWrapper) =>
        (table.find('EuiInMemoryTable').at(1).prop('items') as DataSourceTableItem[]).map(
          (row) => row.title
        );

      it('labels the expander Expand and Collapse', async () => {
        jest.spyOn(utils, 'fetchDataSourceConnections').mockResolvedValue(withChildren('glue-1'));
        const table = await mountWith(createServices().services);
        rowOf(table, 'ds-alpha').find('button[aria-label="Expand"]').simulate('click');
        table.update();
        expect(rowOf(table, 'ds-alpha').find('button[aria-label="Collapse"]').exists()).toBe(true);
      });

      it('shows the current connections under an expanded row after a refetch', async () => {
        const fetchConnections = jest
          .spyOn(utils, 'fetchDataSourceConnections')
          .mockResolvedValue(withChildren('glue-1'));
        const { services, dissociate } = createServices({ workspace: true, admin: true });
        const table = await mountWith(services);
        rowOf(table, 'ds-alpha').find('button[aria-label="Expand"]').simulate('click');
        table.update();
        expect(nestedTitles(table)).toEqual(['glue-1']);

        // Removing an association refetches the rows.
        fetchConnections.mockResolvedValue(withChildren('glue-1', 'glue-2'));
        await act(async () => {
          table.find(removeAssociationButton).last().simulate('click');
        });
        await settle(table);
        expect(dissociate).toHaveBeenCalled();
        expect(nestedTitles(table)).toEqual(['glue-1', 'glue-2']);
      });

      it('keeps the Action column on nested rows, as the tables without data connections do', async () => {
        jest.spyOn(utils, 'fetchDataSourceConnections').mockResolvedValue(withChildren('glue-1'));
        const table = await mountWith(createServices({ workspace: true, admin: true }).services);
        rowOf(table, 'ds-alpha').find('button[aria-label="Expand"]').simulate('click');
        table.update();
        const nestedColumns = table.find('EuiInMemoryTable').at(1).prop('columns') as Array<{
          name?: string;
          field?: string;
        }>;
        expect(nestedColumns.map((column) => column.name)).toContain('Action');
        expect(nestedColumns.some((column) => column.field === 'workspaces')).toBe(false);
      });
    });
  });
});
