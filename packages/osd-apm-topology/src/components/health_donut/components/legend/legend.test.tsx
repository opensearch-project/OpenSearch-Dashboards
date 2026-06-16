/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { render, screen } from '@testing-library/react';
import type { Metrics, SloHealth } from '../../../../shared/types/common.types';
import { Legend } from './legend';

describe('Legend', () => {
  // Mock metrics data for tests
  const mockMetrics: Metrics = {
    requests: 1000,
    errors4xx: 200, // 20%
    faults5xx: 100, // 10%
  };

  // Mock health data for tests
  const mockHealth: SloHealth = {
    breached: 2,
    recovered: 1,
    status: 'breached',
    total: 3,
  };

  it('renders metrics data correctly', () => {
    render(<Legend metrics={mockMetrics} />);
    // Check for the percentage values in the rendered output
    expect(screen.getByText('20% errors (4xx)')).toBeInTheDocument();
    expect(screen.getByText('10% faults (5xx)')).toBeInTheDocument();
  });

  it('does not show zero percentages in the legend', () => {
    const zeroRequestsMetrics: Metrics = {
      requests: 0,
      errors4xx: 0,
      faults5xx: 0,
    };
    render(<Legend metrics={zeroRequestsMetrics} />);
    // Should not show 0% for both error types
    expect(screen.queryByText('0% errors (4xx)')).not.toBeInTheDocument();
    expect(screen.queryByText('0% faults (5xx)')).not.toBeInTheDocument();
  });

  it('uses left triangle position by default', () => {
    const { container } = render(<Legend metrics={mockMetrics} />);
    const legendElement = container.firstChild as HTMLElement;
    expect(legendElement.className).toContain('celTriangleLeft');
    expect(legendElement.className).not.toContain('celTriangleRight');
  });

  it('applies right triangle position when specified', () => {
    const { container } = render(<Legend metrics={mockMetrics} trianglePosition="right" />);
    const legendElement = container.firstChild as HTMLElement;
    expect(legendElement.className).toContain('celTriangleRight');
    expect(legendElement.className).not.toContain('celTriangleLeft');
  });

  it('renders breached SLI information when provided', () => {
    render(<Legend metrics={mockMetrics} health={mockHealth} />);
    expect(screen.getByText('2 SLI breaches')).toBeInTheDocument();
    // Should not show recovered when breached is present
    expect(screen.queryByText('1 SLI recovered')).not.toBeInTheDocument();
  });

  it('renders recovered SLI information when breached is 0', () => {
    const recoveredOnlyHealth: SloHealth = {
      breached: 0,
      recovered: 3,
      status: 'recovered',
      total: 3,
    };
    render(<Legend metrics={mockMetrics} health={recoveredOnlyHealth} />);
    expect(screen.getByText('3 SLI recovered')).toBeInTheDocument();
    expect(screen.queryByText('0 SLI breaches')).not.toBeInTheDocument();
  });
});
