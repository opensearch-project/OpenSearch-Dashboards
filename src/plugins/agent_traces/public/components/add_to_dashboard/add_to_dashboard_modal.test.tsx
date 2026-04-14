/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddToDashboardModal } from './add_to_dashboard_modal';
import { SavedObjectsClientContract } from 'opensearch-dashboards/public';

const mockSavedAgentTraces = { id: 'saved-1', title: 'Test Traces' };

jest.mock('../../application/utils/hooks/use_saved_agent_traces', () => ({
  useSavedAgentTraces: jest.fn(() => ({
    savedAgentTraces: mockSavedAgentTraces,
  })),
}));

const mockDashboards = [
  { id: 'dash-1', attributes: { title: 'Dashboard 1' }, type: 'dashboard', references: [] },
  { id: 'dash-2', attributes: { title: 'Dashboard 2' }, type: 'dashboard', references: [] },
];

jest.mock('../../application/utils/hooks/use_existing_dashboard', () => ({
  useExistingDashboard: jest.fn(() => ({
    dashboardsToShow: mockDashboards,
    selectedDashboard: null,
    isSearching: false,
    setSelectedDashboard: jest.fn(),
    searchDashboards: jest.fn(),
    loadAllDashboards: jest.fn(),
  })),
}));

const mockSavedObjectsClient = ({
  find: jest.fn(),
} as unknown) as SavedObjectsClientContract;

/** Helper to get the actual radio input inside an EuiRadio wrapper */
const getRadioInput = (testSubj: string) => {
  const wrapper = screen.getByTestId(testSubj);
  return wrapper.querySelector('input[type="radio"]') as HTMLInputElement;
};

describe('AddToDashboardModal', () => {
  const defaultProps = {
    savedAgentTracesId: 'saved-1',
    savedObjectsClient: mockSavedObjectsClient,
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render modal with title', () => {
    render(<AddToDashboardModal {...defaultProps} />);
    expect(screen.getByTestId('agentTracesAddToDashboardModalTitle')).toBeInTheDocument();
    expect(screen.getByText('Save and Add to Dashboard')).toBeInTheDocument();
  });

  it('should render radio options for existing and new dashboard', () => {
    render(<AddToDashboardModal {...defaultProps} />);
    expect(screen.getByTestId('saveToExistingDashboardRadio')).toBeInTheDocument();
    expect(screen.getByTestId('saveToNewDashboardRadio')).toBeInTheDocument();
  });

  it('should default to existing dashboard option', () => {
    render(<AddToDashboardModal {...defaultProps} />);
    const existingInput = getRadioInput('saveToExistingDashboardRadio');
    expect(existingInput.checked).toBe(true);
  });

  it('should show dashboard combo box when existing option is selected', () => {
    render(<AddToDashboardModal {...defaultProps} />);
    expect(screen.getByText('Select a dashboard')).toBeInTheDocument();
  });

  it('should show dashboard name input when new option is selected', () => {
    render(<AddToDashboardModal {...defaultProps} />);
    const newInput = getRadioInput('saveToNewDashboardRadio');
    fireEvent.click(newInput);
    expect(screen.getByText('Dashboard name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter dashboard name')).toBeInTheDocument();
  });

  it('should have Add button disabled when title is empty', () => {
    render(<AddToDashboardModal {...defaultProps} />);
    const addButton = screen.getByTestId('saveToDashboardConfirmButton');
    expect(addButton).toBeDisabled();
  });

  it('should call onCancel when Cancel button is clicked', () => {
    render(<AddToDashboardModal {...defaultProps} />);
    fireEvent.click(screen.getByTestId('saveToDashboardCancelButton'));
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('should render save search name input', () => {
    render(<AddToDashboardModal {...defaultProps} />);
    expect(screen.getByText('Save search')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter save search name')).toBeInTheDocument();
  });

  it('should call onConfirm with correct props when saving with new dashboard', async () => {
    const onConfirm = jest.fn().mockResolvedValue(undefined);
    render(<AddToDashboardModal {...defaultProps} onConfirm={onConfirm} />);

    // Switch to new dashboard
    fireEvent.click(getRadioInput('saveToNewDashboardRadio'));

    // Fill in dashboard name
    fireEvent.change(screen.getByPlaceholderText('Enter dashboard name'), {
      target: { value: 'My New Dashboard' },
    });

    // Fill in search name (title)
    fireEvent.change(screen.getByPlaceholderText('Enter save search name'), {
      target: { value: 'My Search' },
    });

    // Click Add
    const addButton = screen.getByTestId('saveToDashboardConfirmButton');
    expect(addButton).not.toBeDisabled();
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith(
        expect.objectContaining({
          savedAgentTraces: mockSavedAgentTraces,
          newTitle: 'My Search',
          mode: 'new',
          newDashboardName: 'My New Dashboard',
        })
      );
    });
  });
});
