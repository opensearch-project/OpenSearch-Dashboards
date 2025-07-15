/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PieExclusiveVisOptions } from './pie_exclusive_vis_options';

jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: jest.fn().mockImplementation((id, { defaultMessage }) => defaultMessage),
  },
}));

describe('PieExclusiveVisOptions', () => {
  const defaultProps = {
    styles: {
      donut: true,
      showValues: true,
      showLabels: false,
      truncate: 100,
    },
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<PieExclusiveVisOptions {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });

  it('renders pie accordion', () => {
    render(<PieExclusiveVisOptions {...defaultProps} />);
    expect(screen.getByRole('button', { expanded: true })).toBeInTheDocument();
  });

  it('calls onChange when donut button group changes', () => {
    render(<PieExclusiveVisOptions {...defaultProps} />);
    const pieButton = screen.getByTestId('pie');
    fireEvent.click(pieButton);
    expect(defaultProps.onChange).toHaveBeenCalledWith({
      ...defaultProps.styles,
      donut: false,
    });
  });

  it('calls onChange when show values switch is toggled', () => {
    render(<PieExclusiveVisOptions {...defaultProps} />);
    const showValuesSwitch = screen.getByTestId('showValuesSwtich');
    fireEvent.click(showValuesSwitch);
    expect(defaultProps.onChange).toHaveBeenCalledWith({
      ...defaultProps.styles,
      showValues: false,
    });
  });
});
