/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { CardSkeleton, LogLinesSkeleton } from './card_skeleton';

describe('CardSkeleton', () => {
  it('reserves the passed height so there is no layout shift when data arrives', () => {
    render(<CardSkeleton height={132} />);
    const el = screen.getByTestId('logsExploreCardSkeletonHist');
    expect(el).toBeInTheDocument();
    expect(el).toHaveStyle({ height: '132px' });
  });

  it('renders a deterministic set of faux bars (stable across renders, no jitter)', () => {
    const { container, rerender } = render(<CardSkeleton height={100} />);
    const bars = container.querySelectorAll('.logStreamCard__skeletonBar');
    expect(bars.length).toBe(16);
    // The rendered bar heights are deterministic — re-rendering yields the same DOM.
    const first = container.innerHTML;
    rerender(<CardSkeleton height={100} />);
    expect(container.innerHTML).toBe(first);
  });

  it('is labelled for assistive tech', () => {
    render(<CardSkeleton height={80} />);
    expect(screen.getByLabelText('Loading histogram')).toBeInTheDocument();
  });
});

describe('LogLinesSkeleton', () => {
  it('renders a stack of faux log lines', () => {
    const { container } = render(<LogLinesSkeleton />);
    expect(screen.getByTestId('logsExploreCardSkeletonLogs')).toBeInTheDocument();
    expect(container.querySelectorAll('.logStreamCard__skeletonLine').length).toBe(6);
  });

  it('is labelled for assistive tech', () => {
    render(<LogLinesSkeleton />);
    expect(screen.getByLabelText('Loading logs')).toBeInTheDocument();
  });
});
