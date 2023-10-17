/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PublicAppInfo } from 'opensearch-dashboards/public';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { BehaviorSubject } from 'rxjs';
import { WorkspaceCreator as WorkspaceCreatorComponent } from './workspace_creator';
import { coreMock } from '../../../../../core/public/mocks';
import { createOpenSearchDashboardsReactContext } from '../../../../opensearch_dashboards_react/public';

const workspaceClientCreate = jest
  .fn()
  .mockReturnValue({ result: { id: 'successResult' }, success: true });

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

const mockCoreStart = coreMock.createStart();

const WorkspaceCreator = (props: any) => {
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
      http: {
        ...mockCoreStart.http,
        basePath: {
          ...mockCoreStart.http.basePath,
          remove: jest.fn(),
          prepend: jest.fn(),
        },
      },
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
        create: workspaceClientCreate,
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
  workspaceClientCreate.mockClear();
  notificationToastsAddDanger.mockClear();
  notificationToastsAddSuccess.mockClear();
}

describe('WorkspaceCreator', () => {
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

  it('cannot create workspace when name empty', async () => {
    const { getByTestId } = render(<WorkspaceCreator />);
    fireEvent.click(getByTestId('workspaceForm-bottomBar-createButton'));
    expect(workspaceClientCreate).not.toHaveBeenCalled();
  });

  it('cannot create workspace with invalid name', async () => {
    const { getByTestId } = render(<WorkspaceCreator />);
    const nameInput = getByTestId('workspaceForm-workspaceDetails-nameInputText');
    fireEvent.input(nameInput, {
      target: { value: '~' },
    });
    expect(workspaceClientCreate).not.toHaveBeenCalled();
  });

  it('cannot create workspace with invalid description', async () => {
    const { getByTestId } = render(<WorkspaceCreator />);
    const nameInput = getByTestId('workspaceForm-workspaceDetails-nameInputText');
    fireEvent.input(nameInput, {
      target: { value: 'test workspace name' },
    });
    const descriptionInput = getByTestId('workspaceForm-workspaceDetails-descriptionInputText');
    fireEvent.input(descriptionInput, {
      target: { value: '~' },
    });
    expect(workspaceClientCreate).not.toHaveBeenCalled();
  });

  it('cancel create workspace', async () => {
    const { findByText, getByTestId } = render(<WorkspaceCreator />);
    fireEvent.click(getByTestId('workspaceForm-bottomBar-cancelButton'));
    await findByText('Discard changes?');
    fireEvent.click(getByTestId('confirmModalConfirmButton'));
    expect(navigateToApp).toHaveBeenCalled();
  });

  it('create workspace with detailed information', async () => {
    const { getByTestId } = render(<WorkspaceCreator />);
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
    const iconSelector = getByTestId('workspaceForm-workspaceDetails-iconSelector');
    fireEvent.click(iconSelector);
    fireEvent.click(getByTestId('workspaceForm-workspaceDetails-iconSelector-Glasses'));
    const defaultVISThemeSelector = getByTestId(
      'workspaceForm-workspaceDetails-defaultVISThemeSelector'
    );
    fireEvent.click(defaultVISThemeSelector);
    fireEvent.change(defaultVISThemeSelector, { target: { value: 'categorical' } });
    fireEvent.click(getByTestId('workspaceForm-bottomBar-createButton'));
    expect(workspaceClientCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'test workspace name',
        icon: 'Glasses',
        color: '#000000',
        description: 'test workspace description',
        defaultVISTheme: 'categorical',
      })
    );
    await waitFor(() => {
      expect(notificationToastsAddSuccess).toHaveBeenCalled();
    });
    expect(notificationToastsAddDanger).not.toHaveBeenCalled();
  });

  it('create workspace with customized features', async () => {
    const { getByTestId } = render(<WorkspaceCreator />);
    const nameInput = getByTestId('workspaceForm-workspaceDetails-nameInputText');
    fireEvent.input(nameInput, {
      target: { value: 'test workspace name' },
    });
    fireEvent.click(getByTestId('workspaceForm-workspaceFeatureVisibility-app1'));
    fireEvent.click(getByTestId('workspaceForm-workspaceFeatureVisibility-category1'));
    fireEvent.click(getByTestId('workspaceForm-bottomBar-createButton'));
    expect(workspaceClientCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'test workspace name',
        features: expect.arrayContaining(['app1', 'app2', 'app3']),
      })
    );
    await waitFor(() => {
      expect(notificationToastsAddSuccess).toHaveBeenCalled();
    });
    expect(notificationToastsAddDanger).not.toHaveBeenCalled();
  });

  it('create workspace with customized permissions', async () => {
    const { getByTestId, getByText } = render(<WorkspaceCreator />);
    const nameInput = getByTestId('workspaceForm-workspaceDetails-nameInputText');
    fireEvent.input(nameInput, {
      target: { value: 'test workspace name' },
    });
    fireEvent.click(getByText('Users & Permissions'));
    fireEvent.click(getByTestId('workspaceForm-permissionSettingPanel-user-addNew'));
    const userIdInput = getByTestId('workspaceForm-permissionSettingPanel-0-userId');
    fireEvent.click(userIdInput);
    fireEvent.input(getByTestId('comboBoxSearchInput'), {
      target: { value: 'test user id' },
    });
    fireEvent.blur(getByTestId('comboBoxSearchInput'));
    fireEvent.click(getByTestId('workspaceForm-bottomBar-createButton'));
    expect(workspaceClientCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'test workspace name',
        permissions: expect.arrayContaining([
          expect.objectContaining({ type: 'user', userId: 'test user id' }),
        ]),
      })
    );
    await waitFor(() => {
      expect(notificationToastsAddSuccess).toHaveBeenCalled();
    });
    expect(notificationToastsAddDanger).not.toHaveBeenCalled();
  });

  it('should show danger toasts after create workspace failed', async () => {
    workspaceClientCreate.mockReturnValue({ result: { id: 'failResult' }, success: false });
    const { getByTestId } = render(<WorkspaceCreator />);
    const nameInput = getByTestId('workspaceForm-workspaceDetails-nameInputText');
    fireEvent.input(nameInput, {
      target: { value: 'test workspace name' },
    });
    fireEvent.click(getByTestId('workspaceForm-bottomBar-createButton'));
    expect(workspaceClientCreate).toHaveBeenCalled();
    await waitFor(() => {
      expect(notificationToastsAddDanger).toHaveBeenCalled();
    });
    expect(notificationToastsAddSuccess).not.toHaveBeenCalled();
  });
});
