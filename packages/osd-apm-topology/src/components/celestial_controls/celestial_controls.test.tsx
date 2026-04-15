/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { CelestialControls } from './celestial_controls';
import { useCelestialControls } from './use_celestial_controls.hook';
// Mock the hook
jest.mock('./use_celestial_controls.hook', () => ({
  useCelestialControls: jest.fn(),
}));

describe('CelestialControls', () => {
  const mockOnZoomIn = jest.fn();
  const mockOnZoomOut = jest.fn();
  const mockOnFitView = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useCelestialControls as any).mockReturnValue({
      onZoomIn: mockOnZoomIn,
      onZoomOut: mockOnZoomOut,
      onFitView: mockOnFitView,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render all control buttons', () => {
    render(<CelestialControls />);

    // Check that all three buttons are present with correct accessibility labels
    expect(screen.getByLabelText('Zoom in')).toBeInTheDocument();
    expect(screen.getByLabelText('Fit view')).toBeInTheDocument();
    expect(screen.getByLabelText('Zoom out')).toBeInTheDocument();
  });

  it('should call onZoomIn when zoom in button is clicked', () => {
    render(<CelestialControls />);

    const zoomInButton = screen.getByLabelText('Zoom in');
    fireEvent.click(zoomInButton);

    expect(mockOnZoomIn).toHaveBeenCalledTimes(1);
  });

  it('should call onZoomOut when zoom out button is clicked', () => {
    render(<CelestialControls />);

    const zoomOutButton = screen.getByLabelText('Zoom out');
    fireEvent.click(zoomOutButton);

    expect(mockOnZoomOut).toHaveBeenCalledTimes(1);
  });

  it('should call onFitView when fit view button is clicked', () => {
    render(<CelestialControls />);

    const fitViewButton = screen.getByLabelText('Fit view');
    fireEvent.click(fitViewButton);

    expect(mockOnFitView).toHaveBeenCalledTimes(1);
  });
});
