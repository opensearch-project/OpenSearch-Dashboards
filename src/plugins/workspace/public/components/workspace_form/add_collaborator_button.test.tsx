/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import { AddCollaboratorButton } from './add_collaborator_button';

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
    ],
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
});
