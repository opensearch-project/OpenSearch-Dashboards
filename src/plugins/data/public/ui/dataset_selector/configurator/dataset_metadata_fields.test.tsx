/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { IntlProvider } from 'react-intl';
import { DatasetMetadataFields } from './dataset_metadata_fields';

const renderWithIntl = (component: React.ReactElement) => {
  return render(<IntlProvider locale="en">{component}</IntlProvider>);
};

describe('DatasetMetadataFields', () => {
  const mockOnDisplayNameChange = jest.fn();
  const mockOnDescriptionChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders both input fields', () => {
    renderWithIntl(
      <DatasetMetadataFields
        displayName=""
        description=""
        onDisplayNameChange={mockOnDisplayNameChange}
        onDescriptionChange={mockOnDescriptionChange}
      />
    );

    expect(screen.getByText('Dataset name')).toBeInTheDocument();
    expect(screen.getByText('Dataset description')).toBeInTheDocument();
    expect(screen.getByTestId('datasetNameInput')).toBeInTheDocument();
    expect(screen.getByTestId('datasetDescriptionInput')).toBeInTheDocument();
  });

  it('displays provided displayName value', () => {
    renderWithIntl(
      <DatasetMetadataFields
        displayName="My Dataset"
        description=""
        onDisplayNameChange={mockOnDisplayNameChange}
        onDescriptionChange={mockOnDescriptionChange}
      />
    );

    const input = screen.getByTestId('datasetNameInput') as HTMLInputElement;
    expect(input.value).toBe('My Dataset');
  });

  it('displays provided description value', () => {
    renderWithIntl(
      <DatasetMetadataFields
        displayName=""
        description="This is a test description"
        onDisplayNameChange={mockOnDisplayNameChange}
        onDescriptionChange={mockOnDescriptionChange}
      />
    );

    const textarea = screen.getByTestId('datasetDescriptionInput') as HTMLTextAreaElement;
    expect(textarea.value).toBe('This is a test description');
  });

  it('calls onDisplayNameChange when name input changes', () => {
    renderWithIntl(
      <DatasetMetadataFields
        displayName=""
        description=""
        onDisplayNameChange={mockOnDisplayNameChange}
        onDescriptionChange={mockOnDescriptionChange}
      />
    );

    const input = screen.getByTestId('datasetNameInput');
    fireEvent.change(input, { target: { value: 'New Name' } });

    expect(mockOnDisplayNameChange).toHaveBeenCalledTimes(1);
    expect(mockOnDisplayNameChange).toHaveBeenCalledWith('New Name');
  });

  it('calls onDescriptionChange when description textarea changes', () => {
    renderWithIntl(
      <DatasetMetadataFields
        displayName=""
        description=""
        onDisplayNameChange={mockOnDisplayNameChange}
        onDescriptionChange={mockOnDescriptionChange}
      />
    );

    const textarea = screen.getByTestId('datasetDescriptionInput');
    fireEvent.change(textarea, { target: { value: 'New Description' } });

    expect(mockOnDescriptionChange).toHaveBeenCalledTimes(1);
    expect(mockOnDescriptionChange).toHaveBeenCalledWith('New Description');
  });

  it('does not show warning by default', () => {
    renderWithIntl(
      <DatasetMetadataFields
        displayName=""
        description=""
        onDisplayNameChange={mockOnDisplayNameChange}
        onDescriptionChange={mockOnDescriptionChange}
      />
    );

    expect(
      screen.queryByText('This data type does not support saving as a dataset.')
    ).not.toBeInTheDocument();
  });

  it('shows warning when showAsyncWarning is true', () => {
    renderWithIntl(
      <DatasetMetadataFields
        displayName=""
        description=""
        onDisplayNameChange={mockOnDisplayNameChange}
        onDescriptionChange={mockOnDescriptionChange}
        showAsyncWarning={true}
      />
    );

    expect(
      screen.getByText('This data type does not support saving as a dataset.')
    ).toBeInTheDocument();
  });

  it('does not show warning when showAsyncWarning is false', () => {
    renderWithIntl(
      <DatasetMetadataFields
        displayName=""
        description=""
        onDisplayNameChange={mockOnDisplayNameChange}
        onDescriptionChange={mockOnDescriptionChange}
        showAsyncWarning={false}
      />
    );

    expect(
      screen.queryByText('This data type does not support saving as a dataset.')
    ).not.toBeInTheDocument();
  });

  it('handles empty strings for displayName and description', () => {
    renderWithIntl(
      <DatasetMetadataFields
        onDisplayNameChange={mockOnDisplayNameChange}
        onDescriptionChange={mockOnDescriptionChange}
      />
    );

    const input = screen.getByTestId('datasetNameInput') as HTMLInputElement;
    const textarea = screen.getByTestId('datasetDescriptionInput') as HTMLTextAreaElement;

    expect(input.value).toBe('');
    expect(textarea.value).toBe('');
  });

  it('allows multiple changes to inputs', () => {
    renderWithIntl(
      <DatasetMetadataFields
        displayName=""
        description=""
        onDisplayNameChange={mockOnDisplayNameChange}
        onDescriptionChange={mockOnDescriptionChange}
      />
    );

    const input = screen.getByTestId('datasetNameInput');
    const textarea = screen.getByTestId('datasetDescriptionInput');

    fireEvent.change(input, { target: { value: 'First' } });
    fireEvent.change(input, { target: { value: 'Second' } });
    fireEvent.change(textarea, { target: { value: 'Desc 1' } });
    fireEvent.change(textarea, { target: { value: 'Desc 2' } });

    expect(mockOnDisplayNameChange).toHaveBeenCalledTimes(2);
    expect(mockOnDescriptionChange).toHaveBeenCalledTimes(2);
  });
});
