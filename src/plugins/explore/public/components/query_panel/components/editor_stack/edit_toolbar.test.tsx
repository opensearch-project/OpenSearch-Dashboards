/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { EditToolbar } from './edit_toolbar';

describe('EditToolbar', () => {
  const editBtnLabel = 'TBEditBtn';
  const clearBtnLabel = 'TBClearBtn';

  it('renders and handles edit button', () => {
    const handleEditClick = jest.fn();
    render(
      <EditToolbar
        onClearEditor={jest.fn()}
        onEditClick={handleEditClick}
        editText={editBtnLabel}
        clearText={clearBtnLabel}
      />
    );
    const el = screen.getByText(editBtnLabel);
    expect(el).toBeInTheDocument();
    fireEvent.click(el);
    expect(handleEditClick).toHaveBeenCalled();
  });

  it('renders and handles clear button', () => {
    const handleClearEditor = jest.fn();
    render(
      <EditToolbar
        onClearEditor={handleClearEditor}
        onEditClick={jest.fn()}
        editText={editBtnLabel}
        clearText={clearBtnLabel}
      />
    );

    const el = screen.getByText(clearBtnLabel);
    expect(el).toBeInTheDocument();
    fireEvent.click(el);
    expect(handleClearEditor).toHaveBeenCalled();
  });
});
