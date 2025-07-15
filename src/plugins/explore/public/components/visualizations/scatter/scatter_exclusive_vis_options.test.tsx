/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScatterExclusiveVisOptions } from './scatter_exclusive_vis_options';
import { PointShape } from '../types';

jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: jest.fn().mockImplementation((id, { defaultMessage }) => defaultMessage),
  },
}));

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

  it('renders scatter accordion', () => {
    render(<ScatterExclusiveVisOptions {...defaultProps} />);
    expect(screen.getByText('Scatter')).toBeInTheDocument();
  });

  it('calls onChange when filled switch is toggled', () => {
    render(<ScatterExclusiveVisOptions {...defaultProps} />);
    const filledSwitch = screen.getByRole('switch');
    fireEvent.click(filledSwitch);
    expect(defaultProps.onChange).toHaveBeenCalledWith({
      ...defaultProps.styles,
      filled: true,
    });
  });
});
