/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MetricsCardNode } from './metrics_card_node';
import { useCelestialNodeActionsContext } from '../../shared/contexts/node_actions_context';

jest.mock('@xyflow/react', () => require('../../test_utils/xyflow_mock'));

jest.mock('../../shared/contexts/node_actions_context', () => ({
  useCelestialNodeActionsContext: jest.fn(),
}));

jest.mock('./metrics_card_node.scss', () => ({}));

const mockUseContext = useCelestialNodeActionsContext as ReturnType<typeof jest.fn>;

const createProps = (over: Record<string, any> = {}) =>
  ({
    id: over.id ?? 'cart',
    type: 'metricsCard',
    data: {
      id: 'cart',
      title: 'cart',
      subtitle: 'POST /checkout',
      color: '#54B399',
      hasError: false,
      metrics: [
        { label: 'Requests', value: 12, max: 20, color: '#69707D', formattedValue: '12' },
        { label: 'Errors', value: 0, max: 12, color: '#017D73', formattedValue: '0' },
        { label: 'Duration', value: 1200, max: 5000, color: '#0268BC', formattedValue: '1.20s' },
      ],
      ...over,
    },
  }) as any;

describe('MetricsCardNode', () => {
  const onDashboardClick = jest.fn();
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseContext.mockReturnValue({ onDashboardClick, selectedNodeId: undefined });
  });

  it('renders the title, subtitle and all labeled metrics', () => {
    render(<MetricsCardNode {...createProps()} />);
    screen.getByText('cart');
    screen.getByText('POST /checkout');
    ['Requests', 'Errors', 'Duration'].forEach((l) => screen.getByText(l));
    screen.getByText('12');
    screen.getByText('1.20s');
  });

  it('shows the error badge only when hasError is true', () => {
    const { container, rerender } = render(<MetricsCardNode {...createProps()} />);
    expect(container.querySelector('.celMetricsCard__errorBadge')).toBeNull();
    rerender(<MetricsCardNode {...createProps({ hasError: true })} />);
    const badge = container.querySelector('.celMetricsCard__errorBadge');
    expect(badge).toBeInTheDocument();
    // Carries an explanatory label (default) so the indicator is understandable.
    expect(badge).toHaveAttribute('aria-label', 'Has errors');
  });

  it('uses a custom errorLabel on the badge when provided', () => {
    const { container } = render(
      <MetricsCardNode
        {...createProps({ hasError: true, errorLabel: '2 errors in this service' })}
      />
    );
    expect(container.querySelector('.celMetricsCard__errorBadge')).toHaveAttribute(
      'aria-label',
      '2 errors in this service'
    );
  });

  it('fires onDashboardClick with the node data when the whole card is clicked', () => {
    render(<MetricsCardNode {...createProps()} />);
    fireEvent.click(screen.getByTestId('metricsCardNode-cart'));
    expect(onDashboardClick).toHaveBeenCalled();
    // second arg is the node data
    expect(onDashboardClick.mock.calls[0][1].id).toBe('cart');
  });
});
