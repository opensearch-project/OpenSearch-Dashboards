/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { UnitPanel } from './unit_panel';

const mockOnUnitChange = jest.fn();

describe('UnitPanel', () => {
  beforeEach(() => {
    mockOnUnitChange.mockClear();
  });

  it('renders with placeholder when no unit selected', () => {
    render(<UnitPanel onUnitChange={mockOnUnitChange} />);
    expect(screen.getByPlaceholderText('Select a unit')).toBeInTheDocument();
  });

  it('displays selected unit name', () => {
    render(<UnitPanel unit="number" onUnitChange={mockOnUnitChange} />);
    expect(screen.getByDisplayValue('Number')).toBeInTheDocument();
  });

  it('shows trash icon when unit is selected', () => {
    render(<UnitPanel unit="number" onUnitChange={mockOnUnitChange} />);
    expect(screen.getByTestId('clearUnitButton')).toBeInTheDocument();
  });

  it('shows arrow icon when no unit selected', () => {
    render(<UnitPanel onUnitChange={mockOnUnitChange} />);
    expect(screen.getByTestId('openMenuButton')).toBeInTheDocument();
  });

  it('opens popover when input is clicked', () => {
    render(<UnitPanel onUnitChange={mockOnUnitChange} />);
    fireEvent.click(screen.getByPlaceholderText('Select a unit'));
    expect(screen.getByTestId('contextMenu')).toBeInTheDocument();
  });

  it('should show all unit category', () => {
    render(<UnitPanel onUnitChange={mockOnUnitChange} />);
    fireEvent.click(screen.getByPlaceholderText('Select a unit'));
    expect(screen.getByText('Misc')).toBeInTheDocument();
    expect(screen.getByText('Acceleration')).toBeInTheDocument();
    expect(screen.getByText('Angle')).toBeInTheDocument();
    expect(screen.getByText('Area')).toBeInTheDocument();
    expect(screen.getByText('Currency')).toBeInTheDocument();
    expect(screen.getByText('Temperature')).toBeInTheDocument();
    expect(screen.getByText('Data')).toBeInTheDocument();
    expect(screen.getByText('Time')).toBeInTheDocument();
    expect(screen.getByText('Date & time')).toBeInTheDocument();
    expect(screen.getByText('Mass')).toBeInTheDocument();
    expect(screen.getByText('Length')).toBeInTheDocument();
  });

  it('calls onUnitChange with undefined when trash icon clicked', () => {
    render(<UnitPanel unit="number" onUnitChange={mockOnUnitChange} />);
    fireEvent.click(screen.getByTestId('clearUnitButton'));
    expect(mockOnUnitChange).toHaveBeenCalledWith(undefined);
  });

  it('displays unit categories in context menu', () => {
    render(<UnitPanel onUnitChange={mockOnUnitChange} />);
    fireEvent.click(screen.getByPlaceholderText('Select a unit'));
    expect(screen.getByText('Currency')).toBeInTheDocument();
    expect(screen.getByText('Misc')).toBeInTheDocument();
  });

  describe('Currency units', () => {
    it('displays currency units when Currency category is selected', () => {
      render(<UnitPanel onUnitChange={mockOnUnitChange} />);
      fireEvent.click(screen.getByPlaceholderText('Select a unit'));
      fireEvent.click(screen.getByText('Currency'));

      expect(screen.getByText('Dollars ($)')).toBeInTheDocument();
      expect(screen.getByText('Pounds (£)')).toBeInTheDocument();
      expect(screen.getByText('Euros (€)')).toBeInTheDocument();
      expect(screen.getByText('Chinese Yuan (¥)')).toBeInTheDocument();
      expect(screen.getByText('Yen (¥)')).toBeInTheDocument();
      expect(screen.getByText('Rubles (₽)')).toBeInTheDocument();
    });

    it('selects dollars currency unit', () => {
      render(<UnitPanel onUnitChange={mockOnUnitChange} />);
      fireEvent.click(screen.getByPlaceholderText('Select a unit'));
      fireEvent.click(screen.getByText('Currency'));
      fireEvent.click(screen.getByText('Dollars ($)'));

      expect(mockOnUnitChange).toHaveBeenCalledWith('dollars');
    });

    it('selects euro currency unit', () => {
      render(<UnitPanel onUnitChange={mockOnUnitChange} />);
      fireEvent.click(screen.getByPlaceholderText('Select a unit'));
      fireEvent.click(screen.getByText('Currency'));
      fireEvent.click(screen.getByText('Euros (€)'));

      expect(mockOnUnitChange).toHaveBeenCalledWith('euro');
    });

    it('displays selected currency unit name', () => {
      render(<UnitPanel unit="dollars" onUnitChange={mockOnUnitChange} />);
      expect(screen.getByDisplayValue('Dollars ($)')).toBeInTheDocument();
    });
  });
});
