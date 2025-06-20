/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PieExclusiveVisOptions } from './pie_exclusive_vis_options';

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

  it('renders exclusive settings title', () => {
    render(<PieExclusiveVisOptions {...defaultProps} />);
    expect(screen.getByText('Exclusive Settings')).toBeInTheDocument();
  });
  it('calls onChange when change is made(donut)', () => {
    render(<PieExclusiveVisOptions {...defaultProps} />);
    const reverse = screen.getAllByRole('switch')[0];
    fireEvent.click(reverse);
    expect(defaultProps.onChange).toHaveBeenCalledWith({
      ...defaultProps.styles,
      donut: false,
    });
  });
});
