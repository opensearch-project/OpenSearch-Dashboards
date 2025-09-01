/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TitleOptionsPanel } from './title';
import { TitleOptions } from '../../types';

describe('TitleOptionsPanel', () => {
  const mockTitle: TitleOptions = {
    show: true,
    titleName: 'Test Title',
  };

  const mockOnShowTitleChange = jest.fn();

  it('renders title options', () => {
    render(
      <TitleOptionsPanel titleOptions={mockTitle} onShowTitleChange={mockOnShowTitleChange} />
    );
    const titleSwitch = screen.getByTestId('titleModeSwitch');
    expect(titleSwitch).toBeInTheDocument();
  });

  it('updates show title option', () => {
    render(
      <TitleOptionsPanel titleOptions={mockTitle} onShowTitleChange={mockOnShowTitleChange} />
    );

    const titleSwitch = screen.getByTestId('titleModeSwitch');

    fireEvent.click(titleSwitch);
    expect(mockOnShowTitleChange).toHaveBeenLastCalledWith({
      show: false,
    });
  });

  it('hides title input when show is false', () => {
    const hiddenTitleOptions: TitleOptions = {
      show: false,
      titleName: 'Test Title',
    };

    render(
      <TitleOptionsPanel
        titleOptions={hiddenTitleOptions}
        onShowTitleChange={mockOnShowTitleChange}
      />
    );

    const titleInput = screen.queryByPlaceholderText('Default title');
    expect(titleInput).not.toBeInTheDocument();
  });
});
