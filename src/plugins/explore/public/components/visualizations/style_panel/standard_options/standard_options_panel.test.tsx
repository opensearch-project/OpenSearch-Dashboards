/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { StandardOptionsPanel, StandardOptionsPanelProps } from './standard_options_panel';

jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: jest.fn().mockImplementation((id, { defaultMessage }) => defaultMessage),
  },
}));

jest.mock('./min_max_control', () => ({
  MinMaxControls: jest.fn(({ min, max, onMinChange, onMaxChange }) => (
    <div data-testid="min-max-controls">
      <input
        data-test-subj="thresholdMinBase"
        onChange={(e) => onMinChange(Number(e.target.value))}
      />
      <input
        data-test-subj="thresholdMaxBase"
        onChange={(e) => onMaxChange(Number(e.target.value))}
      />
    </div>
  )),
}));

jest.mock('../style_accordion', () => ({
  StyleAccordion: ({ children, accordionLabel }: any) => (
    <div data-test-subj="standardOptions">
      <div>{accordionLabel}</div>
      {children}
    </div>
  ),
}));

describe('StandardOptionsPanel', () => {
  // @ts-expect-error TS2741 TODO(ts-error): fixme
  const mockProps: StandardOptionsPanelProps = {
    min: 10,
    max: 100,
    onMinChange: jest.fn(),
    onMaxChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the standard options accordion', () => {
    render(<StandardOptionsPanel {...mockProps} />);

    expect(screen.getByTestId('standardOptions')).toBeInTheDocument();
    expect(screen.getByText('Standard options')).toBeInTheDocument();
  });

  it('renders MinMaxControls with correct props', () => {
    render(<StandardOptionsPanel {...mockProps} />);

    expect(screen.getByTestId('thresholdMinBase')).toBeInTheDocument();
    expect(screen.getByTestId('thresholdMaxBase')).toBeInTheDocument();
  });

  it('calls onStyleChange when min value is changed', () => {
    render(<StandardOptionsPanel {...mockProps} />);

    const minInput = screen.getByTestId('thresholdMinBase');
    fireEvent.change(minInput, { target: { value: 50 } });

    expect(mockProps.onMinChange).toHaveBeenCalledWith(50);
  });

  it('calls onStyleChange when max value is changed', () => {
    render(<StandardOptionsPanel {...mockProps} />);

    const maxInput = screen.getByTestId('thresholdMaxBase');
    fireEvent.change(maxInput, { target: { value: 50 } });

    expect(mockProps.onMaxChange).toHaveBeenCalledWith(50);
  });
});
