/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterPanelToggle } from './filter_panel_toggle';
import { useDispatch, useSelector } from 'react-redux';

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  return {
    ...actual,
    useDispatch: jest.fn(),
    useSelector: jest.fn(),
  };
});

describe('FilterPanelToggle', () => {
  const mockDispatch = jest.fn();

  beforeEach(() => {
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    jest.clearAllMocks();
  });

  it('shows "Show Fields" label when fields are hidden', () => {
    (useSelector as jest.Mock).mockReturnValue(false);

    render(<FilterPanelToggle />);
    expect(screen.getByText('Show Fields')).toBeInTheDocument();
  });

  it('shows "Hide Fields" label when fields are shown', () => {
    (useSelector as jest.Mock).mockReturnValue(true);

    render(<FilterPanelToggle />);
    expect(screen.getByText('Hide Fields')).toBeInTheDocument();
  });

  it('dispatches setShowDatasetFields with toggled value on click', () => {
    (useSelector as jest.Mock).mockReturnValue(true);

    render(<FilterPanelToggle />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: expect.any(String), payload: false })
    );
  });
});
