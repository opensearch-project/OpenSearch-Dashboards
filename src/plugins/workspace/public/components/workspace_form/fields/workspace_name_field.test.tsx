/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

import { MAX_WORKSPACE_NAME_LENGTH } from '../../../../common/constants';
import { WorkspaceNameField } from './workspace_name_field';

describe('<WorkspaceNameField />', () => {
  it('should call onChange when the new value', () => {
    const onChangeMock = jest.fn();
    const value = 'test';

    render(<WorkspaceNameField value={value} onChange={onChangeMock} />);

    const input = screen.getByPlaceholderText('Enter a name');
    fireEvent.change(input, { target: { value: 'new value' } });

    expect(onChangeMock).toHaveBeenCalledWith('new value');

    fireEvent.change(input, { target: { value: 'a'.repeat(MAX_WORKSPACE_NAME_LENGTH + 1) } });

    expect(onChangeMock).toHaveBeenCalledWith('a'.repeat(MAX_WORKSPACE_NAME_LENGTH + 1));
  });

  it('should render the correct number of characters left when value greater than MAX_WORKSPACE_NAME_LENGTH', () => {
    render(
      <WorkspaceNameField value={'a'.repeat(MAX_WORKSPACE_NAME_LENGTH + 1)} onChange={jest.fn()} />
    );

    const helpText = screen.getByText(new RegExp(`-1.+characters left\.`));
    expect(helpText).toBeInTheDocument();
  });

  it('should render the correct number of characters left when value is empty', () => {
    render(<WorkspaceNameField value={undefined} onChange={jest.fn()} />);

    const helpText = screen.getByText(
      new RegExp(`${MAX_WORKSPACE_NAME_LENGTH}.+characters left\.`)
    );
    expect(helpText).toBeInTheDocument();
  });
});
