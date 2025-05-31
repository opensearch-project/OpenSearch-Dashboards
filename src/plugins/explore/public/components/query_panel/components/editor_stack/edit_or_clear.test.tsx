/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { EditOrClear } from './edit_or_clear';

describe('EditOrClear', () => {
  it('renders edit and clear buttons', () => {
    render(
      <EditOrClear
        handleClearEditor={jest.fn()}
        handleEditClick={jest.fn()}
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
      <EditOrClear
        handleClearEditor={jest.fn()}
        handleEditClick={handleEditClick}
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
      <EditOrClear
        handleClearEditor={handleClearEditor}
        handleEditClick={jest.fn()}
        editText="Edit"
        clearText="Clear"
      />
    );
    fireEvent.click(screen.getByText('Clear'));
    expect(handleClearEditor).toHaveBeenCalled();
  });
});
