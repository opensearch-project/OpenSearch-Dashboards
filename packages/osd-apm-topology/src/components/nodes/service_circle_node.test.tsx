/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ServiceCircleNode } from './service_circle_node';
import { useCelestialNodeActionsContext } from '../../shared/contexts/node_actions_context';

jest.mock('@xyflow/react', () => require('../../test_utils/xyflow_mock'));
import { useElementHover } from '../../shared/hooks/use_element_hover.hook';

jest.mock('../../shared/contexts/node_actions_context', () => ({
  useCelestialNodeActionsContext: jest.fn(),
}));

jest.mock('../../shared/hooks/use_element_hover.hook', () => ({
  useElementHover: jest.fn(),
}));

jest.mock('./service_circle_node.scss', () => ({}));

const mockUseCelestialNodeActionsContext = useCelestialNodeActionsContext as ReturnType<
  typeof jest.fn
>;
const mockUseElementHover = useElementHover as ReturnType<typeof jest.fn>;

describe('ServiceCircleNode', () => {
  const defaultOnDashboardClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCelestialNodeActionsContext.mockReturnValue({
      onDashboardClick: defaultOnDashboardClick,
      selectedNodeId: undefined,
    });
    mockUseElementHover.mockReturnValue({
      isHovered: false,
      onMouseEnter: jest.fn(),
      onMouseLeave: jest.fn(),
    });
  });

  const createNodeProps = (data: Record<string, any> = {}) =>
    ({
      id: data.id ?? 'node-1',
      type: 'serviceCircle',
      data: {
        id: 'node-1',
        title: 'My Service',
        subtitle: 'us-east-1',
        ...data,
      },
      position: { x: 0, y: 0 },
      isConnectable: true,
      zIndex: 0,
      positionAbsoluteX: 0,
      positionAbsoluteY: 0,
    } as any);

  it('renders title and subtitle', () => {
    render(<ServiceCircleNode {...createNodeProps()} />);
    expect(screen.getByText('My Service')).toBeInTheDocument();
    expect(screen.getByText('us-east-1')).toBeInTheDocument();
  });

  it('renders total requests formatted as "5.0K" for 5000', () => {
    render(
      <ServiceCircleNode
        {...createNodeProps({ metrics: { requests: 5000, faults5xx: 0, errors4xx: 0 } })}
      />
    );
    expect(screen.getByText('5.0K')).toBeInTheDocument();
  });

  it('renders total requests as raw number for values under 1000', () => {
    render(
      <ServiceCircleNode
        {...createNodeProps({ metrics: { requests: 100, faults5xx: 0, errors4xx: 0 } })}
      />
    );
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('hides request count when no metrics', () => {
    render(<ServiceCircleNode {...createNodeProps()} />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('renders data-test-subj with node id', () => {
    const { container } = render(<ServiceCircleNode {...createNodeProps({ id: 'svc-42' })} />);
    expect(
      container.querySelector('[data-test-subj="serviceCircleNode-svc-42"]')
    ).toBeInTheDocument();
  });

  it('calls onDashboardClick with event and data on click', () => {
    const { container } = render(<ServiceCircleNode {...createNodeProps()} />);
    const shell = container.querySelector(
      '[data-test-subj="serviceCircleNode-node-1"]'
    ) as HTMLElement;
    fireEvent.click(shell);
    expect(defaultOnDashboardClick).toHaveBeenCalledTimes(1);
    expect(defaultOnDashboardClick).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ id: 'node-1', title: 'My Service' })
    );
  });

  it('applies selection state when data.id matches selectedNodeId', () => {
    mockUseCelestialNodeActionsContext.mockReturnValue({
      onDashboardClick: defaultOnDashboardClick,
      selectedNodeId: 'node-1',
    });
    const { container } = render(<ServiceCircleNode {...createNodeProps()} />);
    const circleContainer = container.querySelector('.celServiceCircle__container') as HTMLElement;
    expect(circleContainer.className).toContain('celServiceCircle__container--selected');
  });

  it('uses default diameter 80 when circleDiameter not set', () => {
    const { container } = render(<ServiceCircleNode {...createNodeProps()} />);
    const circleContainer = container.querySelector('.celServiceCircle__container') as HTMLElement;
    expect(circleContainer.style.width).toBe('80px');
    expect(circleContainer.style.height).toBe('80px');
  });

  it('applies custom color as glow color', () => {
    const { container } = render(<ServiceCircleNode {...createNodeProps({ color: '#6366F1' })} />);
    const shell = container.querySelector(
      '[data-test-subj="serviceCircleNode-node-1"]'
    ) as HTMLElement;
    expect(shell.style.getPropertyValue('--osd-node-glow-color')).toBe('#6366F1');
    const circleContainer = container.querySelector('.celServiceCircle__container') as HTMLElement;
    expect(circleContainer.style.getPropertyValue('--osd-node-glow-color')).toBe('#6366F1');
  });

  it('applies custom color as borderColor when no metrics', () => {
    const { container } = render(<ServiceCircleNode {...createNodeProps({ color: '#6366F1' })} />);
    const circleContainer = container.querySelector('.celServiceCircle__container') as HTMLElement;
    expect(circleContainer.style.borderColor).toBe('#6366f1');
  });

  it('does not apply custom borderColor when metrics are present', () => {
    const { container } = render(
      <ServiceCircleNode
        {...createNodeProps({
          color: '#6366F1',
          metrics: { requests: 100, faults5xx: 0, errors4xx: 0 },
        })}
      />
    );
    const circleContainer = container.querySelector('.celServiceCircle__container') as HTMLElement;
    expect(circleContainer.style.borderColor).toBe('');
  });
});
