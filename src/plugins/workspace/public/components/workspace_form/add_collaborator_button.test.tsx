/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import { AddCollaboratorButton } from './add_collaborator_button';
import { WorkspacePermissionSetting } from './types';
import { DuplicateCollaboratorError } from '../add_collaborators_modal';

describe('AddCollaboratorButton', () => {
  const mockProps = {
    displayedTypes: [],
    permissionSettings: [
      {
        id: 0,
        modes: ['library_write', 'write'],
        type: 'user',
        userId: 'admin',
      },
      {
        id: 1,
        modes: ['library_read', 'read'],
        type: 'group',
        group: 'group',
      },
    ] as WorkspacePermissionSetting[],
    handleSubmitPermissionSettings: jest.fn(),
  };

  it('should render normally', () => {
    expect(render(<AddCollaboratorButton {...mockProps} />)).toMatchSnapshot();
  });

  it('should display menu popover when clicked', () => {
    const { getByTestId } = render(<AddCollaboratorButton {...mockProps} />);
    const button = getByTestId('add-collaborator-button');
    fireEvent.click(button);
    expect(getByTestId('add-collaborator-popover')).toBeInTheDocument();
  });

  it('should emit onAdd when clicked menu item', () => {
    const mockOnAdd = jest.fn();
    const displayedTypes = [
      {
        name: 'add user',
        buttonLabel: 'add user',
        onAdd: mockOnAdd,
        id: 'user',
      },
      {
        name: 'add group',
        buttonLabel: 'add group',
        onAdd: mockOnAdd,
        id: 'group',
      },
    ];
    const { getByTestId, getByText } = render(
      <AddCollaboratorButton {...mockProps} displayedTypes={displayedTypes} />
    );
    const button = getByTestId('add-collaborator-button');
    fireEvent.click(button);
    expect(getByTestId('add-collaborator-popover')).toBeInTheDocument();
    const addUserButton = getByText('add user');
    fireEvent.click(addUserButton);
    expect(mockOnAdd).toHaveBeenCalled();
  });

  it('should call handleSubmitPermissionSettings with newPermissionSettings when adding in modal', () => {
    const mockOnAdd = jest.fn().mockImplementation(({ onAddCollaborators }) => {
      onAddCollaborators([
        {
          accessLevel: 'readOnly',
          collaboratorId: '2',
          permissionType: 'user',
        },
      ]);
    });
    const displayedTypes = [
      {
        name: 'add user',
        buttonLabel: 'add user',
        onAdd: mockOnAdd,
        id: 'user',
      },
      {
        name: 'add group',
        buttonLabel: 'add group',
        onAdd: mockOnAdd,
        id: 'group',
      },
    ];
    const { getByTestId, getByText } = render(
      <AddCollaboratorButton {...mockProps} displayedTypes={displayedTypes} />
    );
    const button = getByTestId('add-collaborator-button');
    fireEvent.click(button);
    expect(getByTestId('add-collaborator-popover')).toBeInTheDocument();
    const addUserButton = getByText('add user');
    fireEvent.click(addUserButton);
    expect(mockOnAdd).toHaveBeenCalled();
    expect(mockProps.handleSubmitPermissionSettings).toHaveBeenCalledWith([
      { id: 0, modes: ['library_write', 'write'], type: 'user', userId: 'admin' },
      { group: 'group', id: 1, modes: ['library_read', 'read'], type: 'group' },
      { id: 2, modes: ['library_read', 'read'], type: 'user', userId: '2' },
    ]);
  });

  it('should throw DuplicateCollaboratorError with consistent details', async () => {
    let errorCached: DuplicateCollaboratorError | undefined;
    const mockOnAdd = jest.fn(async ({ onAddCollaborators }) => {
      try {
        await onAddCollaborators([
          {
            accessLevel: 'readOnly',
            collaboratorId: 'admin',
            permissionType: 'user',
          },
          {
            accessLevel: 'readOnly',
            collaboratorId: 'group',
            permissionType: 'group',
          },
          {
            accessLevel: 'readOnly',
            collaboratorId: 'new-user',
            permissionType: 'user',
          },
          {
            accessLevel: 'readOnly',
            collaboratorId: 'new-user',
            permissionType: 'user',
          },
        ]);
      } catch (e) {
        errorCached = e;
      }
    });
    const displayedTypes = [
      {
        name: 'add user',
        buttonLabel: 'add user',
        onAdd: mockOnAdd,
        id: 'user',
      },
      {
        name: 'add group',
        buttonLabel: 'add group',
        onAdd: mockOnAdd,
        id: 'group',
      },
    ];
    const { getByTestId, getByText } = render(
      <AddCollaboratorButton {...mockProps} displayedTypes={displayedTypes} />
    );
    const button = getByTestId('add-collaborator-button');
    fireEvent.click(button);
    expect(getByTestId('add-collaborator-popover')).toBeInTheDocument();
    const addUserButton = getByText('add user');
    fireEvent.click(addUserButton);
    await mockOnAdd.mock.results;

    expect(errorCached).toBeInstanceOf(DuplicateCollaboratorError);
    if (errorCached instanceof DuplicateCollaboratorError) {
      expect(errorCached.details.pendingAdded).toEqual(['new-user']);
      expect(errorCached.details.existing).toEqual(['admin', 'group']);
    }
  });
});
