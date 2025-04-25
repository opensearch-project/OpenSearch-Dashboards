/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act } from 'react-dom/test-utils';
import * as utils from '../utils';
import { DataSourceTable } from './data_source_table';
import { mount, ReactWrapper } from 'enzyme';
import { RouteComponentProps } from 'react-router-dom';
import { wrapWithIntl } from 'test_utils/enzyme_helpers';
import { ScopedHistory, WorkspaceObject } from 'opensearch-dashboards/public';
import { scopedHistoryMock } from '../../../../../core/public/mocks';
import { OpenSearchDashboardsContextProvider } from '../../../../opensearch_dashboards_react/public';
import {
  getDataSourcesWithCrossClusterConnections,
  getMappedDataSources,
  getMappedDataSourcesWithEmptyDescription,
  mockManagementPlugin,
} from '../../mocks';
import { BehaviorSubject } from 'rxjs';
import { DEFAULT_DATA_SOURCE_UI_SETTINGS_ID } from '../constants';

const deleteButtonIdentifier = '[data-test-subj="deleteDataSourceConnections"]';
const tableIdentifier = 'EuiInMemoryTable';
const confirmModalIdentifier = 'EuiConfirmModal';
const tableColumnHeaderIdentifier = 'EuiTableHeaderCell';
const badgeIcon = 'EuiBadge';
const tableColumnHeaderButtonIdentifier = 'EuiTableHeaderCell .euiTableHeaderButton';
const emptyStateIdentifier = '[data-test-subj="datasourceTableEmptyState"]';

describe('DataSourceTable', () => {
  const mockedContext = {
    ...mockManagementPlugin.createDataSourceManagementContext(),
    application: { capabilities: { dataSource: { canManage: true } } },
  };
  const uiSettings = mockedContext.uiSettings;
  let component: ReactWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;
  const history = (scopedHistoryMock.create() as unknown) as ScopedHistory;
  describe('should get datasources failed', () => {
    beforeEach(async () => {
      spyOn(utils, 'getDataSources').and.returnValue(Promise.reject());
      await act(async () => {
        component = await mount(
          wrapWithIntl(
            <DataSourceTable
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
      expect(component.find(emptyStateIdentifier).exists()).toBe(true);
    });
  });

  describe('should get datasources successful', () => {
    beforeEach(async () => {
      spyOn(utils, 'getDataSources').and.returnValue(Promise.resolve(getMappedDataSources));
      spyOn(uiSettings, 'get$').and.returnValue(new BehaviorSubject('test1'));
      await act(async () => {
        component = await mount(
          wrapWithIntl(
            <DataSourceTable
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

    it('should sort datasources based on title', () => {
      expect(component.find(badgeIcon).exists()).toBe(true);
      expect(component.find(tableIdentifier).exists()).toBe(true);
      act(() => {
        component.find(tableColumnHeaderButtonIdentifier).first().simulate('click');
      });
      component.update();
      // @ts-ignore
      expect(component.find(tableColumnHeaderIdentifier).at(1).props().isSorted).toBe(true);
      expect(uiSettings.get).toHaveBeenCalled();
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

  describe('should not manage datasources when canManageDataSource is false', () => {
    const mockedContextWithFalseManage = {
      ...mockManagementPlugin.createDataSourceManagementContext(),
      application: { capabilities: { dataSource: { canManage: false } } },
    };
    beforeEach(async () => {
      spyOn(utils, 'getDataSources').and.returnValue(Promise.reject());
      await act(async () => {
        component = await mount(
          wrapWithIntl(
            <DataSourceTable
              history={history}
              location={({} as unknown) as RouteComponentProps['location']}
              match={({} as unknown) as RouteComponentProps['match']}
            />
          ),
          {
            wrappingComponent: OpenSearchDashboardsContextProvider,
            wrappingComponentProps: {
              services: mockedContextWithFalseManage,
            },
          }
        );
      });
      component.update();
    });
    test('should render empty table', () => {
      expect(component).toMatchSnapshot();
      expect(component.find(emptyStateIdentifier).exists()).toBe(true);
    });
  });

  describe('data source table with actions', () => {
    beforeEach(() => {
      spyOn(utils, 'getDataSources').and.returnValue(Promise.resolve(getMappedDataSources));
      spyOn(uiSettings, 'get$').and.returnValue(new BehaviorSubject('test1'));
    });

    test('should display set as default action', async () => {
      const currentWorkspace$ = mockedContext.workspaces.currentWorkspace$;
      // Mock that there is current workspace
      mockedContext.workspaces.currentWorkspace$ = new BehaviorSubject<WorkspaceObject | null>({
        id: 'workspace-id',
        name: 'workspace name',
      });

      await act(async () => {
        component = mount(
          wrapWithIntl(
            <DataSourceTable
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

      // The set as default action button should be displayed when inside a workspace
      expect(
        component
          .find('[data-test-subj="dataSourcesManagement-dataSourceTable-setAsDefaultButton"]')
          .exists()
      ).toBe(true);

      // click setAsDefault button should set the data source as default
      component
        .find('[data-test-subj="dataSourcesManagement-dataSourceTable-setAsDefaultButton"]')
        .first()
        .simulate('click');
      expect(uiSettings.set).toBeCalledWith(
        DEFAULT_DATA_SOURCE_UI_SETTINGS_ID,
        'alpha-test',
        'workspace'
      );

      // reset to original value
      mockedContext.workspaces.currentWorkspace$ = currentWorkspace$;
    });

    test('should NOT display set as default action', async () => {
      const currentWorkspace$ = mockedContext.workspaces.currentWorkspace$;
      // Mock that there is NO current workspace
      mockedContext.workspaces.currentWorkspace$ = new BehaviorSubject<WorkspaceObject | null>(
        null
      );

      await act(async () => {
        component = mount(
          wrapWithIntl(
            <DataSourceTable
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

      // The set as default action button should NOT be displayed when outside of workspace
      expect(
        component
          .find('[data-test-subj="dataSourcesManagement-dataSourceTable-setAsDefaultButton"]')
          .exists()
      ).toBe(false);

      // reset to original value
      mockedContext.workspaces.currentWorkspace$ = currentWorkspace$;
    });

    test('should display dissociate action', async () => {
      const currentWorkspace$ = mockedContext.workspaces.currentWorkspace$;
      const capabilities = mockedContext.application.capabilities;
      // Mock that there is current workspace
      mockedContext.workspaces.currentWorkspace$ = new BehaviorSubject<WorkspaceObject | null>({
        id: 'workspace-id',
        name: 'workspace name',
      });
      // Mock that the current user is dashboard admin
      mockedContext.application.capabilities = {
        ...capabilities,
        dashboards: { isDashboardAdmin: true },
      };

      await act(async () => {
        component = mount(
          wrapWithIntl(
            <DataSourceTable
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

      // The dissociate data source action should be displayed
      expect(
        component
          .find('[data-test-subj="dataSourcesManagement-dataSourceTable-dissociateButton"]')
          .exists()
      ).toBe(true);

      // reset to original value
      mockedContext.workspaces.currentWorkspace$ = currentWorkspace$;
      mockedContext.application.capabilities = capabilities;
    });

    test('should NOT display dissociate action for non dashboard admin', async () => {
      const currentWorkspace$ = mockedContext.workspaces.currentWorkspace$;
      const capabilities = mockedContext.application.capabilities;
      // Mock that there is current workspace
      mockedContext.workspaces.currentWorkspace$ = new BehaviorSubject<WorkspaceObject | null>({
        id: 'workspace-id',
        name: 'workspace name',
      });
      // Mock that the current user is not dashboard admin
      mockedContext.application.capabilities = {
        ...capabilities,
        dashboards: { isDashboardAdmin: false },
      };

      await act(async () => {
        component = mount(
          wrapWithIntl(
            <DataSourceTable
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

      // The dissociate data source action should not be displayed for non-admin user
      expect(
        component
          .find('[data-test-subj="dataSourcesManagement-dataSourceTable-dissociateButton"]')
          .exists()
      ).toBe(false);

      // reset to original value
      mockedContext.workspaces.currentWorkspace$ = currentWorkspace$;
      mockedContext.application.capabilities = capabilities;
    });

    test('should NOT display dissociate action if not in a workspace', async () => {
      const currentWorkspace$ = mockedContext.workspaces.currentWorkspace$;
      const capabilities = mockedContext.application.capabilities;
      // Mock that there is no current workspace
      mockedContext.workspaces.currentWorkspace$ = new BehaviorSubject<WorkspaceObject | null>(
        null
      );
      // Mock that the current user is dashboard admin
      mockedContext.application.capabilities = {
        ...capabilities,
        dashboards: { isDashboardAdmin: true },
      };

      await act(async () => {
        component = mount(
          wrapWithIntl(
            <DataSourceTable
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

      // The dissociate data source action should not be display when not inside a workspace
      expect(
        component
          .find('[data-test-subj="dataSourcesManagement-dataSourceTable-dissociateButton"]')
          .exists()
      ).toBe(false);

      // reset to original value
      mockedContext.workspaces.currentWorkspace$ = currentWorkspace$;
      mockedContext.application.capabilities = capabilities;
    });
  });

  describe('should handle datasources with empty description correctly', () => {
    beforeEach(async () => {
      spyOn(utils, 'getDataSources').and.returnValue(
        Promise.resolve(getMappedDataSourcesWithEmptyDescription)
      );
      spyOn(uiSettings, 'get$').and.returnValue(new BehaviorSubject('test1'));
      await act(async () => {
        component = await mount(
          wrapWithIntl(
            <DataSourceTable
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
      expect(() => component).not.toThrow();
      expect(component).toMatchSnapshot();
      expect(utils.getDataSources).toHaveBeenCalled();

      // assertion for three row and description placeholder to be visible
      expect(component.find('.euiTableRow')).toHaveLength(3);
      const descriptionPlaceholders = component.find('.euiText');
      expect(descriptionPlaceholders).toHaveLength(6); // since both description and related connections have no values
      descriptionPlaceholders.forEach((node) => {
        expect(node.children().text()).toBe('—');
      });
    });
  });

  describe('should handle opensearch remote clusters', () => {
    beforeEach(async () => {
      spyOn(utils, 'getDataSources').and.returnValue(
        Promise.resolve(getDataSourcesWithCrossClusterConnections)
      );
      spyOn(utils, 'fetchDataSourceConnections').and.returnValue(
        Promise.resolve(getDataSourcesWithCrossClusterConnections)
      );
      await act(async () => {
        component = await mount(
          wrapWithIntl(
            <DataSourceTable
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

    it('should show a arrow which expands to show connected remote clusters for datasources with remote clusters', () => {
      expect(component.find('[data-test-subj="expandCollapseButton"]').exists()).toBe(true);

      // validate that we are initially not able to see the remote clusters
      expect(component.text()).not.toContain('connectionAlias1');

      // click the expand button corresponding to the datasource containing remote clusters
      component.find('[data-test-subj="expandCollapseButton"]').first().simulate('click');

      // validate that we are now able to see the remote clusters
      expect(component.text()).toContain('connectionAlias1');
    });
  });
});
