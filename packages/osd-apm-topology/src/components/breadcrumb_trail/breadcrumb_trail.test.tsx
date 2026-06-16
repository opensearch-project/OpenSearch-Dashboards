/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { BreadcrumbTrail } from './breadcrumb_trail';

describe('BreadcrumbTrail', () => {
  const mockOnBreadcrumbClick = jest.fn();

  const mockBreadcrumbs = [
    {
      title: 'World',
    },
    {
      title: 'API Gateway',
      node: {
        id: '2',
        title: 'API Gateway',
        keyAttributes: { foo: 'bar' },
        metrics: {
          requests: 100,
          faults5xx: 5,
          errors4xx: 10,
        },
      },
    },
  ];

  beforeEach(() => {
    mockOnBreadcrumbClick.mockClear();
  });

  it('renders all breadcrumbs', () => {
    render(
      <BreadcrumbTrail breadcrumbs={mockBreadcrumbs} onBreadcrumbClick={mockOnBreadcrumbClick} />
    );

    mockBreadcrumbs.forEach((breadcrumb) => {
      expect(screen.getByText(breadcrumb.title)).toBeInTheDocument();
    });
  });

  it('renders HealthDonut for non-first breadcrumbs', () => {
    render(
      <BreadcrumbTrail breadcrumbs={mockBreadcrumbs} onBreadcrumbClick={mockOnBreadcrumbClick} />
    );

    const healthDonut = screen.getByTestId('health-donut');
    expect(healthDonut).toBeInTheDocument();
  });

  it('calls onBreadcrumbClick with correct parameters when clicking non-last breadcrumb', () => {
    render(
      <BreadcrumbTrail breadcrumbs={mockBreadcrumbs} onBreadcrumbClick={mockOnBreadcrumbClick} />
    );

    fireEvent.click(screen.getByText('World'));
    expect(mockOnBreadcrumbClick).toHaveBeenCalledWith(mockBreadcrumbs[0], 0);
  });

  it('does not call onBreadcrumbClick when clicking last breadcrumb', () => {
    render(
      <BreadcrumbTrail breadcrumbs={mockBreadcrumbs} onBreadcrumbClick={mockOnBreadcrumbClick} />
    );

    fireEvent.click(screen.getByText('API Gateway'));
    expect(mockOnBreadcrumbClick).not.toHaveBeenCalled();
  });

  it('handles breadcrumbs without node property', () => {
    const breadcrumbsWithoutNode = [{ title: 'World' }];

    render(
      <BreadcrumbTrail
        breadcrumbs={breadcrumbsWithoutNode}
        onBreadcrumbClick={mockOnBreadcrumbClick}
      />
    );

    breadcrumbsWithoutNode.forEach((breadcrumb) => {
      expect(screen.getByText(breadcrumb.title)).toBeInTheDocument();
    });
  });

  it('renders hotspot when provided', () => {
    const hotspot = <div data-test-subj="tutorial-hotspot">Tutorial Hotspot</div>;

    render(
      <BreadcrumbTrail
        breadcrumbs={mockBreadcrumbs}
        onBreadcrumbClick={mockOnBreadcrumbClick}
        hotspot={hotspot}
      />
    );

    expect(screen.getByTestId('tutorial-hotspot')).toBeInTheDocument();
    expect(screen.getByText('Tutorial Hotspot')).toBeInTheDocument();
  });

  it('does not render hotspot when not provided', () => {
    render(
      <BreadcrumbTrail breadcrumbs={mockBreadcrumbs} onBreadcrumbClick={mockOnBreadcrumbClick} />
    );

    expect(screen.queryByTestId('tutorial-hotspot')).not.toBeInTheDocument();
  });

  it('renders hotspot alongside breadcrumbs', () => {
    const hotspot = <div data-test-subj="tutorial-hotspot">Tutorial Hotspot</div>;

    render(
      <BreadcrumbTrail
        breadcrumbs={mockBreadcrumbs}
        onBreadcrumbClick={mockOnBreadcrumbClick}
        hotspot={hotspot}
      />
    );

    // Verify both breadcrumbs and hotspot are rendered
    mockBreadcrumbs.forEach((breadcrumb) => {
      expect(screen.getByText(breadcrumb.title)).toBeInTheDocument();
    });
    expect(screen.getByTestId('tutorial-hotspot')).toBeInTheDocument();
  });
});
