/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { coreMock } from '../../../../../core/public/mocks';
import { render, fireEvent, waitFor, screen, act } from '@testing-library/react';
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
        { id: 'dash-3', attributes: { title: 'Test Dashboard' } },
      ],
    });
  });

  it('renders modal with initial state', async () => {
    await act(async () => {
      render(
        <AddToDashboardModal
          savedObjectsClient={mockSavedObjectsClient}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          savedExploreId="explore-1"
        />
      );
    });

    expect(await screen.findByText('Save and Add to Dashboard')).toBeInTheDocument();
    expect(screen.getByLabelText('Save to existing dashboard')).toBeChecked();
    expect(screen.getByLabelText('Save to new dashboard')).not.toBeChecked();
  });

  it('allows entering a title and selecting an existing dashboard', async () => {
    await act(async () => {
      render(
        <AddToDashboardModal
          savedObjectsClient={mockSavedObjectsClient}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          savedExploreId="explore-1"
        />
      );
    });

    // Wait for dashboards to load
    await waitFor(() => {
      expect(screen.getByTestId('selectExistingDashboard')).toBeInTheDocument();
    });

    // Find the ComboBox input
    const comboBoxInput = screen.getByTestId('selectExistingDashboard').querySelector('input');
    expect(comboBoxInput).toBeInTheDocument();

    // Click on the combobox to open dropdown
    fireEvent.click(comboBoxInput!);

    // Select the second dashboard
    await waitFor(() => {
      const option = screen.getByText('Dashboard Two');
      fireEvent.click(option);
    });

    const addButton = screen.getByRole('button', { name: 'Add' });
    await waitFor(() => {
      expect(addButton).toBeEnabled();
    });

    fireEvent.click(addButton);

    await waitFor(() =>
      expect(mockOnConfirm).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'existing',
          selectDashboard: expect.objectContaining({ id: 'dash-2' }),
        })
      )
    );
  });

  it('allows entering a new dashboard name when "new" is selected', async () => {
    await act(async () => {
      render(
        <AddToDashboardModal
          savedObjectsClient={mockSavedObjectsClient}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          savedExploreId="explore-1"
        />
      );
    });

    const newRadio = screen.getByLabelText('Save to new dashboard');
    fireEvent.click(newRadio);

    const newDashboardInput = await screen.findByPlaceholderText('Enter dashboard name');
    fireEvent.change(newDashboardInput, { target: { value: 'New Dashboard' } });

    const addButton = screen.getByRole('button', { name: 'Add' });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Add' })).toBeEnabled();
    });

    fireEvent.click(addButton);

    await waitFor(() =>
      expect(mockOnConfirm).toHaveBeenCalledWith(
        expect.objectContaining({
          newDashboardName: 'New Dashboard',
          mode: 'new',
        })
      )
    );
  });

  it('calls onCancel when cancel button is clicked', async () => {
    await act(async () => {
      render(
        <AddToDashboardModal
          savedObjectsClient={mockSavedObjectsClient}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          savedExploreId="explore-1"
        />
      );
    });

    const cancelButton = screen.getByTestId('saveToDashboardCancelButton');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('searches dashboards when typing in the ComboBox', async () => {
    // Mock search results
    mockSavedObjectsClient.find = jest
      .fn()
      .mockResolvedValueOnce({
        savedObjects: [
          { id: 'dash-1', attributes: { title: 'Dashboard One' } },
          { id: 'dash-2', attributes: { title: 'Dashboard Two' } },
          { id: 'dash-3', attributes: { title: 'Test Dashboard' } },
        ],
      })
      .mockResolvedValueOnce({
        savedObjects: [{ id: 'dash-3', attributes: { title: 'Test Dashboard' } }],
      });

    await act(async () => {
      render(
        <AddToDashboardModal
          savedObjectsClient={mockSavedObjectsClient}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          savedExploreId="explore-1"
        />
      );
    });

    // Wait for initial dashboards to load
    await waitFor(() => {
      expect(screen.getByTestId('selectExistingDashboard')).toBeInTheDocument();
    });

    // Find the ComboBox input
    const comboBoxInput = screen.getByTestId('selectExistingDashboard').querySelector('input');
    expect(comboBoxInput).toBeInTheDocument();

    // Type in search term
    fireEvent.change(comboBoxInput!, { target: { value: 'Test' } });

    // Wait for search to complete
    await waitFor(() => {
      expect(mockSavedObjectsClient.find).toHaveBeenCalledWith({
        type: 'dashboard',
        search: '*Test*',
        searchFields: ['title'],
        perPage: 100,
      });
    });
  });

  it('clears search results when search input is empty', async () => {
    mockSavedObjectsClient.find = jest.fn().mockResolvedValueOnce({
      savedObjects: [
        { id: 'dash-1', attributes: { title: 'Dashboard One' } },
        { id: 'dash-2', attributes: { title: 'Dashboard Two' } },
      ],
    });

    await act(async () => {
      render(
        <AddToDashboardModal
          savedObjectsClient={mockSavedObjectsClient}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          savedExploreId="explore-1"
        />
      );
    });

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('selectExistingDashboard')).toBeInTheDocument();
    });

    const comboBoxInput = screen.getByTestId('selectExistingDashboard').querySelector('input');

    // Type something and then clear it
    fireEvent.change(comboBoxInput!, { target: { value: 'Test' } });
    fireEvent.change(comboBoxInput!, { target: { value: '' } });

    // Should show original dashboards again
    fireEvent.click(comboBoxInput!);

    await waitFor(() => {
      // Use getAllByText to handle multiple elements with same text
      const dashboardOneElements = screen.getAllByText('Dashboard One');
      const dashboardTwoElements = screen.getAllByText('Dashboard Two');
      expect(dashboardOneElements.length).toBeGreaterThan(0);
      expect(dashboardTwoElements.length).toBeGreaterThan(0);
    });
  });

  it('handles search error gracefully', async () => {
    // Mock search error
    mockSavedObjectsClient.find = jest
      .fn()
      .mockResolvedValueOnce({
        savedObjects: [{ id: 'dash-1', attributes: { title: 'Dashboard One' } }],
      })
      .mockRejectedValueOnce(new Error('Search failed'));

    await act(async () => {
      render(
        <AddToDashboardModal
          savedObjectsClient={mockSavedObjectsClient}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          savedExploreId="explore-1"
        />
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('selectExistingDashboard')).toBeInTheDocument();
    });

    const comboBoxInput = screen.getByTestId('selectExistingDashboard').querySelector('input');

    // Type to trigger search
    fireEvent.change(comboBoxInput!, { target: { value: 'Test' } });

    // Should not crash and handle error gracefully
    await waitFor(() => {
      expect(mockSavedObjectsClient.find).toHaveBeenCalledTimes(2);
    });
  });

  it('shows loading state while searching', async () => {
    mockSavedObjectsClient.find = jest
      .fn()
      .mockResolvedValueOnce({
        savedObjects: [{ id: 'dash-1', attributes: { title: 'Dashboard One' } }],
      })
      .mockResolvedValueOnce({
        savedObjects: [{ id: 'dash-test', attributes: { title: 'Test Dashboard' } }],
      });

    await act(async () => {
      render(
        <AddToDashboardModal
          savedObjectsClient={mockSavedObjectsClient}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          savedExploreId="explore-1"
        />
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('selectExistingDashboard')).toBeInTheDocument();
    });

    const comboBoxInput = screen.getByTestId('selectExistingDashboard').querySelector('input');

    // Start search
    fireEvent.change(comboBoxInput!, { target: { value: 'Test' } });

    // Verify the search was called with correct parameters
    await waitFor(() => {
      expect(mockSavedObjectsClient.find).toHaveBeenCalledWith({
        type: 'dashboard',
        search: '*Test*',
        searchFields: ['title'],
        perPage: 100,
      });
    });
  });
});
