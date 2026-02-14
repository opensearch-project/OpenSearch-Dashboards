/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TitleOptionsPanel } from './title';
import { TitleOptions } from '../../types';

describe('TitleOptionsPanel', () => {
  const mockOnShowTitleChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders title input with placeholder', () => {
    const titleOptions: TitleOptions = {
      titleName: '',
    };

    render(
      <TitleOptionsPanel titleOptions={titleOptions} onShowTitleChange={mockOnShowTitleChange} />
    );

    const titleInput = screen.getByPlaceholderText('Panel title');
    expect(titleInput).toBeInTheDocument();
  });

  it('renders title input with existing value', () => {
    const titleOptions: TitleOptions = {
      titleName: 'Test Title',
    };

    render(
      <TitleOptionsPanel titleOptions={titleOptions} onShowTitleChange={mockOnShowTitleChange} />
    );

    const titleInput = screen.getByPlaceholderText('Panel title');
    expect(titleInput).toHaveValue('Test Title');
  });

  it('calls onShowTitleChange when title is changed', async () => {
    const titleOptions: TitleOptions = {
      titleName: '',
    };

    render(
      <TitleOptionsPanel titleOptions={titleOptions} onShowTitleChange={mockOnShowTitleChange} />
    );

    const titleInput = screen.getByPlaceholderText('Panel title');
    fireEvent.change(titleInput, { target: { value: 'New Title' } });

    // Wait for debounced update
    await waitFor(
      () => {
        expect(mockOnShowTitleChange).toHaveBeenCalledWith({ titleName: 'New Title' });
      },
      { timeout: 1000 }
    );
  });

  it('shows suggestions popover when input is focused and title is empty', () => {
    const titleOptions: TitleOptions = {
      titleName: '',
    };

    const suggestions = ['Suggestion 1', 'Suggestion 2'];

    render(
      <TitleOptionsPanel
        titleOptions={titleOptions}
        onShowTitleChange={mockOnShowTitleChange}
        suggestions={suggestions}
      />
    );

    const titleInput = screen.getByPlaceholderText('Panel title');
    fireEvent.focus(titleInput);

    // Check if suggestions are visible
    expect(screen.getByText('Suggestion 1')).toBeInTheDocument();
    expect(screen.getByText('Suggestion 2')).toBeInTheDocument();
  });

  it('calls onShowTitleChange when a suggestion is clicked', () => {
    const titleOptions: TitleOptions = {
      titleName: '',
    };

    const suggestions = ['Suggestion 1', 'Suggestion 2'];

    render(
      <TitleOptionsPanel
        titleOptions={titleOptions}
        onShowTitleChange={mockOnShowTitleChange}
        suggestions={suggestions}
      />
    );

    const titleInput = screen.getByPlaceholderText('Panel title');
    fireEvent.focus(titleInput);

    const suggestion = screen.getByText('Suggestion 1');
    fireEvent.click(suggestion);

    expect(mockOnShowTitleChange).toHaveBeenCalledWith({ titleName: 'Suggestion 1' });
  });

  it('does not show popover when title has value', () => {
    const titleOptions: TitleOptions = {
      titleName: 'Existing Title',
    };

    const suggestions = ['Suggestion 1', 'Suggestion 2'];

    render(
      <TitleOptionsPanel
        titleOptions={titleOptions}
        onShowTitleChange={mockOnShowTitleChange}
        suggestions={suggestions}
      />
    );

    const titleInput = screen.getByPlaceholderText('Panel title');
    fireEvent.focus(titleInput);

    // Suggestions should not be visible when there's already a title
    expect(screen.queryByText('Suggestion 1')).not.toBeInTheDocument();
  });

  it('renders accordion with correct label', () => {
    const titleOptions: TitleOptions = {
      titleName: '',
    };

    render(
      <TitleOptionsPanel titleOptions={titleOptions} onShowTitleChange={mockOnShowTitleChange} />
    );

    expect(screen.getByText('Panel settings')).toBeInTheDocument();
  });
});
