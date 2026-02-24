/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '../../test-utils/vitest.utilities';
import { AgentCardNode } from './AgentCardNode';
import { useCelestialNodeActionsContext } from '../../shared/contexts/NodeActionsContext';

jest.mock('../../shared/contexts/NodeActionsContext', () => ({
  useCelestialNodeActionsContext: jest.fn(),
}));

jest.mock('./AgentCardNode.scss', () => ({}));

const mockUseCelestialNodeActionsContext = useCelestialNodeActionsContext as ReturnType<
  typeof jest.fn
>;

describe('AgentCardNode', () => {
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
      id: data.id ?? 'agent-1',
      type: 'agentCard',
      data: {
        id: 'agent-1',
        title: 'My Agent',
        nodeKind: 'agent' as const,
        ...data,
      },
      position: { x: 0, y: 0 },
      isConnectable: true,
      zIndex: 0,
      positionAbsoluteX: 0,
      positionAbsoluteY: 0,
    } as any);

  it('renders title', () => {
    render(<AgentCardNode {...createNodeProps()} />);
    expect(screen.getByText('My Agent')).toBeInTheDocument();
  });

  it('renders TypeBadge with correct kind label', () => {
    render(<AgentCardNode {...createNodeProps({ nodeKind: 'llm' })} />);
    expect(screen.getByText('LLM')).toBeInTheDocument();
  });

  it('falls back to "agent" kind config when unknown kind', () => {
    render(<AgentCardNode {...createNodeProps({ nodeKind: 'unknown_kind' })} />);
    expect(screen.getByText('Agent')).toBeInTheDocument();
  });

  it('shows StatusIndicator when data.status provided', () => {
    render(<AgentCardNode {...createNodeProps({ status: 'error', statusLabel: 'Failed' })} />);
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('does not show StatusIndicator when no status', () => {
    render(<AgentCardNode {...createNodeProps()} />);
    // No status label should be present
    expect(screen.queryByText('Failed')).not.toBeInTheDocument();
  });

  it('renders model name for LLM nodes', () => {
    render(<AgentCardNode {...createNodeProps({ nodeKind: 'llm', model: 'gpt-4o' })} />);
    expect(screen.getByText('gpt-4o')).toBeInTheDocument();
  });

  it('does not render model name when data.model is undefined', () => {
    render(<AgentCardNode {...createNodeProps({ nodeKind: 'llm' })} />);
    expect(screen.queryByText('gpt-4o')).not.toBeInTheDocument();
  });

  it('shows standalone duration MetricBar when duration set and no metrics array', () => {
    const { container } = render(<AgentCardNode {...createNodeProps({ duration: 250 })} />);
    expect(screen.getByText('250ms')).toBeInTheDocument();
  });

  it('does not show standalone duration when metrics array present', () => {
    render(
      <AgentCardNode
        {...createNodeProps({
          duration: 250,
          metrics: [{ label: 'Tokens', value: 100, max: 500 }],
        })}
      />
    );
    expect(screen.queryByText('250ms')).not.toBeInTheDocument();
  });

  it('renders MetricBarGroup when metrics array provided', () => {
    render(
      <AgentCardNode
        {...createNodeProps({
          metrics: [
            { label: 'Duration', value: 100, max: 500, formattedValue: '100ms' },
            { label: 'Tokens', value: 200, max: 1000, formattedValue: '200' },
          ],
        })}
      />
    );
    expect(screen.getByText('100ms')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
  });

  it('calls onDashboardClick on click', () => {
    const { container } = render(<AgentCardNode {...createNodeProps()} />);
    const shell = container.querySelector(
      '[data-test-subj="agentCardNode-agent-1"]'
    ) as HTMLElement;
    fireEvent.click(shell);
    expect(defaultOnDashboardClick).toHaveBeenCalledTimes(1);
  });

  it('sets data-test-subj attribute', () => {
    const { container } = render(<AgentCardNode {...createNodeProps({ id: 'agent-99' })} />);
    expect(
      container.querySelector('[data-test-subj="agentCardNode-agent-99"]')
    ).toBeInTheDocument();
  });
});
