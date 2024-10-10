/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { coreMock } from '../../../core/public/mocks';
import * as opensearchDashboardsReactExports from '../../../plugins/opensearch_dashboards_react/public';
import {
  generateOnAddCallback,
  registerDefaultCollaboratorTypes,
} from './register_default_collaborator_types';
import { WorkspaceCollaboratorTypesService } from './services';
import { fireEvent, render } from '@testing-library/react';

jest.mock('../../../plugins/opensearch_dashboards_react/public', () => ({
  toMountPoint: jest.fn(),
}));

jest.mock('./components/add_collaborators_modal', () => ({
  AddCollaboratorsModal: ({ onClose, onAddCollaborators }) => (
    <div>
      <button
        onClick={() => {
          onClose();
        }}
      >
        Close
      </button>
      <button
        onClick={() => {
          onAddCollaborators([]);
        }}
      >
        Add collaborators
      </button>
    </div>
  ),
}));

const toMountPointMock = jest.fn();
jest.spyOn(opensearchDashboardsReactExports, 'toMountPoint').mockImplementation(toMountPointMock);

describe('generateOnAddCallback', () => {
  const getStartServices = coreMock.createSetup().getStartServices;

  const props = {
    getStartServices,
    title: 'Test Title',
    inputLabel: 'Test Input Label',
    addAnotherButtonLabel: 'Test Add Another Button Label',
    permissionType: 'user' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should open the AddCollaboratorsModal when onAdd is called', async () => {
    const onAddCollaborators = jest.fn();
    const onAdd = generateOnAddCallback(props);

    await onAdd({ onAddCollaborators });

    expect(toMountPointMock).toHaveBeenCalled();
    expect(getStartServices).toHaveBeenCalled();
  });

  it('should close the modal when onClose is called', async () => {
    const onAddCollaborators = jest.fn();
    const onAdd = generateOnAddCallback(props);

    await onAdd({ onAddCollaborators });

    const modalElement = toMountPointMock.mock.calls[0][0];

    const { getByText } = render(modalElement);

    fireEvent.click(getByText('Close'));
    expect(
      (await getStartServices.mock.results[0].value)[0].overlays.openModal.mock.results[0].value
        .close
    ).toHaveBeenCalled();
  });

  it('should call onAddCollaborators and close the modal when collaborators are added', async () => {
    const onAddCollaborators = jest.fn();
    const onAdd = generateOnAddCallback(props);

    await onAdd({ onAddCollaborators });

    const element = toMountPointMock.mock.calls[0][0];

    const { getByText } = render(element);

    fireEvent.click(getByText('Add collaborators'));
    expect(onAddCollaborators).toHaveBeenCalledWith([]);
    expect(
      (await getStartServices.mock.results[0].value)[0].overlays.openModal.mock.results[0].value
        .close
    ).toHaveBeenCalled();
  });
});

describe('registerDefaultCollaboratorTypes', () => {
  const collaboratorTypesService = new WorkspaceCollaboratorTypesService();
  const getStartServices = coreMock.createSetup().getStartServices;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should register the default collaborator types', () => {
    registerDefaultCollaboratorTypes({ collaboratorTypesService, getStartServices });

    const registeredTypes = collaboratorTypesService.getTypes$().getValue();
    expect(registeredTypes).toHaveLength(2);

    const userType = registeredTypes.find((type) => type.id === 'user');
    const groupType = registeredTypes.find((type) => type.id === 'group');

    expect(userType).toBeDefined();
    expect(groupType).toBeDefined();

    expect(userType?.name).toBe('User');
    expect(userType?.buttonLabel).toBe('Add Users');

    expect(groupType?.name).toBe('Group');
    expect(groupType?.buttonLabel).toBe('Add Groups');
  });

  it('should return consistent displayed types', () => {
    registerDefaultCollaboratorTypes({ collaboratorTypesService, getStartServices });

    const registeredTypes = collaboratorTypesService.getTypes$().getValue();
    expect(registeredTypes).toHaveLength(2);

    const userType = registeredTypes.find((type) => type.id === 'user');
    const groupType = registeredTypes.find((type) => type.id === 'group');
    const adminUserCollaborator = {
      permissionType: 'user' as const,
      collaboratorId: '',
      accessLevel: 'admin' as const,
    };
    const adminGroupCollaborator = {
      permissionType: 'group' as const,
      collaboratorId: '',
      accessLevel: 'admin' as const,
    };

    expect(userType?.getDisplayedType?.(adminUserCollaborator)).toBe('User');
    expect(userType?.getDisplayedType?.(adminGroupCollaborator)).toBeUndefined();

    expect(groupType?.getDisplayedType?.(adminUserCollaborator)).toBeUndefined();
    expect(groupType?.getDisplayedType?.(adminGroupCollaborator)).toBe('Group');
  });
});
