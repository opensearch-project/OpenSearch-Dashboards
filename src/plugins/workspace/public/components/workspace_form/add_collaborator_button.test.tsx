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
    onChange: jest.fn(),
    permissionSettings: [],
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
    const displayedTypes = [
      {
        name: 'add user',
        buttonLabel: 'add user',
        onAdd: jest.fn(),
        id: '',
      },
      {
        name: 'add group',
        buttonLabel: 'add group',
        onAdd: jest.fn(),
        id: '',
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
    expect(displayedTypes[0].onAdd).toHaveBeenCalled();
  });
});
