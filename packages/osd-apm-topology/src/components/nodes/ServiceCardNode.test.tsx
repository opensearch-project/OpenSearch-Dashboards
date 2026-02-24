/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '../../test-utils/vitest.utilities';
import { ServiceCardNode } from './ServiceCardNode';
import { useCelestialNodeActionsContext } from '../../shared/contexts/NodeActionsContext';

jest.mock('../../shared/contexts/NodeActionsContext', () => ({
  useCelestialNodeActionsContext: jest.fn(),
}));

jest.mock('./ServiceCardNode.scss', () => ({}));

const mockUseCelestialNodeActionsContext = useCelestialNodeActionsContext as ReturnType<
  typeof jest.fn
>;

describe('ServiceCardNode', () => {
  const defaultOnDashboardClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCelestialNodeActionsContext.mockReturnValue({
      onDashboardClick: defaultOnDashboardClick,
      selectedNodeId: undefined,
    });
  });

  const createNodeProps = (data: Record<string, any> = {}) =>
    ({
      id: data.id ?? 'svc-1',
      type: 'serviceCard',
      data: {
        id: 'svc-1',
        title: 'Payment Service',
        subtitle: 'us-west-2',
        metrics: { requests: 500, faults5xx: 10, errors4xx: 20 },
        ...data,
      },
      position: { x: 0, y: 0 },
      isConnectable: true,
      zIndex: 0,
      positionAbsoluteX: 0,
      positionAbsoluteY: 0,
    } as any);

  it('renders title and subtitle', () => {
    render(<ServiceCardNode {...createNodeProps()} />);
    expect(screen.getByText('Payment Service')).toBeInTheDocument();
    expect(screen.getByText('us-west-2')).toBeInTheDocument();
  });

  it('renders TypeBadge with "Service" label', () => {
    render(<ServiceCardNode {...createNodeProps()} />);
    expect(screen.getByText('Service')).toBeInTheDocument();
  });

  it('shows StatusIndicator with "SLI breach" when health.status is breached', () => {
    render(
      <ServiceCardNode
        {...createNodeProps({
          health: { status: 'breached', breached: 1, total: 1, recovered: 0 },
        })}
      />
    );
    expect(screen.getByText('SLI breach')).toBeInTheDocument();
  });

  it('shows StatusIndicator with "Recovered" when health.status is recovered', () => {
    render(
      <ServiceCardNode
        {...createNodeProps({
          health: { status: 'recovered', breached: 0, total: 1, recovered: 1 },
        })}
      />
    );
    expect(screen.getByText('Recovered')).toBeInTheDocument();
  });

  it('does not show StatusIndicator when no health status', () => {
    render(<ServiceCardNode {...createNodeProps({ health: undefined })} />);
    expect(screen.queryByText('SLI breach')).not.toBeInTheDocument();
    expect(screen.queryByText('Recovered')).not.toBeInTheDocument();
  });

  it('renders total requests formatted', () => {
    render(
      <ServiceCardNode
        {...createNodeProps({ metrics: { requests: 5000, faults5xx: 0, errors4xx: 0 } })}
      />
    );
    expect(screen.getByText(/5\.0k/)).toBeInTheDocument();
  });

  it('renders "View insights" button', () => {
    render(<ServiceCardNode {...createNodeProps()} />);
    expect(screen.getByText('View insights')).toBeInTheDocument();
  });

  it('calls onDashboardClick when "View insights" is clicked', () => {
    render(<ServiceCardNode {...createNodeProps()} />);
    fireEvent.click(screen.getByText('View insights'));
    expect(defaultOnDashboardClick).toHaveBeenCalledTimes(1);
  });

  it('hides button when actionButton is false', () => {
    render(<ServiceCardNode {...createNodeProps({ actionButton: false })} />);
    expect(screen.queryByText('View insights')).not.toBeInTheDocument();
  });

  it('applies selection state when data.id matches selectedNodeId', () => {
    mockUseCelestialNodeActionsContext.mockReturnValue({
      onDashboardClick: defaultOnDashboardClick,
      selectedNodeId: 'svc-1',
    });
    const { container } = render(<ServiceCardNode {...createNodeProps()} />);
    const shell = container.querySelector(
      '[data-test-subj="serviceCardNode-svc-1"]'
    ) as HTMLElement;
    expect(shell.className).toContain('shadow-node-selected');
  });

  it('sets data-test-subj attribute', () => {
    const { container } = render(<ServiceCardNode {...createNodeProps({ id: 'svc-99' })} />);
    expect(
      container.querySelector('[data-test-subj="serviceCardNode-svc-99"]')
    ).toBeInTheDocument();
  });
});
