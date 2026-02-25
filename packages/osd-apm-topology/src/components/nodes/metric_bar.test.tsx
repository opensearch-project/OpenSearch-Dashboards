/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '../../test_utils/vitest.utilities';
import { MetricBar, MetricBarGroup } from './metric_bar';

describe('MetricBar', () => {
  it('renders fill bar with correct width percentage', () => {
    const { container } = render(<MetricBar value={50} max={200} />);
    const fillBar = container.querySelector('.osd\\:h-full') as HTMLElement;
    expect(fillBar.style.width).toBe('25%');
  });

  it('caps at 100% when value > max', () => {
    const { container } = render(<MetricBar value={300} max={100} />);
    const fillBar = container.querySelector('.osd\\:h-full') as HTMLElement;
    expect(fillBar.style.width).toBe('100%');
  });

  it('shows 0% when max is 0', () => {
    const { container } = render(<MetricBar value={50} max={0} />);
    const fillBar = container.querySelector('.osd\\:h-full') as HTMLElement;
    expect(fillBar.style.width).toBe('0%');
  });

  it('renders label text when provided', () => {
    render(<MetricBar value={50} max={100} label="50ms" />);
    expect(screen.getByText('50ms')).toBeInTheDocument();
  });

  it('does not render label when not provided', () => {
    const { container } = render(<MetricBar value={50} max={100} />);
    const labelSpans = container.querySelectorAll('.osd\\:text-right');
    expect(labelSpans).toHaveLength(0);
  });
});

describe('MetricBarGroup', () => {
  it('renders one MetricBar per metrics item', () => {
    const metrics = [
      { label: 'Duration', value: 100, max: 500 },
      { label: 'Tokens', value: 200, max: 1000 },
      { label: 'Cost', value: 5, max: 10 },
    ];
    render(<MetricBarGroup metrics={metrics} />);
    expect(screen.getByText('Duration')).toBeInTheDocument();
    expect(screen.getByText('Tokens')).toBeInTheDocument();
    expect(screen.getByText('Cost')).toBeInTheDocument();
  });

  it('uses formattedValue over label when provided', () => {
    const metrics = [{ label: 'Duration', value: 100, max: 500, formattedValue: '100ms' }];
    render(<MetricBarGroup metrics={metrics} />);
    expect(screen.getByText('100ms')).toBeInTheDocument();
    expect(screen.queryByText('Duration')).not.toBeInTheDocument();
  });
});
