/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { EditToobar } from './edit_toolbar';

describe('EditToobar', () => {
  it('renders edit and clear buttons', () => {
    render(
      <EditToobar
        onClearEditor={jest.fn()}
        onEditClick={jest.fn()}
        editText="Edit"
        clearText="Clear"
      />
    );
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Clear')).toBeInTheDocument();
  });

  it('calls handleEditClick when edit is clicked', () => {
    const handleEditClick = jest.fn();
    render(
      <EditToobar
        onClearEditor={jest.fn()}
        onEditClick={handleEditClick}
        editText="Edit"
        clearText="Clear"
      />
    );
    fireEvent.click(screen.getByText('Edit'));
    expect(handleEditClick).toHaveBeenCalled();
  });

  it('calls handleClearEditor when clear is clicked', () => {
    const handleClearEditor = jest.fn();
    render(
      <EditToobar
        onClearEditor={handleClearEditor}
        onEditClick={jest.fn()}
        editText="Edit"
        clearText="Clear"
      />
    );
    fireEvent.click(screen.getByText('Clear'));
    expect(handleClearEditor).toHaveBeenCalled();
  });
});
