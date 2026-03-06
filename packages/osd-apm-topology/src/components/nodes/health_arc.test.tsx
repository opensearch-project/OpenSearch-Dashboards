/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { HealthArc } from './health_arc';

describe('HealthArc', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders SVG with correct width and height from diameter', () => {
    const { container } = render(<HealthArc segments={[]} diameter={100} />);
    const svg = container.querySelector('svg')!;
    expect(svg).toHaveAttribute('width', '100');
    expect(svg).toHaveAttribute('height', '100');
  });

  it('renders role="img" and aria-label', () => {
    render(<HealthArc segments={[]} diameter={80} />);
    const svg = screen.getByRole('img');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('aria-label', 'Health arc');
  });

  it('uses default aria-label "Health arc"', () => {
    render(<HealthArc segments={[]} diameter={80} />);
    expect(screen.getByLabelText('Health arc')).toBeInTheDocument();
  });

  it('uses custom aria-label when provided', () => {
    render(<HealthArc segments={[]} diameter={80} aria-label="Custom label" />);
    expect(screen.getByLabelText('Custom label')).toBeInTheDocument();
  });

  it('renders single gray background circle when total is 0', () => {
    const { container } = render(
      <HealthArc segments={[{ value: 0, color: 'red' }]} diameter={80} />
    );
    const circles = container.querySelectorAll('circle');
    expect(circles).toHaveLength(1);
    expect(circles[0]).toHaveAttribute('stroke', 'var(--osd-color-cl-gray-350)');
  });

  it('renders one circle per non-zero segment when total > 0', () => {
    const { container } = render(
      <HealthArc
        segments={[
          { value: 50, color: 'red' },
          { value: 30, color: 'green' },
          { value: 20, color: 'blue' },
        ]}
        diameter={80}
      />
    );
    const circles = container.querySelectorAll('circle');
    expect(circles).toHaveLength(3);
  });

  it('skips segments with value <= 0', () => {
    const { container } = render(
      <HealthArc
        segments={[
          { value: 50, color: 'red' },
          { value: 0, color: 'green' },
          { value: -5, color: 'yellow' },
          { value: 30, color: 'blue' },
        ]}
        diameter={80}
      />
    );
    const circles = container.querySelectorAll('circle');
    expect(circles).toHaveLength(2);
  });

  it('calculates circle radius as (diameter - strokeWidth) / 2', () => {
    const diameter = 80;
    const strokeWidth = 6;
    const expectedRadius = (diameter - strokeWidth) / 2;

    const { container } = render(
      <HealthArc
        segments={[{ value: 100, color: 'red' }]}
        diameter={diameter}
        strokeWidth={strokeWidth}
      />
    );
    const circle = container.querySelector('circle')!;
    expect(circle).toHaveAttribute('r', String(expectedRadius));
  });

  it('calculates circle center as diameter / 2', () => {
    const diameter = 80;
    const expectedCenter = diameter / 2;

    const { container } = render(
      <HealthArc segments={[{ value: 100, color: 'red' }]} diameter={diameter} />
    );
    const circle = container.querySelector('circle')!;
    expect(circle).toHaveAttribute('cx', String(expectedCenter));
    expect(circle).toHaveAttribute('cy', String(expectedCenter));
  });

  it('applies segment stroke colors from input', () => {
    const { container } = render(
      <HealthArc
        segments={[
          { value: 60, color: 'red' },
          { value: 40, color: 'blue' },
        ]}
        diameter={80}
      />
    );
    const circles = container.querySelectorAll('circle');
    expect(circles[0]).toHaveAttribute('stroke', 'red');
    expect(circles[1]).toHaveAttribute('stroke', 'blue');
  });

  it('uses default strokeWidth of 6', () => {
    const diameter = 80;
    const expectedRadius = (diameter - 6) / 2;

    const { container } = render(
      <HealthArc segments={[{ value: 100, color: 'red' }]} diameter={diameter} />
    );
    const circle = container.querySelector('circle')!;
    expect(circle).toHaveAttribute('r', String(expectedRadius));
    expect(circle).toHaveAttribute('stroke-width', '6');
  });
});
