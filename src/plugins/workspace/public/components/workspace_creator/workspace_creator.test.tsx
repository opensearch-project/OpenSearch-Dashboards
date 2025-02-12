/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PublicAppInfo } from 'opensearch-dashboards/public';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { BehaviorSubject } from 'rxjs';
import { coreMock } from '../../../../../core/public/mocks';
import { createOpenSearchDashboardsReactContext } from '../../../../opensearch_dashboards_react/public';
import { createMockedRegisteredUseCases$ } from '../../mocks';

import {
  WorkspaceCreator as WorkspaceCreatorComponent,
  WorkspaceCreatorProps,
} from './workspace_creator';
import { DataSourceEngineType } from '../../../../data_source/common/data_sources';
import { DataSourceConnectionType } from '../../../common/types';
import * as utils from '../../utils';
import * as workspaceUtilsExports from '../utils/workspace';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({
    search: '',
    pathname: '',
    hash: '',
    state: undefined,
  }),
}));

const workspaceClientCreate = jest
  .fn()
  .mockReturnValue({ result: { id: 'successResult' }, success: true });

const navigateToApp = jest.fn();
const notificationToastsAddSuccess = jest.fn();
const notificationToastsAddDanger = jest.fn();
const PublicAPPInfoMap = new Map([
  ['data-explorer', { id: 'data-explorer', title: 'Data Explorer' }],
  ['dashboards', { id: 'dashboards', title: 'Dashboards' }],
]);

const dataSourcesList = [
  {
    id: 'id1',
    title: 'ds1',
    description: 'Description of data source 1',
    auth: '',
    dataSourceEngineType: '' as DataSourceEngineType,
    workspaces: [],
    // This is used for mocking saved object function
    get: () => {
      return 'ds1';
    },
  },
  {
    id: 'id2',
    title: 'ds2',
    description: 'Description of data source 1',
    auth: '',
    dataSourceEngineType: '' as DataSourceEngineType,
    workspaces: [],
    get: () => {
      return 'ds2';
    },
  },
  {
    id: 'id3',
    title: 'dqs1',
    description: 'Description of data connection 1',
    auth: '',
    dataSourceEngineType: '' as DataSourceEngineType,
    workspaces: [],
    type: 'data-connection',
    connectionType: 'AWS Security Lake',
    get: () => {
      return 'ds2';
    },
  },
];
const dataSourceConnectionsList = [
  {
    id: 'id1',
    name: 'ds1',
    connectionType: DataSourceConnectionType.OpenSearchConnection,
    type: 'OpenSearch',
    relatedConnections: [],
  },
  {
    id: 'id2',
    name: 'ds2',
    connectionType: DataSourceConnectionType.OpenSearchConnection,
    type: 'OpenSearch',
  },
  {
    id: 'id3',
    name: 'dqs1',
    description: 'Description of data connection 1',
    connectionType: DataSourceConnectionType.DataConnection,
    type: 'AWS Security Lake',
  },
];

const mockCoreStart = coreMock.createStart();

jest.spyOn(utils, 'fetchDataSourceConnections').mockImplementation(async (passedDataSources) => {
  return dataSourceConnectionsList.filter(({ id }) =>
    passedDataSources.some((dataSource) => dataSource.id === id)
  );
});

const WorkspaceCreator = ({
  isDashboardAdmin = false,
  dataSourceEnabled = false,
  isPermissionEnabled = true,
  ...props
}: Partial<
  WorkspaceCreatorProps & {
    isDashboardAdmin: boolean;
    dataSourceEnabled?: boolean;
    isPermissionEnabled?: boolean;
  }
>) => {
  const { Provider } = createOpenSearchDashboardsReactContext({
    ...mockCoreStart,
    ...{
      application: {
        ...mockCoreStart.application,
        capabilities: {
          ...mockCoreStart.application.capabilities,
          workspaces: {
            permissionEnabled: isPermissionEnabled,
          },
          dashboards: {
            isDashboardAdmin,
          },
        },
        navigateToApp,
        getUrlForApp: jest.fn((appId) => `/app/${appId}`),
        applications$: new BehaviorSubject<Map<string, PublicAppInfo>>(PublicAPPInfoMap as any),
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
      savedObjects: {
        ...mockCoreStart.savedObjects,
        client: {
          ...mockCoreStart.savedObjects.client,
          find: jest.fn().mockResolvedValue({
            savedObjects: dataSourcesList,
          }),
        },
      },
      dataSourceManagement: dataSourceEnabled ? {} : undefined,
      navigationUI: {
        HeaderControl: () => null,
      },
    },
  });
  const registeredUseCases$ = createMockedRegisteredUseCases$();

  return (
    <Provider>
      <WorkspaceCreatorComponent {...props} registeredUseCases$={registeredUseCases$} />
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
      get: () => 'http://localhost/w/workspace/app/workspace_create',
      set: setHrefSpy,
    });
  });

  afterAll(() => {
    window.location = location;
  });

  it('should not create workspace when name is empty', async () => {
    const { getByTestId, getByText } = render(<WorkspaceCreator />);

    // Ensure workspace create form rendered
    await waitFor(() => {
      expect(getByTestId('workspaceForm-bottomBar-createButton')).toBeInTheDocument();
    });

    const nameInput = getByTestId('workspaceForm-workspaceDetails-nameInputText');
    fireEvent.input(nameInput, {
      target: {
        value: '',
      },
    });
    fireEvent.click(getByTestId('workspaceForm-bottomBar-createButton'));
    expect(getByText('Name is required. Enter a name.')).toBeInTheDocument();
    expect(workspaceClientCreate).not.toHaveBeenCalled();
  });

  it('should not create workspace with invalid name', async () => {
    const { getByTestId } = render(<WorkspaceCreator />);

    // Ensure workspace create form rendered
    await waitFor(() => {
      expect(getByTestId('workspaceForm-bottomBar-createButton')).toBeInTheDocument();
    });

    const nameInput = getByTestId('workspaceForm-workspaceDetails-nameInputText');
    fireEvent.input(nameInput, {
      target: { value: '~' },
    });
    expect(workspaceClientCreate).not.toHaveBeenCalled();
  });

  it('cancel create workspace', async () => {
    const { findByText, getByTestId } = render(<WorkspaceCreator />);

    // Ensure workspace create form rendered
    await waitFor(() => {
      expect(getByTestId('workspaceForm-bottomBar-createButton')).toBeInTheDocument();
    });
    fireEvent.click(getByTestId('workspaceForm-bottomBar-cancelButton'));
    await findByText('Discard changes?');
    fireEvent.click(getByTestId('confirmModalConfirmButton'));
    expect(navigateToApp).toHaveBeenCalled();
  });

  it('create workspace with detailed information', async () => {
    const { getByTestId, getByRole } = render(<WorkspaceCreator />);

    // Ensure workspace create form rendered
    await waitFor(() => {
      expect(getByTestId('workspaceForm-bottomBar-createButton')).toBeInTheDocument();
    });
    const nameInput = getByTestId('workspaceForm-workspaceDetails-nameInputText');
    fireEvent.input(nameInput, {
      target: { value: 'test workspace name' },
    });
    const descriptionInput = getByTestId('workspaceForm-workspaceDetails-descriptionInputText');
    fireEvent.input(descriptionInput, {
      target: { value: 'test workspace description' },
    });
    const colorSelector = getByTestId('euiColorPickerAnchor');
    fireEvent.click(colorSelector);
    fireEvent.click(getByRole('option', { name: 'Select #54B399 as the color' }));
    fireEvent.click(getByTestId('workspaceUseCase-observability'));
    fireEvent.click(getByTestId('workspaceForm-bottomBar-createButton'));
    expect(workspaceClientCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'test workspace name',
        color: '#54B399',
        description: 'test workspace description',
        features: expect.arrayContaining(['use-case-observability']),
      }),
      {
        dataSources: [],
        dataConnections: [],
        permissions: {
          library_write: {
            users: ['%me%'],
          },
          write: {
            users: ['%me%'],
          },
        },
      }
    );
    await waitFor(() => {
      expect(notificationToastsAddSuccess).toHaveBeenCalled();
    });
    expect(notificationToastsAddDanger).not.toHaveBeenCalled();
  });

  it('should show danger toasts after create workspace failed', async () => {
    workspaceClientCreate.mockReturnValueOnce({ result: { id: 'failResult' }, success: false });
    const { getByTestId } = render(<WorkspaceCreator />);

    // Ensure workspace create form rendered
    await waitFor(() => {
      expect(getByTestId('workspaceForm-bottomBar-createButton')).toBeInTheDocument();
    });
    const nameInput = getByTestId('workspaceForm-workspaceDetails-nameInputText');
    fireEvent.input(nameInput, {
      target: { value: 'test workspace name' },
    });
    fireEvent.click(getByTestId('workspaceUseCase-observability'));
    fireEvent.click(getByTestId('workspaceForm-bottomBar-createButton'));
    expect(workspaceClientCreate).toHaveBeenCalled();
    await waitFor(() => {
      expect(notificationToastsAddDanger).toHaveBeenCalled();
    });
    expect(notificationToastsAddSuccess).not.toHaveBeenCalled();
  });

  it('should show danger toasts after call create workspace API failed', async () => {
    workspaceClientCreate.mockImplementationOnce(async () => {
      throw new Error();
    });
    const { getByTestId } = render(<WorkspaceCreator />);

    // Ensure workspace create form rendered
    await waitFor(() => {
      expect(getByTestId('workspaceForm-bottomBar-createButton')).toBeInTheDocument();
    });
    const nameInput = getByTestId('workspaceForm-workspaceDetails-nameInputText');
    fireEvent.input(nameInput, {
      target: { value: 'test workspace name' },
    });
    fireEvent.click(getByTestId('workspaceUseCase-observability'));
    fireEvent.click(getByTestId('workspaceForm-bottomBar-createButton'));
    expect(workspaceClientCreate).toHaveBeenCalled();
    await waitFor(() => {
      expect(notificationToastsAddDanger).toHaveBeenCalled();
    });
    expect(notificationToastsAddSuccess).not.toHaveBeenCalled();
  });

  it('create workspace with customized selected dataSources', async () => {
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      value: 600,
    });
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      value: 600,
    });
    const { getByTestId, getAllByText, getByText } = render(
      <WorkspaceCreator isDashboardAdmin={true} dataSourceEnabled />
    );

    // Ensure workspace create form rendered
    await waitFor(() => {
      expect(getByTestId('workspaceForm-bottomBar-createButton')).toBeInTheDocument();
    });
    const nameInput = getByTestId('workspaceForm-workspaceDetails-nameInputText');
    fireEvent.input(nameInput, {
      target: { value: 'test workspace name' },
    });
    fireEvent.click(getByTestId('workspaceUseCase-observability'));
    fireEvent.click(getByTestId('workspace-creator-dataSources-assign-button'));
    await waitFor(() => {
      expect(
        getByText(
          'Add data sources that will be available in the workspace. If a selected data source has related Direct Query data sources, they will also be available in the workspace.'
        )
      ).toBeInTheDocument();
      expect(getByText(dataSourcesList[0].title)).toBeInTheDocument();
    });
    fireEvent.click(getByText(dataSourcesList[0].title));
    fireEvent.click(getAllByText('Associate data sources')[1]);

    fireEvent.click(getByTestId('workspaceForm-bottomBar-createButton'));
    expect(workspaceClientCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'test workspace name',
      }),
      expect.objectContaining({
        dataConnections: [],
        dataSources: ['id1'],
      })
    );
    await waitFor(() => {
      expect(notificationToastsAddSuccess).toHaveBeenCalled();
    });
    expect(notificationToastsAddDanger).not.toHaveBeenCalled();
  });

  it('create workspace with customized selected data connections', async () => {
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      value: 600,
    });
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      value: 600,
    });
    const { getByTestId, getAllByText, getByText } = render(
      <WorkspaceCreator isDashboardAdmin={true} dataSourceEnabled />
    );

    // Ensure workspace create form rendered
    await waitFor(() => {
      expect(getByTestId('workspaceForm-bottomBar-createButton')).toBeInTheDocument();
    });
    const nameInput = getByTestId('workspaceForm-workspaceDetails-nameInputText');
    fireEvent.input(nameInput, {
      target: { value: 'test workspace name' },
    });
    fireEvent.click(getByTestId('workspaceUseCase-observability'));
    fireEvent.click(getByTestId('workspace-creator-dqc-assign-button'));

    await waitFor(() => {
      expect(
        getByText(
          'Add data sources that will be available in the workspace. If a selected data source has related Direct Query data sources, they will also be available in the workspace.'
        )
      ).toBeInTheDocument();
      expect(getByText(dataSourcesList[2].title)).toBeInTheDocument();
    });
    fireEvent.click(getByText(dataSourcesList[2].title));
    fireEvent.click(getAllByText('Associate data sources')[1]);

    fireEvent.click(getByTestId('workspaceForm-bottomBar-createButton'));
    expect(workspaceClientCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'test workspace name',
      }),
      expect.objectContaining({
        dataConnections: ['id3'],
        dataSources: [],
      })
    );
    await waitFor(() => {
      expect(notificationToastsAddSuccess).toHaveBeenCalled();
    });
    expect(notificationToastsAddDanger).not.toHaveBeenCalled();
  });

  it('should not include permissions parameter if permissions not enabled', async () => {
    const { getByTestId } = render(
      <WorkspaceCreator isDashboardAdmin={true} isPermissionEnabled={false} />
    );

    // Ensure workspace create form rendered
    await waitFor(() => {
      expect(getByTestId('workspaceForm-bottomBar-createButton')).toBeInTheDocument();
    });
    const nameInput = getByTestId('workspaceForm-workspaceDetails-nameInputText');
    fireEvent.input(nameInput, {
      target: { value: 'test workspace name' },
    });
    fireEvent.click(getByTestId('workspaceUseCase-observability'));

    fireEvent.click(getByTestId('workspaceForm-bottomBar-createButton'));
    expect(workspaceClientCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'test workspace name',
      }),
      {
        dataConnections: [],
        dataSources: [],
      }
    );
    await waitFor(() => {
      expect(notificationToastsAddSuccess).toHaveBeenCalled();
    });
    expect(notificationToastsAddDanger).not.toHaveBeenCalled();
  });

  it('should not create workspace API when submitting', async () => {
    workspaceClientCreate.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          setTimeout(resolve, 100);
        })
    );
    const { getByTestId } = render(<WorkspaceCreator />);
    // Ensure workspace create form rendered
    await waitFor(() => {
      expect(getByTestId('workspaceForm-bottomBar-createButton')).toBeInTheDocument();
    });
    const nameInput = getByTestId('workspaceForm-workspaceDetails-nameInputText');
    fireEvent.input(nameInput, {
      target: { value: 'test workspace name' },
    });
    fireEvent.click(getByTestId('workspaceForm-bottomBar-createButton'));
    expect(workspaceClientCreate).toHaveBeenCalledTimes(1);

    // Since create button was been disabled, fire form submit event by form directly
    fireEvent.submit(getByTestId('workspaceCreatorForm'));
    expect(workspaceClientCreate).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      fireEvent.click(getByTestId('workspaceForm-bottomBar-createButton'));
      expect(workspaceClientCreate).toHaveBeenCalledTimes(2);
    });
  });

  it('should redirect to workspace use case landing page if permission not enabled', async () => {
    const { getByTestId } = render(<WorkspaceCreator isPermissionEnabled={false} />);

    // Ensure workspace create form rendered
    await waitFor(() => {
      expect(getByTestId('workspaceForm-bottomBar-createButton')).toBeInTheDocument();
    });
    const nameInput = getByTestId('workspaceForm-workspaceDetails-nameInputText');
    fireEvent.input(nameInput, {
      target: { value: 'test workspace name' },
    });
    fireEvent.click(getByTestId('workspaceForm-bottomBar-createButton'));
    jest.useFakeTimers();
    jest.runAllTimers();
    await waitFor(() => {
      expect(setHrefSpy).toHaveBeenCalledWith(expect.stringContaining('/app/discover'));
    });
    jest.useRealTimers();
  });

  it('should redirect to workspace setting collaborators page if jump to collaborators checked', async () => {
    const { getByTestId } = render(<WorkspaceCreator isDashboardAdmin />);
    const navigateToCollaboratorsMock = jest.fn();
    jest
      .spyOn(workspaceUtilsExports, 'navigateToAppWithinWorkspace')
      .mockImplementation(navigateToCollaboratorsMock);

    // Ensure workspace create form rendered
    await waitFor(() => {
      expect(getByTestId('workspaceForm-bottomBar-createButton')).toBeInTheDocument();
    });
    const nameInput = getByTestId('workspaceForm-workspaceDetails-nameInputText');
    fireEvent.input(nameInput, {
      target: { value: 'test workspace name' },
    });
    fireEvent.click(getByTestId('jumpToCollaboratorsCheckbox'));
    fireEvent.click(getByTestId('workspaceForm-bottomBar-createButton'));
    jest.useFakeTimers();
    jest.runAllTimers();
    await waitFor(() => {
      expect(navigateToCollaboratorsMock).toHaveBeenCalledWith(
        expect.anything(),
        'successResult',
        'workspace_collaborators'
      );
    });
    jest.useRealTimers();
  });

  it('should redirect to workspace use case landing page if jump to collaborators not checked', async () => {
    const { getByTestId } = render(<WorkspaceCreator isDashboardAdmin />);

    // Ensure workspace create form rendered
    await waitFor(() => {
      expect(getByTestId('workspaceForm-bottomBar-createButton')).toBeInTheDocument();
    });
    const nameInput = getByTestId('workspaceForm-workspaceDetails-nameInputText');
    fireEvent.input(nameInput, {
      target: { value: 'test workspace name' },
    });
    fireEvent.click(getByTestId('workspaceForm-bottomBar-createButton'));
    jest.useFakeTimers();
    jest.runAllTimers();
    await waitFor(() => {
      expect(setHrefSpy).toHaveBeenCalledWith(expect.stringContaining('/app/discover'));
    });
    jest.useRealTimers();
  });
});
