/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PublicAppInfo, WorkspaceObject } from 'opensearch-dashboards/public';
import { fireEvent, render, waitFor, screen, act } from '@testing-library/react';
import { BehaviorSubject } from 'rxjs';
import { WorkspaceUpdater as WorkspaceUpdaterComponent } from './workspace_updater';
import { coreMock, workspacesServiceMock } from '../../../../../core/public/mocks';
import { createOpenSearchDashboardsReactContext } from '../../../../opensearch_dashboards_react/public';

const workspaceClientUpdate = jest.fn().mockReturnValue({ result: true, success: true });

const navigateToApp = jest.fn();
const notificationToastsAddSuccess = jest.fn();
const notificationToastsAddDanger = jest.fn();
const PublicAPPInfoMap = new Map([
  ['data-explorer', { id: 'data-explorer', title: 'Data Explorer' }],
  ['dashboards', { id: 'dashboards', title: 'Dashboards' }],
]);
const createWorkspacesSetupContractMockWithValue = () => {
  const currentWorkspaceId$ = new BehaviorSubject<string>('abljlsds');
  const currentWorkspace = {
    id: 'abljlsds',
    name: 'test1',
    description: 'test1',
    features: ['use-case-observability'],
    reserved: false,
    permissions: {
      library_write: {
        users: ['foo'],
      },
      write: {
        users: ['foo'],
      },
    },
  };
  const workspaceList$ = new BehaviorSubject<WorkspaceObject[]>([currentWorkspace]);
  const currentWorkspace$ = new BehaviorSubject<WorkspaceObject | null>(currentWorkspace);
  const initialized$ = new BehaviorSubject<boolean>(false);
  return {
    currentWorkspaceId$,
    workspaceList$,
    currentWorkspace$,
    initialized$,
  };
};

const dataSourcesList = [
  {
    id: 'id1',
    title: 'ds1', // This is used for mocking saved object function
    get: () => {
      return 'ds1';
    },
  },
  {
    id: 'id2',
    title: 'ds2',
    get: () => {
      return 'ds2';
    },
  },
];

const mockCoreStart = coreMock.createStart();

const renderCompleted = () => expect(screen.queryByText('Enter details')).not.toBeNull();

const WorkspaceUpdater = (props: any) => {
  const workspacesService = props.workspacesService || createWorkspacesSetupContractMockWithValue();
  const { Provider } = createOpenSearchDashboardsReactContext({
    ...mockCoreStart,
    ...{
      application: {
        ...mockCoreStart.application,
        capabilities: {
          ...mockCoreStart.application.capabilities,
          workspaces: {
            permissionEnabled: true,
          },
          dashboards: {
            isDashboardAdmin: true,
          },
        },
        navigateToApp,
        getUrlForApp: jest.fn(() => '/app/workspace_overview'),
        applications$: new BehaviorSubject<Map<string, PublicAppInfo>>(PublicAPPInfoMap as any),
      },
      workspaces: workspacesService,
      notifications: {
        ...mockCoreStart.notifications,
        toasts: {
          ...mockCoreStart.notifications.toasts,
          addDanger: notificationToastsAddDanger,
          addSuccess: notificationToastsAddSuccess,
        },
      },
      workspaceClient: {
        ...mockCoreStart.workspaces,
        update: workspaceClientUpdate,
      },
      savedObjects: {
        ...mockCoreStart.savedObjects,
        client: {
          ...mockCoreStart.savedObjects.client,
          find: jest.fn().mockResolvedValue({
            savedObjects: dataSourcesList,
          }),
        },
      },
      dataSourceManagement: {},
    },
  });

  return (
    <Provider>
      <WorkspaceUpdaterComponent {...props} />
    </Provider>
  );
};

function clearMockedFunctions() {
  workspaceClientUpdate.mockClear();
  notificationToastsAddDanger.mockClear();
  notificationToastsAddSuccess.mockClear();
}

describe('WorkspaceUpdater', () => {
  beforeEach(() => clearMockedFunctions());
  const { location } = window;
  const setHrefSpy = jest.fn((href) => href);

  beforeAll(() => {
    if (window.location) {
      // @ts-ignore
      delete window.location;
    }
    window.location = {} as Location;
    Object.defineProperty(window.location, 'href', {
      get: () => 'http://localhost/',
      set: setHrefSpy,
    });
  });

  afterAll(() => {
    window.location = location;
  });

  it('cannot render when the name of the current workspace is empty', async () => {
    const mockedWorkspacesService = workspacesServiceMock.createSetupContract();
    const { container } = render(
      <WorkspaceUpdater
        workspaceConfigurableApps$={new BehaviorSubject([...PublicAPPInfoMap.values()])}
        workspacesService={mockedWorkspacesService}
      />
    );
    expect(container).toMatchInlineSnapshot(`<div />`);
  });

  it('cannot update workspace with invalid name', async () => {
    const { getByTestId } = render(
      <WorkspaceUpdater
        workspaceConfigurableApps$={new BehaviorSubject([...PublicAPPInfoMap.values()])}
      />
    );

    await waitFor(renderCompleted);

    const nameInput = getByTestId('workspaceForm-workspaceDetails-nameInputText');
    fireEvent.input(nameInput, {
      target: { value: '~' },
    });
    expect(workspaceClientUpdate).not.toHaveBeenCalled();
  });

  it('cancel update workspace', async () => {
    const { findByText, getByTestId } = render(
      <WorkspaceUpdater
        workspaceConfigurableApps$={new BehaviorSubject([...PublicAPPInfoMap.values()])}
      />
    );
    await waitFor(renderCompleted);

    fireEvent.click(getByTestId('workspaceForm-bottomBar-cancelButton'));
    await findByText('Discard changes?');
    fireEvent.click(getByTestId('confirmModalConfirmButton'));
    expect(navigateToApp).toHaveBeenCalled();
  });

  it('update workspace successfully', async () => {
    const { getByTestId, getAllByTestId, getAllByLabelText } = render(
      <WorkspaceUpdater
        workspaceConfigurableApps$={new BehaviorSubject([...PublicAPPInfoMap.values()])}
      />
    );
    await waitFor(renderCompleted);

    const nameInput = getByTestId('workspaceForm-workspaceDetails-nameInputText');
    fireEvent.input(nameInput, {
      target: { value: 'test workspace name' },
    });

    const descriptionInput = getByTestId('workspaceForm-workspaceDetails-descriptionInputText');
    fireEvent.input(descriptionInput, {
      target: { value: 'test workspace description' },
    });
    const colorSelector = getByTestId(
      'euiColorPickerAnchor workspaceForm-workspaceDetails-colorPicker'
    );
    fireEvent.input(colorSelector, {
      target: { value: '#000000' },
    });

    fireEvent.click(getByTestId('workspaceUseCase-observability'));
    fireEvent.click(getByTestId('workspaceUseCase-analytics'));

    const userIdInput = getAllByTestId('comboBoxSearchInput')[0];
    fireEvent.click(userIdInput);

    fireEvent.input(userIdInput, {
      target: { value: 'test user id' },
    });
    fireEvent.blur(userIdInput);

    await act(() => {
      fireEvent.click(getAllByLabelText('Delete data source')[0]);
    });

    fireEvent.click(getByTestId('workspaceForm-bottomBar-updateButton'));
    expect(workspaceClientUpdate).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        name: 'test workspace name',
        color: '#000000',
        description: 'test workspace description',
        features: expect.arrayContaining(['use-case-analytics']),
      }),
      {
        permissions: {
          library_write: {
            users: ['test user id'],
          },
          write: {
            users: ['test user id'],
          },
        },
        dataSources: ['id2'],
      }
    );
    await waitFor(() => {
      expect(notificationToastsAddSuccess).toHaveBeenCalled();
    });
    expect(notificationToastsAddDanger).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(setHrefSpy).toHaveBeenCalledWith(expect.stringMatching(/workspace_overview$/));
    });
  });

  it('should show danger toasts after update workspace failed', async () => {
    workspaceClientUpdate.mockReturnValue({ result: false, success: false });
    const { getByTestId } = render(
      <WorkspaceUpdater
        workspaceConfigurableApps$={new BehaviorSubject([...PublicAPPInfoMap.values()])}
      />
    );
    await waitFor(renderCompleted);

    const nameInput = getByTestId('workspaceForm-workspaceDetails-nameInputText');
    fireEvent.input(nameInput, {
      target: { value: 'test workspace name' },
    });
    fireEvent.click(getByTestId('workspaceForm-bottomBar-updateButton'));
    expect(workspaceClientUpdate).toHaveBeenCalled();
    await waitFor(() => {
      expect(notificationToastsAddDanger).toHaveBeenCalled();
    });
    expect(notificationToastsAddSuccess).not.toHaveBeenCalled();
  });

  it('should show danger toasts after update workspace threw error', async () => {
    workspaceClientUpdate.mockImplementation(() => {
      throw new Error('update workspace failed');
    });
    const { getByTestId } = render(
      <WorkspaceUpdater
        workspaceConfigurableApps$={new BehaviorSubject([...PublicAPPInfoMap.values()])}
      />
    );
    await waitFor(renderCompleted);

    const nameInput = getByTestId('workspaceForm-workspaceDetails-nameInputText');
    fireEvent.input(nameInput, {
      target: { value: 'test workspace name' },
    });
    fireEvent.click(getByTestId('workspaceForm-bottomBar-updateButton'));
    expect(workspaceClientUpdate).toHaveBeenCalled();
    await waitFor(() => {
      expect(notificationToastsAddDanger).toHaveBeenCalled();
    });
    expect(notificationToastsAddSuccess).not.toHaveBeenCalled();
  });

  it('should show danger toasts when currentWorkspace is missing after click update button', async () => {
    const mockedWorkspacesService = workspacesServiceMock.createSetupContract();
    const { getByTestId } = render(
      <WorkspaceUpdater
        workspaceConfigurableApps$={new BehaviorSubject([...PublicAPPInfoMap.values()])}
        workspaceService={mockedWorkspacesService}
      />
    );

    await waitFor(renderCompleted);

    const nameInput = getByTestId('workspaceForm-workspaceDetails-nameInputText');
    fireEvent.input(nameInput, {
      target: { value: 'test workspace name' },
    });
    fireEvent.click(getByTestId('workspaceForm-bottomBar-updateButton'));
    mockedWorkspacesService.currentWorkspace$ = new BehaviorSubject<WorkspaceObject | null>(null);
    expect(workspaceClientUpdate).toHaveBeenCalled();
    await waitFor(() => {
      expect(notificationToastsAddDanger).toHaveBeenCalled();
    });
    expect(notificationToastsAddSuccess).not.toHaveBeenCalled();
  });
});
