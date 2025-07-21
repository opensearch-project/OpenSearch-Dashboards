/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { coreMock } from '../../../../../core/public/mocks';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import { AddToDashboardModal } from './add_to_dashboard_modal'; // adjust path if needed

const mockSavedObjectsClient = coreMock.createStart().savedObjects.client;
const mockOnConfirm = jest.fn();
const mockOnCancel = jest.fn();

jest.mock('../../application/utils/hooks/use_saved_explore', () => ({
  useSavedExplore: (id: string) => ({
    savedExplore: { id, title: 'Old Title' },
  }),
}));

describe('AddToDashboardModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSavedObjectsClient.find = jest.fn().mockResolvedValue({
      savedObjects: [
        { id: 'dash-1', attributes: { title: 'Dashboard One' } },
        { id: 'dash-2', attributes: { title: 'Dashboard Two' } },
      ],
    });
  });

  it('renders modal with initial state', async () => {
    render(
      <AddToDashboardModal
        savedObjectsClient={mockSavedObjectsClient}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        savedExploreId="explore-1"
      />
    );

    expect(await screen.findByText('Save and Add to Dashboard')).toBeInTheDocument();
    expect(screen.getByLabelText('Save to existing dashboard')).toBeChecked();
    expect(screen.getByLabelText('Save to new dashboard')).not.toBeChecked();
  });

  it('allows entering a title and selecting an existing dashboard', async () => {
    render(
      <AddToDashboardModal
        savedObjectsClient={mockSavedObjectsClient}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        savedExploreId="explore-1"
      />
    );

    const titleInput = await screen.findByPlaceholderText('Enter save search name');
    fireEvent.change(titleInput, { target: { value: 'My Saved Explore' } });

    const select = await screen.findByLabelText('Select a dashboard');
    fireEvent.change(select, { target: { value: 'dash-2' } });

    const addButton = screen.getByRole('button', { name: 'Add' });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Add' })).toBeEnabled();
    });

    fireEvent.click(addButton);

    await waitFor(() =>
      expect(mockOnConfirm).toHaveBeenCalledWith(
        expect.objectContaining({
          newTitle: 'My Saved Explore',
          mode: 'existing',
          selectDashboard: expect.objectContaining({ id: 'dash-2' }),
        })
      )
    );
  });

  it('allows entering a new dashboard name when "new" is selected', async () => {
    render(
      <AddToDashboardModal
        savedObjectsClient={mockSavedObjectsClient}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        savedExploreId="explore-1"
      />
    );

    const newRadio = screen.getByLabelText('Save to new dashboard');
    fireEvent.click(newRadio);

    const newDashboardInput = await screen.findByPlaceholderText('Enter dashboard name');
    fireEvent.change(newDashboardInput, { target: { value: 'New Dashboard' } });

    const titleInput = await screen.findByPlaceholderText('Enter save search name');
    fireEvent.change(titleInput, { target: { value: 'Explore Title' } });

    const addButton = screen.getByRole('button', { name: 'Add' });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Add' })).toBeEnabled();
    });

    fireEvent.click(addButton);

    await waitFor(() =>
      expect(mockOnConfirm).toHaveBeenCalledWith(
        expect.objectContaining({
          newDashboardName: 'New Dashboard',
          newTitle: 'Explore Title',
          mode: 'new',
        })
      )
    );
  });

  it('disables "Add" button when title is empty', async () => {
    render(
      <AddToDashboardModal
        savedObjectsClient={mockSavedObjectsClient}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        savedExploreId="explore-1"
      />
    );

    const addButton = await screen.findByRole('button', { name: 'Add' });
    expect(addButton).toBeDisabled();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    render(
      <AddToDashboardModal
        savedObjectsClient={mockSavedObjectsClient}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        savedExploreId="explore-1"
      />
    );

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });
});
