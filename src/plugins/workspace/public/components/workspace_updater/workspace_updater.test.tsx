/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PublicAppInfo, WorkspaceObject } from 'opensearch-dashboards/public';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { BehaviorSubject } from 'rxjs';
import { WorkspaceUpdater as WorkspaceCreatorComponent } from './workspace_updater';
import { coreMock, workspacesServiceMock } from '../../../../../core/public/mocks';
import { createOpenSearchDashboardsReactContext } from '../../../../opensearch_dashboards_react/public';

const workspaceClientUpdate = jest.fn().mockReturnValue({ result: true, success: true });

const navigateToApp = jest.fn();
const notificationToastsAddSuccess = jest.fn();
const notificationToastsAddDanger = jest.fn();
const PublicAPPInfoMap = new Map([
  ['app1', { id: 'app1', title: 'app1' }],
  ['app2', { id: 'app2', title: 'app2', category: { id: 'category1', label: 'category1' } }],
  ['app3', { id: 'app3', category: { id: 'category1', label: 'category1' } }],
  ['app4', { id: 'app4', category: { id: 'category2', label: 'category2' } }],
  ['app5', { id: 'app5', category: { id: 'category2', label: 'category2' } }],
]);
const createWorkspacesSetupContractMockWithValue = () => {
  const currentWorkspaceId$ = new BehaviorSubject<string>('abljlsds');
  const currentWorkspace: WorkspaceObject = {
    id: 'abljlsds',
    name: 'test1',
    description: 'test1',
    features: [],
    color: '',
    icon: '',
    reserved: false,
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

const mockCoreStart = coreMock.createStart();

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
        },
        navigateToApp,
        getUrlForApp: jest.fn(),
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
    },
  });

  return (
    <Provider>
      <WorkspaceCreatorComponent {...props} />
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
    const { container } = render(<WorkspaceUpdater workspacesService={mockedWorkspacesService} />);
    expect(container).toMatchInlineSnapshot(`<div />`);
  });

  it('cannot create workspace with invalid name', async () => {
    const { getByTestId } = render(<WorkspaceUpdater />);
    const nameInput = getByTestId('workspaceForm-workspaceDetails-nameInputText');
    fireEvent.input(nameInput, {
      target: { value: '~' },
    });
    expect(workspaceClientUpdate).not.toHaveBeenCalled();
  });

  it('update workspace successfully', async () => {
    const { getByTestId, getByText } = render(<WorkspaceUpdater />);
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

    fireEvent.click(getByTestId('workspaceForm-workspaceFeatureVisibility-app1'));
    fireEvent.click(getByTestId('workspaceForm-workspaceFeatureVisibility-category1'));

    fireEvent.click(getByText('Users & Permissions'));
    fireEvent.click(getByTestId('workspaceForm-permissionSettingPanel-user-addNew'));
    const userIdInput = getByTestId('workspaceForm-permissionSettingPanel-0-userId');
    fireEvent.click(userIdInput);
    fireEvent.input(getByTestId('comboBoxSearchInput'), {
      target: { value: 'test user id' },
    });
    fireEvent.blur(getByTestId('comboBoxSearchInput'));

    fireEvent.click(getByTestId('workspaceForm-bottomBar-updateButton'));
    expect(workspaceClientUpdate).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        name: 'test workspace name',
        color: '#000000',
        description: 'test workspace description',
        features: expect.arrayContaining(['app1', 'app2', 'app3']),
      }),
      expect.arrayContaining([expect.objectContaining({ type: 'user', userId: 'test user id' })])
    );
    await waitFor(() => {
      expect(notificationToastsAddSuccess).toHaveBeenCalled();
    });
    expect(notificationToastsAddDanger).not.toHaveBeenCalled();
  });

  it('should show danger toasts after update workspace failed', async () => {
    workspaceClientUpdate.mockReturnValue({ result: false, success: false });
    const { getByTestId } = render(<WorkspaceUpdater />);
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
    const { getByTestId } = render(<WorkspaceUpdater />);
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
});
