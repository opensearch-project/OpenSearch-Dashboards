/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateDatasetButton } from './create_dataset_button';
import { CORE_SIGNAL_TYPES } from '../../../../data/common';

describe('CreateDatasetButton', () => {
  const mockOnCreateDataset = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the button with correct text', () => {
    render(
      <CreateDatasetButton onCreateDataset={mockOnCreateDataset}>
        Create Dataset
      </CreateDatasetButton>
    );

    const button = screen.getByTestId('createDatasetButton');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Create Dataset');
  });

  it('renders with custom children', () => {
    render(
      <CreateDatasetButton onCreateDataset={mockOnCreateDataset}>Custom Text</CreateDatasetButton>
    );

    expect(screen.getByText('Custom Text')).toBeInTheDocument();
  });

  it('opens popover when button is clicked', async () => {
    render(
      <CreateDatasetButton onCreateDataset={mockOnCreateDataset}>
        Create Dataset
      </CreateDatasetButton>
    );

    const button = screen.getByTestId('createDatasetButton');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Logs')).toBeInTheDocument();
      expect(screen.getByText('Traces')).toBeInTheDocument();
    });
  });

  it('closes popover when button is clicked again', async () => {
    render(
      <CreateDatasetButton onCreateDataset={mockOnCreateDataset}>
        Create Dataset
      </CreateDatasetButton>
    );

    const button = screen.getByTestId('createDatasetButton');

    // Open popover
    fireEvent.click(button);
    await waitFor(() => {
      expect(screen.getByText('Logs')).toBeInTheDocument();
    });

    // Close popover
    fireEvent.click(button);
    await waitFor(() => {
      expect(screen.queryByText('Logs')).not.toBeInTheDocument();
    });
  });

  it('calls onCreateDataset with LOGS signal type when Logs option is clicked', async () => {
    render(
      <CreateDatasetButton onCreateDataset={mockOnCreateDataset}>
        Create Dataset
      </CreateDatasetButton>
    );

    const button = screen.getByTestId('createDatasetButton');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByTestId('createLogsDataset')).toBeInTheDocument();
    });

    const logsOption = screen.getByTestId('createLogsDataset');
    fireEvent.click(logsOption);

    expect(mockOnCreateDataset).toHaveBeenCalledTimes(1);
    expect(mockOnCreateDataset).toHaveBeenCalledWith(CORE_SIGNAL_TYPES.LOGS);
  });

  it('calls onCreateDataset with TRACES signal type when Traces option is clicked', async () => {
    render(
      <CreateDatasetButton onCreateDataset={mockOnCreateDataset}>
        Create Dataset
      </CreateDatasetButton>
    );

    const button = screen.getByTestId('createDatasetButton');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByTestId('createTracesDataset')).toBeInTheDocument();
    });

    const tracesOption = screen.getByTestId('createTracesDataset');
    fireEvent.click(tracesOption);

    expect(mockOnCreateDataset).toHaveBeenCalledTimes(1);
    expect(mockOnCreateDataset).toHaveBeenCalledWith(CORE_SIGNAL_TYPES.TRACES);
  });

  it('closes popover after selecting an option', async () => {
    render(
      <CreateDatasetButton onCreateDataset={mockOnCreateDataset}>
        Create Dataset
      </CreateDatasetButton>
    );

    const button = screen.getByTestId('createDatasetButton');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByTestId('createLogsDataset')).toBeInTheDocument();
    });

    const logsOption = screen.getByTestId('createLogsDataset');
    fireEvent.click(logsOption);

    await waitFor(() => {
      expect(screen.queryByText('Logs')).not.toBeInTheDocument();
    });
  });

  it('displays correct labels for signal type options', async () => {
    render(
      <CreateDatasetButton onCreateDataset={mockOnCreateDataset}>
        Create Dataset
      </CreateDatasetButton>
    );

    const button = screen.getByTestId('createDatasetButton');
    fireEvent.click(button);

    await waitFor(() => {
      // Check labels
      expect(screen.getByText('Logs')).toBeInTheDocument();
      expect(screen.getByText('Traces')).toBeInTheDocument();

      // Check descriptions
      expect(screen.getByText('Create a dataset for log data')).toBeInTheDocument();
      expect(screen.getByText('Create a dataset for trace data')).toBeInTheDocument();
    });
  });

  it('button has correct attributes', () => {
    render(
      <CreateDatasetButton onCreateDataset={mockOnCreateDataset}>
        Create Dataset
      </CreateDatasetButton>
    );

    const button = screen.getByTestId('createDatasetButton');
    expect(button).toHaveAttribute('data-test-subj', 'createDatasetButton');
  });

  it('popover options have correct test subjects', async () => {
    render(
      <CreateDatasetButton onCreateDataset={mockOnCreateDataset}>
        Create Dataset
      </CreateDatasetButton>
    );

    const button = screen.getByTestId('createDatasetButton');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByTestId('createLogsDataset')).toBeInTheDocument();
      expect(screen.getByTestId('createTracesDataset')).toBeInTheDocument();
    });
  });
});
