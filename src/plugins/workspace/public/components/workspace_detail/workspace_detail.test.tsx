/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, waitFor } from '@testing-library/react';
import React from 'react';
import { BehaviorSubject } from 'rxjs';
import { MemoryRouter } from 'react-router-dom';
import { WorkspaceObject } from 'opensearch-dashboards/public';
import { coreMock, workspacesServiceMock } from '../../../../../core/public/mocks';
import { createOpenSearchDashboardsReactContext } from '../../../../opensearch_dashboards_react/public';
import { createMockedRegisteredUseCases$ } from '../../mocks';
import { WorkspaceDetail } from './workspace_detail';
import { WorkspaceFormProvider, WorkspaceOperationType } from '../workspace_form';
import { DataSourceConnectionType } from '../../../common/types';
import { IntlProvider } from 'react-intl';
import { DEFAULT_WORKSPACE } from '../../../common/constants';

const mockCoreStart = coreMock.createStart();

const workspaceObject = {
  id: 'foo_id',
  name: 'foo',
  description: 'this is my foo workspace description',
  features: ['use-case-observability', 'workspace_detail'],
  color: '#54B399',
  reserved: false,
  lastUpdatedTime: '1000',
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
  selectedDataSourceConnections: [
    {
      id: 'ds-1',
      name: 'ds-1-title',
      description: 'ds-1-description',
      type: 'OpenSearch',
      connectionType: DataSourceConnectionType.OpenSearchConnection,
    },
  ],
};

const createWorkspacesSetupContractMockWithValue = () => {
  const currentWorkspaceId$ = new BehaviorSubject<string>(workspaceObject.id);
  const workspaceList$ = new BehaviorSubject<WorkspaceObject[]>([workspaceObject]);
  const currentWorkspace$ = new BehaviorSubject<WorkspaceObject | null>(workspaceObject);
  const initialized$ = new BehaviorSubject<boolean>(true);
  return {
    ...workspacesServiceMock.createStartContract(),
    currentWorkspaceId$,
    workspaceList$,
    currentWorkspace$,
    initialized$,
  };
};

const deleteFn = jest.fn().mockReturnValue({
  success: true,
});

const submitFn = jest.fn();
const onAppLeaveFn = jest.fn();
const navigateToAppFn = jest.fn();

const WorkspaceDetailPage = (props: any) => {
  const values = props.defaultValues || defaultValues;
  const mockHeaderControl =
    (props.header as Function) ||
    (() => {
      return null;
    });

  mockCoreStart.uiSettings.set(DEFAULT_WORKSPACE, 'notFoo');
  const { Provider } = createOpenSearchDashboardsReactContext({
    ...mockCoreStart,
    ...{
      application: {
        ...mockCoreStart.application,
        // applications$: new BehaviorSubject<Map<string, PublicAppInfo>>(PublicAPPInfoMap as any),
        navigateToApp: navigateToAppFn,
        capabilities: {
          ...mockCoreStart.application.capabilities,
          dashboards: { isDashboardAdmin: true },
          workspaces: {
            permissionEnabled: true,
          },
        },
      },
      workspaces: createWorkspacesSetupContractMockWithValue(),
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
      navigationUI: {
        HeaderControl: mockHeaderControl,
      },
    },
  });

  const registeredUseCases$ = createMockedRegisteredUseCases$();

  return (
    <IntlProvider locale="en">
      <MemoryRouter>
        <WorkspaceFormProvider
          application={mockCoreStart.application}
          savedObjects={mockCoreStart.savedObjects}
          operationType={WorkspaceOperationType.Update}
          permissionEnabled={true}
          onSubmit={submitFn}
          defaultValues={values}
          availableUseCases={[]}
          onAppLeave={onAppLeaveFn}
        >
          <Provider>
            <WorkspaceDetail registeredUseCases$={registeredUseCases$} {...props} />
          </Provider>
        </WorkspaceFormProvider>
      </MemoryRouter>
    </IntlProvider>
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

  it('should show current workspace information', async () => {
    const { getByText, getAllByText, getByDisplayValue } = render(WorkspaceDetailPage({}));
    expect(getAllByText('Observability').length).toEqual(2);
    expect(getByText(workspaceObject.id)).toBeInTheDocument();
    expect(getByText('Details')).toBeInTheDocument();
    expect(getByDisplayValue(workspaceObject.name)).toBeInTheDocument();
    expect(getByText(workspaceObject.description)).toBeInTheDocument();
    expect(getByDisplayValue(workspaceObject.color)).toBeInTheDocument();
  });

  it('can edit current workspace', async () => {
    const { getByTestId } = render(WorkspaceDetailPage({}));
    const editButton = getByTestId('workspaceForm-workspaceDetails-edit');
    expect(editButton).toBeInTheDocument();
    fireEvent.click(editButton);

    expect(getByTestId('workspaceForm-workspaceDetails-discardChanges')).toBeInTheDocument();

    const input = getByTestId('workspaceForm-workspaceDetails-nameInputText');
    fireEvent.change(input, {
      target: { value: 'newName' },
    });

    const saveButton = getByTestId('workspaceForm-bottomBar-updateButton');
    expect(saveButton).toBeInTheDocument();
    fireEvent.click(editButton);
    waitFor(() => {
      expect(submitFn).toHaveBeenCalled();
    });
  });

  it('should show navigate modal when number of changes > 1 and leave current page', async () => {
    const { getByText, getByTestId } = render(WorkspaceDetailPage({}));
    fireEvent.click(getByText('Edit'));
    const input = getByTestId('workspaceForm-workspaceDetails-nameInputText');
    fireEvent.change(input, {
      target: { value: 'newName' },
    });
    expect(getByText('1 Unsaved change(s)')).toBeInTheDocument();

    // Leave current page
    fireEvent(window, new Event('beforeunload'));
    expect(onAppLeaveFn).toHaveBeenCalled();
  });

  it('delete button will been shown at page header', async () => {
    const mockHeaderControl = ({ controls }) => {
      return controls?.[0]?.run?.() ?? null;
    };
    const { getByText, getByTestId } = render(
      WorkspaceDetailPage({
        showDeleteModal: true,
        header: mockHeaderControl,
      })
    );
    expect(getByText('Delete workspace')).toBeInTheDocument();
    const input = getByTestId('delete-workspace-modal-input');
    fireEvent.change(input, {
      target: { value: workspaceObject.name },
    });
    const confirmButton = getByTestId('delete-workspace-modal-confirm');
    fireEvent.click(confirmButton);
  });

  it('set default workspace button will been shown at page header', async () => {
    const mockHeaderControl = ({ controls }) => {
      return controls?.[1]?.label ?? null;
    };
    const { getByText } = render(WorkspaceDetailPage({ header: mockHeaderControl }));
    expect(getByText('Set as default')).toBeInTheDocument();
  });

  it('Workspace overview button will been shown at page header', async () => {
    const mockHeaderControlLabel = ({ controls }) => {
      return controls?.[2]?.label ?? null;
    };
    const { getByText } = render(WorkspaceDetailPage({ header: mockHeaderControlLabel }));
    expect(getByText('Workspace overview')).toBeInTheDocument();

    const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation(jest.fn());
    const mockHeaderControl = ({ controls }) => {
      return controls?.[2]?.run?.() ?? null;
    };
    render(WorkspaceDetailPage({ header: mockHeaderControl }));
    expect(windowOpenSpy).toBeCalled();
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

  it('should navigate to collaborators page when clicking the collaborators link', async () => {
    const { getByText } = render(WorkspaceDetailPage({}));
    fireEvent.click(getByText('Collaborators'));

    expect(navigateToAppFn).toHaveBeenCalledWith('workspace_collaborators');
  });
});
