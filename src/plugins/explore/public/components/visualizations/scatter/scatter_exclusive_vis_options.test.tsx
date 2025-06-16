/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScatterExclusiveVisOptions } from './scatter_exclusive_vis_options';
import { PointShape } from '../types';

describe('ScatterExclusiveVisOptions', () => {
  const defaultProps = {
    styles: {
      pointShape: PointShape.CIRCLE,
      angle: 0,
      filled: false,
    },
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<ScatterExclusiveVisOptions {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });

  it('renders exclusive settings title', () => {
    render(<ScatterExclusiveVisOptions {...defaultProps} />);
    expect(screen.getByText('Exclusive Settings')).toBeInTheDocument();
  });
  it('calls onChange when change is made(filled)', () => {
    render(<ScatterExclusiveVisOptions {...defaultProps} />);
    const filled = screen.getAllByRole('switch')[0];
    fireEvent.click(filled);
    expect(defaultProps.onChange).toHaveBeenCalledWith({
      ...defaultProps.styles,
      filled: true,
    });
  });
});
