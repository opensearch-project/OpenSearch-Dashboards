/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { BehaviorSubject } from 'rxjs';
import { PublicAppInfo, WorkspaceObject } from 'opensearch-dashboards/public';
import { coreMock } from '../../../../../core/public/mocks';
import { createOpenSearchDashboardsReactContext } from '../../../../opensearch_dashboards_react/public';
import { createMockedRegisteredUseCases$ } from '../../mocks';
import { WorkspaceDetail } from './workspace_detail';
import { WorkspaceFormProvider, WorkspaceOperationType } from '../workspace_form';
import { MemoryRouter } from 'react-router-dom';

// all applications
const PublicAPPInfoMap = new Map([
  ['alerting', { id: 'alerting', title: 'alerting' }],
  ['home', { id: 'home', title: 'home' }],
]);

const mockCoreStart = coreMock.createStart();

const workspaceObject = {
  id: 'foo_id',
  name: 'foo',
  description: 'this is my foo workspace description',
  features: ['use-case-observability', 'workspace_detail'],
  color: '',
  reserved: false,
  permissions: { write: { users: ['user1', 'user2'] } },
};

const defaultValues = {
  id: workspaceObject.id,
  name: workspaceObject.name,
  description: workspaceObject.description,
  features: workspaceObject.features,
  color: workspaceObject.color,
  permissionSettings: [
    {
      id: 0,
      type: 'user',
      userId: 'user1',
      modes: ['library_write', 'write'],
    },
    {
      id: 1,
      type: 'user2',
      group: '',
      modes: ['library_write', 'write'],
    },
  ],
  selectedDataSources: [
    {
      id: 'ds-1',
      title: 'ds-1-title',
      description: 'ds-1-description',
      dataSourceEngineType: 'OpenSearch',
    },
  ],
};

const createWorkspacesSetupContractMockWithValue = (workspace?: WorkspaceObject) => {
  const currentWorkspace = workspace ? workspace : workspaceObject;
  const currentWorkspaceId$ = new BehaviorSubject<string>(currentWorkspace.id);
  const workspaceList$ = new BehaviorSubject<WorkspaceObject[]>([currentWorkspace]);
  const currentWorkspace$ = new BehaviorSubject<WorkspaceObject | null>(currentWorkspace);
  const initialized$ = new BehaviorSubject<boolean>(true);
  return {
    currentWorkspaceId$,
    workspaceList$,
    currentWorkspace$,
    initialized$,
  };
};

const deleteFn = jest.fn().mockReturnValue({
  success: true,
});

const WorkspaceDetailPage = (props: any) => {
  const workspacesService = props.workspacesService || createWorkspacesSetupContractMockWithValue();
  const values = props.defaultValues || defaultValues;
  const permissionEnabled = props.permissionEnabled ?? true;
  const dataSourceManagement =
    props.dataSourceEnabled !== false
      ? {
          ui: {
            getDataSourceMenu: jest.fn(),
          },
        }
      : undefined;

  const { Provider } = createOpenSearchDashboardsReactContext({
    ...mockCoreStart,
    ...{
      application: {
        ...mockCoreStart.application,
        applications$: new BehaviorSubject<Map<string, PublicAppInfo>>(PublicAPPInfoMap as any),
        capabilities: {
          ...mockCoreStart.application.capabilities,
          workspaces: {
            permissionEnabled,
          },
          dashboards: { isDashboardAdmin: true },
        },
      },
      workspaces: workspacesService,
      savedObjects: {
        ...mockCoreStart.savedObjects,
        client: {
          ...mockCoreStart.savedObjects.client,
          find: jest.fn().mockResolvedValue({
            savedObjects: [],
          }),
          delete: deleteFn,
        },
      },
      dataSourceManagement,
      navigationUI: {
        HeaderControl: ({ controls }) => {
          if (props.showDeleteModal) {
            controls?.[0]?.run?.();
          }
          return null;
        },
      },
    },
  });

  const registeredUseCases$ = createMockedRegisteredUseCases$();

  return (
    <MemoryRouter>
      <WorkspaceFormProvider
        application={mockCoreStart.application}
        savedObjects={mockCoreStart.savedObjects}
        operationType={WorkspaceOperationType.Update}
        permissionEnabled={true}
        onSubmit={jest.fn()}
        defaultValues={values}
        availableUseCases={[]}
      >
        <Provider>
          <WorkspaceDetail registeredUseCases$={registeredUseCases$} {...props} />
        </Provider>
      </WorkspaceFormProvider>
    </MemoryRouter>
  );
};

describe('WorkspaceDetail', () => {
  let mockHistoryPush: jest.Mock;
  let mockLocation: Partial<Location>;
  beforeEach(() => {
    mockHistoryPush = jest.fn();
    mockLocation = {
      pathname: '/current-path',
      search: '',
      hash: '',
    };

    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useHistory: jest.fn().mockReturnValue({
        push: mockHistoryPush,
        location: mockLocation,
      }),
      useLocation: jest.fn().mockReturnValue(mockLocation),
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('render workspace detail page normally', async () => {
    const { container } = render(WorkspaceDetailPage({}));
    expect(container).toMatchSnapshot();
  });

  it('default selected tab is Details', async () => {
    const workspaceService = createWorkspacesSetupContractMockWithValue(workspaceObject);
    render(WorkspaceDetailPage({ workspacesService: workspaceService }));
    expect(document.querySelector('#details')).toHaveClass('euiTab-isSelected');
    expect(screen.queryByTestId('workspaceTabs')).not.toBeNull();
  });

  it('click on Collaborators tab when permission control enabled', async () => {
    const workspaceService = createWorkspacesSetupContractMockWithValue(workspaceObject);
    const { getByText } = render(WorkspaceDetailPage({ workspacesService: workspaceService }));
    fireEvent.click(getByText('Collaborators'));
    expect(document.querySelector('#collaborators')).toHaveClass('euiTab-isSelected');
  });

  it('click on Data Sources tab when dataSource enabled', async () => {
    const workspaceService = createWorkspacesSetupContractMockWithValue(workspaceObject);
    const { getByText } = render(WorkspaceDetailPage({ workspacesService: workspaceService }));
    fireEvent.click(getByText('Data Sources'));
    expect(document.querySelector('#dataSources')).toHaveClass('euiTab-isSelected');
  });

  it('delete button will been shown at page header', async () => {
    const workspaceService = createWorkspacesSetupContractMockWithValue(workspaceObject);
    const { getByText, getByTestId } = render(
      WorkspaceDetailPage({
        workspacesService: workspaceService,
        showDeleteModal: true,
      })
    );
    expect(getByText('Delete workspace')).toBeInTheDocument();
    const input = getByTestId('delete-workspace-modal-input');
    fireEvent.change(input, {
      target: { value: 'delete' },
    });
    const confirmButton = getByTestId('delete-workspace-modal-confirm');
    fireEvent.click(confirmButton);
  });

  it('click on Collaborators tab when permission control and dataSource disabled', async () => {
    const workspaceService = createWorkspacesSetupContractMockWithValue(workspaceObject);
    const { queryByText } = render(
      WorkspaceDetailPage({
        workspacesService: workspaceService,
        permissionEnabled: false,
        dataSourceEnabled: false,
      })
    );
    expect(queryByText('Collaborators')).toBeNull();
    expect(queryByText('Data Sources')).toBeNull();
  });

  it('click on tab button will show navigate modal when number of changes > 1', async () => {
    const workspaceService = createWorkspacesSetupContractMockWithValue(workspaceObject);
    const { getByText, getByTestId, queryByText } = render(
      WorkspaceDetailPage({ workspacesService: workspaceService })
    );
    fireEvent.click(getByText('Edit'));
    expect(getByTestId('workspaceForm-workspaceDetails-discardChanges')).toBeInTheDocument();
    const input = getByTestId('workspaceForm-workspaceDetails-nameInputText');
    fireEvent.change(input, {
      target: { value: 'newName' },
    });
    fireEvent.click(getByText('Collaborators'));
    expect(getByText('Any unsaved changes will be lost.')).toBeInTheDocument();
    fireEvent.click(getByText('Cancel'));
    expect(queryByText('Any unsaved changes will be lost.')).toBeNull();
    fireEvent.click(getByText('Collaborators'));
    const button = getByText('Navigate away');
    fireEvent.click(button);
    expect(document.querySelector('#collaborators')).toHaveClass('euiTab-isSelected');
  });

  it('click on badge button will navigate to Collaborators tab when number of changes > 0', async () => {
    const workspaceService = createWorkspacesSetupContractMockWithValue(workspaceObject);
    const { getByText, getByTestId } = render(
      WorkspaceDetailPage({ workspacesService: workspaceService })
    );
    expect(getByText('+1 more')).toBeInTheDocument();

    fireEvent.click(getByText('Edit'));
    expect(getByTestId('workspaceForm-workspaceDetails-discardChanges')).toBeInTheDocument();
    const input = getByTestId('workspaceForm-workspaceDetails-nameInputText');
    fireEvent.change(input, {
      target: { value: 'newName' },
    });

    fireEvent.click(getByText('+1 more'));
    expect(getByText('Any unsaved changes will be lost.')).toBeInTheDocument();

    fireEvent.click(getByText('Navigate away'));
    expect(document.querySelector('#collaborators')).toHaveClass('euiTab-isSelected');
  });

  it('click on badge button will navigate to Collaborators tab when number of changes = 0', async () => {
    const workspaceService = createWorkspacesSetupContractMockWithValue(workspaceObject);
    const { getByText } = render(WorkspaceDetailPage({ workspacesService: workspaceService }));
    expect(getByText('+1 more')).toBeInTheDocument();
    fireEvent.click(getByText('+1 more'));
    expect(document.querySelector('#collaborators')).toHaveClass('euiTab-isSelected');
  });

  it('will not render xss content', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    const workspaceService = createWorkspacesSetupContractMockWithValue();
    const { getByTestId } = render(
      WorkspaceDetailPage({
        workspacesService: workspaceService,
        defaultValues: { ...defaultValues, description: '<script>alert("description")</script>' },
      })
    );
    expect(getByTestId('workspaceForm-workspaceDetails-descriptionInputText').value).toEqual(
      '<script>alert("description")</script>'
    );
    expect(alertSpy).toBeCalledTimes(0);
    alertSpy.mockRestore();
  });
});
