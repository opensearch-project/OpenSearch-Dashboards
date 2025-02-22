/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import {
  extractExportDetailsMock,
  fetchExportByTypeAndSearchMock,
  fetchExportObjectsMock,
  findObjectsMock,
  getRelationshipsMock,
  getSavedObjectCountsMock,
  saveAsMock,
} from './saved_objects_table.test.mocks';

import React from 'react';
import { Query } from '@elastic/eui';
import { waitFor } from '@testing-library/dom';
import { ShallowWrapper } from 'enzyme';
import { shallowWithI18nProvider } from 'test_utils/enzyme_helpers';
import {
  httpServiceMock,
  overlayServiceMock,
  notificationServiceMock,
  savedObjectsServiceMock,
  applicationServiceMock,
  workspacesServiceMock,
} from '../../../../../core/public/mocks';
import { dataPluginMock } from '../../../../data/public/mocks';
import { serviceRegistryMock } from '../../services/service_registry.mock';
import { actionServiceMock } from '../../services/action_service.mock';
import { columnServiceMock } from '../../services/column_service.mock';
import { namespaceServiceMock } from '../../services/namespace_service.mock';
import {
  SavedObjectsTable,
  SavedObjectsTableProps,
  SavedObjectsTableState,
} from './saved_objects_table';
import { Flyout, Relationships } from './components';
import { SavedObjectWithMetadata } from '../../types';
import { WorkspaceObject } from 'opensearch-dashboards/public';
import { TableProps } from './components/table';

const allowedTypes = ['index-pattern', 'visualization', 'dashboard', 'search'];

const allSavedObjects = [
  {
    id: '1',
    type: 'index-pattern',
    attributes: {
      title: `MyIndexPattern*`,
    },
  },
  {
    id: '2',
    type: 'search',
    attributes: {
      title: `MySearch`,
    },
  },
  {
    id: '3',
    type: 'dashboard',
    attributes: {
      title: `MyDashboard`,
    },
  },
  {
    id: '4',
    type: 'visualization',
    attributes: {
      title: `MyViz`,
    },
  },
];

describe('SavedObjectsTable', () => {
  let defaultProps: SavedObjectsTableProps;
  let http: ReturnType<typeof httpServiceMock.createStartContract>;
  let overlays: ReturnType<typeof overlayServiceMock.createStartContract>;
  let notifications: ReturnType<typeof notificationServiceMock.createStartContract>;
  let savedObjects: ReturnType<typeof savedObjectsServiceMock.createStartContract>;
  let search: ReturnType<typeof dataPluginMock.createStartContract>['search'];
  let workspaces: ReturnType<typeof workspacesServiceMock.createStartContract>;

  const shallowRender = (overrides: Partial<SavedObjectsTableProps> = {}) => {
    return (shallowWithI18nProvider(
      <SavedObjectsTable {...defaultProps} {...overrides} />
    ) as unknown) as ShallowWrapper<
      SavedObjectsTableProps,
      SavedObjectsTableState,
      SavedObjectsTable
    >;
  };

  beforeEach(() => {
    extractExportDetailsMock.mockReset();

    http = httpServiceMock.createStartContract();
    overlays = overlayServiceMock.createStartContract();
    notifications = notificationServiceMock.createStartContract();
    savedObjects = savedObjectsServiceMock.createStartContract();
    search = dataPluginMock.createStartContract().search;
    workspaces = workspacesServiceMock.createStartContract();

    const applications = applicationServiceMock.createStartContract();
    applications.capabilities = {
      navLinks: {},
      management: {},
      catalogue: {},
      savedObjectsManagement: {
        read: true,
        edit: false,
        delete: false,
      },
      workspaces: {},
    };

    http.post.mockResolvedValue([]);

    getSavedObjectCountsMock.mockReturnValue({
      type: {
        'index-pattern': 0,
        visualization: 0,
        dashboard: 0,
        search: 0,
      },
    });

    defaultProps = {
      allowedTypes,
      serviceRegistry: serviceRegistryMock.create(),
      actionRegistry: actionServiceMock.createStart(),
      columnRegistry: columnServiceMock.createStart(),
      namespaceRegistry: namespaceServiceMock.createStart(),
      savedObjectsClient: savedObjects.client,
      indexPatterns: dataPluginMock.createStartContract().indexPatterns,
      http,
      overlays,
      notifications,
      applications,
      perPageConfig: 15,
      goInspectObject: () => {},
      canGoInApp: () => true,
      search,
      workspaces,
    };

    findObjectsMock.mockImplementation(() => ({
      total: 4,
      savedObjects: [
        {
          id: '1',
          type: 'index-pattern',
          meta: {
            title: `MyIndexPattern*`,
            icon: 'indexPatternApp',
            editUrl: '#/management/opensearch-dashboards/indexPatterns/patterns/1',
            inAppUrl: {
              path: '/management/opensearch-dashboards/indexPatterns/patterns/1',
              uiCapabilitiesPath: 'management.opensearchDashboards.indexPatterns',
            },
          },
        },
        {
          id: '2',
          type: 'search',
          meta: {
            title: `MySearch`,
            icon: 'search',
            editUrl: '/management/opensearch-dashboards/objects/savedSearches/2',
            inAppUrl: {
              path: '/discover/2',
              uiCapabilitiesPath: 'discover.show',
            },
          },
        },
        {
          id: '3',
          type: 'dashboard',
          meta: {
            title: `MyDashboard`,
            icon: 'dashboardApp',
            editUrl: '/management/opensearch-dashboards/objects/savedDashboards/3',
            inAppUrl: {
              path: '/dashboard/3',
              uiCapabilitiesPath: 'dashboard.show',
            },
          },
        },
        {
          id: '4',
          type: 'visualization',
          meta: {
            title: `MyViz`,
            icon: 'visualizeApp',
            editUrl: '/management/opensearch-dashboards/objects/savedVisualizations/4',
            inAppUrl: {
              path: '/edit/4',
              uiCapabilitiesPath: 'visualize.show',
            },
          },
        },
      ],
    }));
  });

  it('should render normally', async () => {
    const component = shallowRender({ perPageConfig: 15 });

    // Ensure all promises resolve
    await new Promise((resolve) => process.nextTick(resolve));
    // Ensure the state changes are reflected
    component.update();

    expect(component).toMatchSnapshot();
  });

  it('should unmount normally', async () => {
    const component = shallowRender();
    const mockDebouncedFetchObjects = {
      cancel: jest.fn(),
      flush: jest.fn(),
    };
    component.instance().debouncedFetchObjects = mockDebouncedFetchObjects as any;
    // Ensure all promises resolve
    await new Promise((resolve) => process.nextTick(resolve));
    // Ensure the state changes are reflected
    // component.update();

    component.unmount();
    expect(component).toMatchSnapshot();
  });

  it('should add danger toast when find fails', async () => {
    findObjectsMock.mockImplementation(() => {
      throw new Error('Simulated find error');
    });
    const component = shallowRender({ perPageConfig: 15 });

    // Ensure all promises resolve
    await new Promise((resolve) => process.nextTick(resolve));
    // Ensure the state changes are reflected
    component.update();

    expect(notifications.toasts.addDanger).toHaveBeenCalled();
  });

  describe('export', () => {
    it('should export selected objects', async () => {
      const mockSelectedSavedObjects = [
        { id: '1', type: 'index-pattern' },
        { id: '3', type: 'dashboard' },
      ] as SavedObjectWithMetadata[];

      const mockSavedObjects = mockSelectedSavedObjects.map((obj) => ({
        _id: obj.id,
        _type: obj.type,
        _source: {},
      }));

      const mockSavedObjectsClient = {
        ...defaultProps.savedObjectsClient,
        bulkGet: jest.fn().mockImplementation(() => ({
          savedObjects: mockSavedObjects,
        })),
      };

      const component = shallowRender({ savedObjectsClient: mockSavedObjectsClient });

      // Ensure all promises resolve
      await new Promise((resolve) => process.nextTick(resolve));
      // Ensure the state changes are reflected
      component.update();

      // Set some as selected
      component.instance().onSelectionChanged(mockSelectedSavedObjects);

      await component.instance().onExport(true);

      expect(fetchExportObjectsMock).toHaveBeenCalledWith(http, mockSelectedSavedObjects, true);
      expect(notifications.toasts.addSuccess).toHaveBeenCalledWith({
        title: 'Your file is downloading in the background',
      });
    });

    it('should display a warning is export contains missing references', async () => {
      const mockSelectedSavedObjects = [
        { id: '1', type: 'index-pattern' },
        { id: '3', type: 'dashboard' },
      ] as SavedObjectWithMetadata[];

      const mockSavedObjects = mockSelectedSavedObjects.map((obj) => ({
        _id: obj.id,
        _type: obj.type,
        _source: {},
      }));

      const mockSavedObjectsClient = {
        ...defaultProps.savedObjectsClient,
        bulkGet: jest.fn().mockImplementation(() => ({
          savedObjects: mockSavedObjects,
        })),
      };

      extractExportDetailsMock.mockImplementation(() => ({
        exportedCount: 2,
        missingRefCount: 1,
        missingReferences: [{ id: '7', type: 'visualisation' }],
      }));

      const component = shallowRender({ savedObjectsClient: mockSavedObjectsClient });

      // Ensure all promises resolve
      await new Promise((resolve) => process.nextTick(resolve));
      // Ensure the state changes are reflected
      component.update();

      // Set some as selected
      component.instance().onSelectionChanged(mockSelectedSavedObjects);

      await component.instance().onExport(true);

      expect(fetchExportObjectsMock).toHaveBeenCalledWith(http, mockSelectedSavedObjects, true);
      expect(notifications.toasts.addWarning).toHaveBeenCalledWith({
        title:
          'Your file is downloading in the background. ' +
          'Some related objects could not be found. ' +
          'Please see the last line in the exported file for a list of missing objects.',
      });
    });

    it('should allow the user to choose when exporting all', async () => {
      const component = shallowRender();

      // Ensure all promises resolve
      await new Promise((resolve) => process.nextTick(resolve));
      // Ensure the state changes are reflected
      component.update();

      (component.find('Header') as any).prop('onExportAll')();
      component.update();

      expect(component.find('EuiModal')).toMatchSnapshot();
    });

    it('should export all', async () => {
      const component = shallowRender();

      // Ensure all promises resolve
      await new Promise((resolve) => process.nextTick(resolve));
      // Ensure the state changes are reflected
      component.update();

      // Set up mocks
      const blob = new Blob([JSON.stringify(allSavedObjects)], { type: 'application/ndjson' });
      fetchExportByTypeAndSearchMock.mockImplementation(() => blob);

      await component.instance().onExportAll();

      expect(fetchExportByTypeAndSearchMock).toHaveBeenCalledWith(
        http,
        allowedTypes,
        undefined,
        true,
        undefined
      );
      expect(saveAsMock).toHaveBeenCalledWith(blob, 'export.ndjson');
      expect(notifications.toasts.addSuccess).toHaveBeenCalledWith({
        title: 'Your file is downloading in the background',
      });
    });

    it('should export all, accounting for the current search criteria', async () => {
      const component = shallowRender();

      component.instance().onQueryChange({
        query: Query.parse('test'),
      });

      // Ensure all promises resolve
      await new Promise((resolve) => process.nextTick(resolve));
      // Ensure the state changes are reflected
      component.update();

      // Set up mocks
      const blob = new Blob([JSON.stringify(allSavedObjects)], { type: 'application/ndjson' });
      fetchExportByTypeAndSearchMock.mockImplementation(() => blob);

      await component.instance().onExportAll();

      expect(fetchExportByTypeAndSearchMock).toHaveBeenCalledWith(
        http,
        allowedTypes,
        'test*',
        true,
        undefined
      );
      expect(saveAsMock).toHaveBeenCalledWith(blob, 'export.ndjson');
      expect(notifications.toasts.addSuccess).toHaveBeenCalledWith({
        title: 'Your file is downloading in the background',
      });
    });

    it('should export all, accounting for the current workspace criteria', async () => {
      const workspaceList: WorkspaceObject[] = [
        {
          id: 'workspace1',
          name: 'foo',
        },
      ];
      workspaces.workspaceList$.next(workspaceList);
      const component = shallowRender({ workspaces });

      component.instance().onQueryChange({
        query: Query.parse(`test workspaces:("foo")`),
      });

      // Ensure all promises resolve
      await new Promise((resolve) => process.nextTick(resolve));
      // Ensure the state changes are reflected
      component.update();

      // Set up mocks
      const blob = new Blob([JSON.stringify(allSavedObjects)], { type: 'application/ndjson' });
      fetchExportByTypeAndSearchMock.mockImplementation(() => blob);

      await component.instance().onExportAll();

      expect(fetchExportByTypeAndSearchMock).toHaveBeenCalledWith(
        http,
        allowedTypes,
        'test*',
        true,
        ['workspace1']
      );
      expect(saveAsMock).toHaveBeenCalledWith(blob, 'export.ndjson');
      expect(notifications.toasts.addSuccess).toHaveBeenCalledWith({
        title: 'Your file is downloading in the background',
      });
    });
  });

  describe('import', () => {
    it('should show the flyout', async () => {
      const component = shallowRender();

      // Ensure all promises resolve
      await new Promise((resolve) => process.nextTick(resolve));
      // Ensure the state changes are reflected
      component.update();

      component.instance().showImportFlyout();
      component.update();

      expect(component.find(Flyout).length).toBe(1);
    });

    it('should hide the flyout', async () => {
      const component = shallowRender();

      // Ensure all promises resolve
      await new Promise((resolve) => process.nextTick(resolve));
      // Ensure the state changes are reflected
      component.update();

      component.instance().hideImportFlyout();
      component.update();

      expect(component.find(Flyout).length).toBe(0);
    });
  });

  describe('relationships', () => {
    it('should fetch relationships', async () => {
      const component = shallowRender();

      // Ensure all promises resolve
      await new Promise((resolve) => process.nextTick(resolve));
      // Ensure the state changes are reflected
      component.update();

      await component.instance().getRelationships('search', '1');
      const savedObjectTypes = ['index-pattern', 'visualization', 'dashboard', 'search'];
      expect(getRelationshipsMock).toHaveBeenCalledWith(http, 'search', '1', savedObjectTypes);
    });

    it('should show the flyout', async () => {
      const component = shallowRender();

      // Ensure all promises resolve
      await new Promise((resolve) => process.nextTick(resolve));
      // Ensure the state changes are reflected
      component.update();

      component.instance().onShowRelationships({
        id: '2',
        type: 'search',
        meta: {
          title: `MySearch`,
          icon: 'search',
          editUrl: '/management/opensearch-dashboards/objects/savedSearches/2',
          inAppUrl: {
            path: '/discover/2',
            uiCapabilitiesPath: 'discover.show',
          },
        },
      } as SavedObjectWithMetadata);
      component.update();

      expect(component.find(Relationships).length).toBe(1);
      expect(component.state('relationshipObject')).toEqual({
        id: '2',
        type: 'search',
        meta: {
          title: 'MySearch',
          editUrl: '/management/opensearch-dashboards/objects/savedSearches/2',
          icon: 'search',
          inAppUrl: {
            path: '/discover/2',
            uiCapabilitiesPath: 'discover.show',
          },
        },
      });
    });

    it('should hide the flyout', async () => {
      const component = shallowRender();

      // Ensure all promises resolve
      await new Promise((resolve) => process.nextTick(resolve));
      // Ensure the state changes are reflected
      component.update();

      component.instance().onHideRelationships();
      component.update();

      expect(component.find(Relationships).length).toBe(0);
      expect(component.state('relationshipId')).toBe(undefined);
      expect(component.state('relationshipType')).toBe(undefined);
      expect(component.state('relationshipTitle')).toBe(undefined);
    });
  });

  describe('delete', () => {
    it('should show a confirm modal with correct icons and tooltips', async () => {
      const mockGetSavedObjectLabel = jest.fn((type) => {
        switch (type) {
          case 'index-pattern':
          case 'index-patterns':
          case 'indexPatterns':
            return 'index patterns';
          default:
            return type;
        }
      });
      const component = shallowRender();

      const mockSelectedSavedObjects = [
        { id: '1', type: 'config', meta: { icon: 'configApp' } },
        { id: '3', type: 'dashboard', meta: { icon: 'dashboardApp' } },
      ] as SavedObjectWithMetadata[];

      // Ensure all promises resolve
      await new Promise((resolve) => process.nextTick(resolve));
      // Ensure the state changes are reflected
      component.update();

      // Set some as selected
      component.instance().onSelectionChanged(mockSelectedSavedObjects);
      await component.instance().onDelete();
      component.update();

      expect(component.find('EuiModal')).toMatchSnapshot();
      expect(component.find('EuiModalHeader')).toMatchSnapshot();
      expect(component.find('EuiModalFooter')).toMatchSnapshot();
      expect(component.find('Delete assets')).toMatchSnapshot();

      const table = component.find('EuiInMemoryTable');
      const columns = table.prop('columns');

      const typeField = columns.find((col) => col.field === 'type');
      mockSelectedSavedObjects.forEach((savedObject) => {
        const renderedContent = typeField.render(savedObject.type, savedObject);
        expect(component.find('EuiToolTip')).toMatchSnapshot();
        expect(renderedContent.props.content).toBe(mockGetSavedObjectLabel(savedObject.type));
        const iconElement = renderedContent.props.children;
        expect(component.find('EuiIcon')).toMatchSnapshot();
        expect(iconElement.props.type).toBe(savedObject.meta.icon || 'apps');
      });
    });

    it('should delete selected objects', async () => {
      const mockSelectedSavedObjects = [
        { id: '1', type: 'index-pattern' },
        { id: '3', type: 'dashboard' },
      ] as SavedObjectWithMetadata[];

      const mockSavedObjects = mockSelectedSavedObjects.map((obj) => ({
        id: obj.id,
        type: obj.type,
        source: {},
      }));

      const mockSavedObjectsClient = {
        ...defaultProps.savedObjectsClient,
        bulkGet: jest.fn().mockImplementation(() => ({
          savedObjects: mockSavedObjects,
        })),
        delete: jest.fn(),
      };

      const component = shallowRender({ savedObjectsClient: mockSavedObjectsClient });

      // Ensure all promises resolve
      await new Promise((resolve) => process.nextTick(resolve));
      // Ensure the state changes are reflected
      component.update();

      // Set some as selected
      component.instance().onSelectionChanged(mockSelectedSavedObjects);
      await component.instance().onDelete();
      component.update();
      expect(component.state('isShowingDeleteConfirmModal')).toBe(true);

      await component.instance().delete();

      expect(defaultProps.indexPatterns.clearCache).toHaveBeenCalled();
      expect(mockSavedObjectsClient.bulkGet).toHaveBeenCalledWith(mockSelectedSavedObjects);
      expect(mockSavedObjectsClient.delete).toHaveBeenCalledWith(
        mockSavedObjects[0].type,
        mockSavedObjects[0].id,
        { force: true }
      );
      expect(mockSavedObjectsClient.delete).toHaveBeenCalledWith(
        mockSavedObjects[1].type,
        mockSavedObjects[1].id,
        { force: true }
      );
      expect(component.state('selectedSavedObjects').length).toBe(0);
      expect(notifications.toasts.addDanger).not.toHaveBeenCalled();
      expect(component.state('isDeleting')).toBe(false);
      expect(component.state('isShowingDeleteConfirmModal')).toBe(false);
    });

    it('should show error toast when failing to delete saved objects', async () => {
      const mockSelectedSavedObjects = [
        { id: '1', type: 'index-pattern' },
      ] as SavedObjectWithMetadata[];

      const mockSavedObjects = mockSelectedSavedObjects.map((obj) => ({
        id: obj.id,
        type: obj.type,
        source: {},
      }));

      const mockSavedObjectsClient = {
        ...defaultProps.savedObjectsClient,
        bulkGet: jest.fn().mockImplementation(() => ({
          savedObjects: mockSavedObjects,
        })),
        delete: jest.fn().mockImplementation(() => {
          throw new Error('Unable to delete saved objects');
        }),
      };

      const component = shallowRender({ savedObjectsClient: mockSavedObjectsClient });

      // Ensure all promises resolve
      await new Promise((resolve) => process.nextTick(resolve));
      // Ensure the state changes are reflected
      component.update();

      // Set some as selected
      component.instance().onSelectionChanged(mockSelectedSavedObjects);
      await component.instance().onDelete();
      component.update();
      expect(component.state('isShowingDeleteConfirmModal')).toBe(true);
      expect(component.find('EuiModal')).toMatchSnapshot();

      await component.instance().delete();
      component.update();
      expect(notifications.toasts.addDanger).toHaveBeenCalled();
      // If user fail to delete the saved objects, the delete modal will continue to display
      expect(component.state('isShowingDeleteConfirmModal')).toBe(true);
      expect(component.find('EuiModal')).toMatchSnapshot();
      expect(component.state('isDeleting')).toBe(false);
    });
  });

  describe('workspace filter', () => {
    it('workspace filter include all visible workspaces when not in any workspace', async () => {
      const applications = applicationServiceMock.createStartContract();
      applications.capabilities = {
        navLinks: {},
        management: {},
        catalogue: {},
        savedObjectsManagement: {
          read: true,
          edit: false,
          delete: false,
        },
        workspaces: {
          enabled: true,
        },
      };

      const workspaceList: WorkspaceObject[] = [
        {
          id: 'workspace1',
          name: 'foo',
        },
        {
          id: 'workspace2',
          name: 'bar',
        },
      ];
      workspaces.workspaceList$.next(workspaceList);
      workspaces.currentWorkspaceId$.next('');
      workspaces.currentWorkspace$.next(null);

      const component = shallowRender({ applications, workspaces });

      // Ensure all promises resolve
      await new Promise((resolve) => process.nextTick(resolve));
      // Ensure the state changes are reflected
      component.update();

      const props = component.find('Table').props() as TableProps;
      const filters = props.filters;
      expect(filters.length).toBe(2);
      expect(filters[0].field).toBe('type');
      expect(filters[1].field).toBe('workspaces');
      expect(filters[1].options.length).toBe(2);
      expect(filters[1].options[0].value).toBe('foo');
      expect(filters[1].options[1].value).toBe('bar');
    });

    it('should hide workspace filter when in a workspace', async () => {
      const applications = applicationServiceMock.createStartContract();
      applications.capabilities = {
        navLinks: {},
        management: {},
        catalogue: {},
        savedObjectsManagement: {
          read: true,
          edit: false,
          delete: false,
        },
        workspaces: {
          enabled: true,
        },
      };

      const workspaceList: WorkspaceObject[] = [
        {
          id: 'workspace1',
          name: 'foo',
        },
        {
          id: 'workspace2',
          name: 'bar',
        },
      ];
      workspaces.workspaceList$.next(workspaceList);
      workspaces.currentWorkspaceId$.next('workspace1');
      workspaces.currentWorkspace$.next(workspaceList[0]);

      const component = shallowRender({ applications, workspaces });

      // Ensure all promises resolve
      await new Promise((resolve) => process.nextTick(resolve));
      // Ensure the state changes are reflected
      component.update();

      const props = component.find('Table').props() as TableProps;
      const filters = props.filters;
      const wsFilter = filters.filter((f) => f.field === 'workspaces');
      expect(wsFilter.length).toBe(0);
    });

    it('current workspace in find options when workspace on', async () => {
      findObjectsMock.mockClear();
      const applications = applicationServiceMock.createStartContract();
      applications.capabilities = {
        navLinks: {},
        management: {},
        catalogue: {},
        savedObjectsManagement: {
          read: true,
          edit: false,
          delete: false,
        },
        workspaces: {
          enabled: true,
        },
      };

      const workspaceList: WorkspaceObject[] = [
        {
          id: 'workspace1',
          name: 'foo',
        },
        {
          id: 'workspace2',
          name: 'bar',
        },
      ];
      workspaces.workspaceList$.next(workspaceList);
      workspaces.currentWorkspaceId$.next('workspace1');
      workspaces.currentWorkspace$.next(workspaceList[0]);

      const component = shallowRender({ applications, workspaces });

      // Ensure all promises resolve
      await new Promise((resolve) => process.nextTick(resolve));
      // Ensure the state changes are reflected
      component.update();

      await waitFor(() => {
        expect(findObjectsMock).toBeCalledWith(
          http,
          expect.objectContaining({
            workspaces: expect.arrayContaining(['workspace1']),
          })
        );
      });
    });

    it('no workspaces in find options when not in any workspace', async () => {
      findObjectsMock.mockClear();
      const applications = applicationServiceMock.createStartContract();
      applications.capabilities = {
        navLinks: {},
        management: {},
        catalogue: {},
        savedObjectsManagement: {
          read: true,
          edit: false,
          delete: false,
        },
        workspaces: {
          enabled: true,
        },
      };

      const workspaceList: WorkspaceObject[] = [
        {
          id: 'workspace1',
          name: 'foo',
        },
        {
          id: 'workspace2',
          name: 'bar',
        },
      ];
      workspaces.workspaceList$.next(workspaceList);

      const component = shallowRender({ applications, workspaces });

      // Ensure all promises resolve
      await new Promise((resolve) => process.nextTick(resolve));
      // Ensure the state changes are reflected
      component.update();

      await waitFor(() => {
        expect(findObjectsMock).toBeCalledWith(
          http,
          expect.not.objectContaining({
            workspaces,
          })
        );
      });
    });
  });

  describe('duplicate', () => {
    const applications = applicationServiceMock.createStartContract();
    applications.capabilities = {
      navLinks: {},
      management: {},
      catalogue: {},
      savedObjectsManagement: {
        read: true,
        edit: false,
        delete: false,
      },
      workspaces: {
        enabled: true,
      },
    };

    const workspaceList: WorkspaceObject[] = [
      {
        id: 'workspace1',
        name: 'foo',
      },
      {
        id: 'workspace2',
        name: 'bar',
      },
    ];

    const mockSelectedSavedObjects = [
      { id: '1', type: 'dashboard', references: [], attributes: [], meta: { title: 'object-1' } },
      { id: '2', type: 'dashboard', references: [], attributes: [], meta: { title: 'object-2' } },
    ] as SavedObjectWithMetadata[];

    beforeEach(() => {
      workspaces.workspaceList$.next(workspaceList);
      workspaces.currentWorkspaceId$.next('workspace1');
      workspaces.currentWorkspace$.next(workspaceList[0]);
    });

    it('should duplicate selected objects', async () => {
      const mockCopy = jest.fn().mockResolvedValue({ success: true });
      workspaces.client$.next({ copy: mockCopy });
      const client = workspaces.client$.getValue();

      const component = shallowRender({ applications, workspaces });
      component.setState({ isShowingDuplicateModal: true });

      // Ensure all promises resolve
      await new Promise((resolve) => process.nextTick(resolve));
      // Ensure the state changes are reflected
      component.update();

      expect(component.state('isShowingDuplicateModal')).toEqual(true);
      expect(component.find('SavedObjectsDuplicateModal').length).toEqual(1);

      await component.instance().onDuplicate(mockSelectedSavedObjects, false, 'workspace2', 'bar');

      expect(client?.copy).toHaveBeenCalledWith(
        [
          { id: '1', type: 'dashboard' },
          { id: '2', type: 'dashboard' },
        ],
        'workspace2',
        false
      );
      component.update();

      expect(component.state('isShowingDuplicateResultFlyout')).toEqual(true);
      expect(component.find('DuplicateResultFlyout').length).toEqual(1);
    });

    it('should duplicate single object', async () => {
      const mockCopy = jest.fn().mockResolvedValue({ success: true });
      workspaces.client$.next({ copy: mockCopy });
      const client = workspaces.client$.getValue();

      const component = shallowRender({ applications, workspaces });
      component.setState({ isShowingDuplicateModal: true });

      // Ensure all promises resolve
      await new Promise((resolve) => process.nextTick(resolve));
      // Ensure the state changes are reflected
      component.update();

      await component
        .instance()
        .onDuplicate([mockSelectedSavedObjects[0]], true, 'workspace2', 'bar');

      expect(client?.copy).toHaveBeenCalledWith(
        [{ id: '1', type: 'dashboard' }],
        'workspace2',
        true
      );
      component.update();

      expect(component.state('isShowingDuplicateResultFlyout')).toEqual(true);
      expect(component.find('DuplicateResultFlyout').length).toEqual(1);
    });

    it('should show result flyout when duplicating success and failure coexist', async () => {
      const mockCopy = jest.fn().mockResolvedValue(() => ({
        success: false,
        successCount: 1,
        successResults: [{ id: '1' }],
        errors: [{ id: '2' }],
      }));
      workspaces.client$.next({ copy: mockCopy });
      const client = workspaces.client$.getValue();
      const component = shallowRender({ applications, workspaces });
      component.setState({ isShowingDuplicateModal: true });

      // Ensure all promises resolve
      await new Promise((resolve) => process.nextTick(resolve));
      // Ensure the state changes are reflected
      component.update();

      await component.instance().onDuplicate(mockSelectedSavedObjects, false, 'workspace2', 'bar');

      expect(client?.copy).toHaveBeenCalledWith(
        [
          { id: '1', type: 'dashboard' },
          { id: '2', type: 'dashboard' },
        ],
        'workspace2',
        false
      );
      component.update();

      expect(component.state('isShowingDuplicateResultFlyout')).toEqual(true);
      expect(component.find('DuplicateResultFlyout').length).toEqual(1);
    });

    it('should catch error when workspace client is null', async () => {
      const component = shallowRender({ applications, workspaces });
      component.setState({ isShowingDuplicateModal: true });
      workspaces.client$.next(null);

      // Ensure all promises resolve
      await new Promise((resolve) => process.nextTick(resolve));
      // Ensure the state changes are reflected
      component.update();
      await component.instance().onDuplicate(mockSelectedSavedObjects, false, 'workspace2', 'bar');
      component.update();

      expect(notifications.toasts.addDanger).toHaveBeenCalledWith({
        title: 'Unable to copy 2 saved objects.',
      });
    });

    it('should show error toast when copy is fail', async () => {
      const component = shallowRender({ applications, workspaces });
      component.setState({ isShowingDuplicateModal: true });

      const mockCopy = jest.fn().mockRejectedValue(() => new Error('Copy operation failed'));
      workspaces.client$.next({ copy: mockCopy });
      const client = workspaces.client$.getValue();

      // Ensure all promises resolve
      await new Promise((resolve) => process.nextTick(resolve));
      // Ensure the state changes are reflected
      component.update();

      await component.instance().onDuplicate(mockSelectedSavedObjects, false, 'workspace2', 'bar');

      expect(client?.copy).toHaveBeenCalledWith(
        [
          { id: '1', type: 'dashboard' },
          { id: '2', type: 'dashboard' },
        ],
        'workspace2',
        false
      );
      component.update();

      expect(notifications.toasts.addDanger).toHaveBeenCalledWith({
        title: 'Unable to copy 2 saved objects.',
      });
    });

    it('should allow the user to choose on header when duplicating all', async () => {
      const component = shallowRender({ applications, workspaces });

      // Ensure all promises resolve
      await new Promise((resolve) => process.nextTick(resolve));
      // Ensure the state changes are reflected
      component.update();

      const header = component.find('Header') as any;
      expect(header.prop('showDuplicateAll')).toEqual(true);
      header.prop('onDuplicate')();

      await new Promise((resolve) => process.nextTick(resolve));
      component.update();

      expect(component.state('isShowingDuplicateModal')).toEqual(true);
      expect(component.find('SavedObjectsDuplicateModal')).toMatchSnapshot();
    });

    it('should allow the user to choose on table when duplicating all', async () => {
      const component = shallowRender({ applications, workspaces });

      // Ensure all promises resolve
      await new Promise((resolve) => process.nextTick(resolve));
      // Ensure the state changes are reflected
      component.update();

      const table = component.find('Table') as any;
      table.prop('onDuplicate')();
      component.update();

      expect(component.state('isShowingDuplicateModal')).toEqual(true);
      expect(component.find('SavedObjectsDuplicateModal')).toMatchSnapshot();
    });

    it('should allow the user to choose on table when duplicating single', async () => {
      const component = shallowRender({ applications, workspaces });

      // Ensure all promises resolve
      await new Promise((resolve) => process.nextTick(resolve));
      // Ensure the state changes are reflected
      component.update();

      const table = component.find('Table') as any;
      table.prop('onDuplicateSingle')([{ id: '1', type: 'dashboard', workspaces: ['workspace1'] }]);
      component.update();

      expect(component.state('isShowingDuplicateModal')).toEqual(true);
      expect(component.find('SavedObjectsDuplicateModal')).toMatchSnapshot();
    });
  });
});
