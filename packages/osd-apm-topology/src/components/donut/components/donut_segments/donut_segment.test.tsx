/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { render, screen } from '../../../../test_utils/vitest.utilities';
import { DonutSegment } from './donut_segment';

describe('DonutSegment', () => {
  const defaultProps = {
    center: 50,
    radius: 40,
    stroke: '#000000',
    strokeWidth: 2,
    dashArray: '10 5',
  };

  it('renders with required props', () => {
    render(<DonutSegment {...defaultProps} />);
    const circle = screen.getByRole('img');

    expect(circle).toBeInTheDocument();
    expect(circle).toHaveAttribute('cx', '50');
    expect(circle).toHaveAttribute('cy', '50');
    expect(circle).toHaveAttribute('r', '40');
    expect(circle).toHaveAttribute('stroke', '#000000');
    expect(circle).toHaveAttribute('stroke-width', '2');
    expect(circle).toHaveAttribute('stroke-dasharray', '10 5');
  });

  it('renders with default aria-label when not provided', () => {
    render(<DonutSegment {...defaultProps} />);
    const circle = screen.getByRole('img');

    expect(circle).toHaveAttribute('aria-label', 'Health donut segment');
  });

  it('renders with custom aria-label when provided', () => {
    render(<DonutSegment {...defaultProps} ariaLabel="Custom label" />);
    const circle = screen.getByRole('img');

    expect(circle).toHaveAttribute('aria-label', 'Custom label');
  });

  it('renders with description when provided', () => {
    render(<DonutSegment {...defaultProps} description="Test description" />);
    const circle = screen.getByRole('img');

    expect(circle).toHaveAttribute('aria-label', 'Health donut segment - Test description');
  });

  it('applies correct transform rotation', () => {
    render(<DonutSegment {...defaultProps} />);
    const circle = screen.getByRole('img');

    expect(circle).toHaveAttribute('transform', 'rotate(-90 50 50)');
  });

  it('renders with custom dashOffset when provided', () => {
    render(<DonutSegment {...defaultProps} dashOffset={25} />);
    const circle = screen.getByRole('img');

    expect(circle).toHaveAttribute('stroke-dashoffset', '25');
  });

  it('renders with default dashOffset when not provided', () => {
    render(<DonutSegment {...defaultProps} />);
    const circle = screen.getByRole('img');

    expect(circle).toHaveAttribute('stroke-dashoffset', '0');
  });
});
