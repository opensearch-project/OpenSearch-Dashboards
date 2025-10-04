/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LegendOptionsPanel } from './legend';
import { Positions } from '../../types';

jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: jest.fn().mockImplementation((id, { defaultMessage }) => defaultMessage),
  },
}));

jest.mock('../utils', () => ({
  DebouncedFieldText: (props: any) => {
    const { value, onChange, ...rest } = props;
    const testSubj = props['data-test-subj'];
    return (
      <input
        {...rest}
        data-test-subj={testSubj}
        data-testid={testSubj}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  },
}));

describe('LegendOptionsPanel', () => {
  const mockLegend = {
    show: true,
    position: Positions.BOTTOM,
    title: 'Legend Title',
    title2: 'Size Legend Title',
  };

  const mockOnLegendChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    render(
      <LegendOptionsPanel legendOptions={mockLegend} onLegendOptionsChange={mockOnLegendChange} />
    );

    const legendModeSwitch = screen.getByTestId('legendModeSwitch');
    const legendPositionSelect = screen.getByTestId('legendPositionSelect');
    const legendTitleInput = screen.getByTestId('legendTitleInput');

    expect(legendModeSwitch).toBeInTheDocument();
    expect(legendPositionSelect).toBeInTheDocument();
    expect(legendTitleInput).toBeInTheDocument();
  });

  it('renders second legend title input when hasTwoLegends is true', () => {
    render(
      <LegendOptionsPanel
        legendOptions={mockLegend}
        onLegendOptionsChange={mockOnLegendChange}
        hasTwoLegends={true}
      />
    );

    const legendTitleInput = screen.getByTestId('legendTitleInput');
    const legendTitle2Input = screen.getByTestId('legendTitle2Input');

    expect(legendTitleInput).toBeInTheDocument();
    expect(legendTitle2Input).toBeInTheDocument();
    expect(legendTitleInput).toHaveAttribute('placeholder', 'Color legend name');
    expect(legendTitle2Input).toHaveAttribute('placeholder', 'Size legend name');
  });

  it('updates legend mode correctly', () => {
    render(
      <LegendOptionsPanel legendOptions={mockLegend} onLegendOptionsChange={mockOnLegendChange} />
    );

    const legendModeSwitch = screen.getByTestId('legendModeSwitch');

    fireEvent.click(legendModeSwitch);
    expect(mockOnLegendChange).toHaveBeenLastCalledWith({
      show: false,
    });
  });

  it('updates legend position correctly', () => {
    render(
      <LegendOptionsPanel legendOptions={mockLegend} onLegendOptionsChange={mockOnLegendChange} />
    );

    const legendPositionSelect = screen.getByTestId('legendPositionSelect');

    fireEvent.change(legendPositionSelect, { target: { value: Positions.RIGHT } });
    expect(mockOnLegendChange).toHaveBeenLastCalledWith({
      position: Positions.RIGHT,
    });
  });

  it('updates legend title correctly', () => {
    render(
      <LegendOptionsPanel legendOptions={mockLegend} onLegendOptionsChange={mockOnLegendChange} />
    );

    const legendTitleInput = screen.getByTestId('legendTitleInput');

    fireEvent.change(legendTitleInput, { target: { value: 'New Legend Title' } });
    expect(mockOnLegendChange).toHaveBeenLastCalledWith({
      title: 'New Legend Title',
    });
  });

  it('updates second legend title correctly when hasTwoLegends is true', () => {
    render(
      <LegendOptionsPanel
        legendOptions={mockLegend}
        onLegendOptionsChange={mockOnLegendChange}
        hasTwoLegends={true}
      />
    );

    const legendTitle2Input = screen.getByTestId('legendTitle2Input');

    fireEvent.change(legendTitle2Input, { target: { value: 'New Size Legend Title' } });
    expect(mockOnLegendChange).toHaveBeenLastCalledWith({
      title2: 'New Size Legend Title',
    });
  });

  it('returns null when legendOptions is undefined', () => {
    const { container } = render(
      <LegendOptionsPanel
        legendOptions={undefined as any}
        onLegendOptionsChange={mockOnLegendChange}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('returns null when onLegendOptionsChange is undefined', () => {
    const { container } = render(
      <LegendOptionsPanel legendOptions={mockLegend} onLegendOptionsChange={undefined as any} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('calls stopPropagation on mouseUp for legend position select', () => {
    render(
      <LegendOptionsPanel legendOptions={mockLegend} onLegendOptionsChange={mockOnLegendChange} />
    );

    const legendPositionSelect = screen.getByTestId('legendPositionSelect');
    expect(legendPositionSelect).toBeInTheDocument(); // Verify element exists

    const stopPropagation = jest.fn();
    const mouseUpEvent = new MouseEvent('mouseup', {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(mouseUpEvent, 'stopPropagation', { value: stopPropagation });

    legendPositionSelect.dispatchEvent(mouseUpEvent);

    expect(stopPropagation).toHaveBeenCalled();
  });
});
