/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CelestialNodeActionsProvider } from '../../shared/contexts/node_actions_context';

jest.mock('@xyflow/react', () => require('../../test_utils/xyflow_mock'));
import { PropsWithChildren } from 'react';
import { CelestialStateProvider } from '../../shared/contexts/celestial_state_context';
import { CelestialCard } from './celestial_card';
import { HEALTH_DONUT_TEST_ID } from '../health_donut';

describe('CelestialCard', () => {
  const defaultProps = {
    id: 'node-1',
    title: 'Test Title',
    subtitle: 'Test Subtitle',
    icon: 'test-icon',
    isGroup: false,
    keyAttributes: { foo: 'bar' },
    isInstrumented: true,
    onMenuItemClick: jest.fn(),
    onGroupToggle: jest.fn(),
    metrics: {
      requests: 100,
      faults5xx: 0,
      errors4xx: 0,
    },
  };

  const breachedHealth = {
    status: 'breached',
    breached: 1,
    total: 1,
    recovered: 0,
  };

  const onDataFetch = jest.fn();
  const addBreadcrumb = jest.fn();
  const mockSetActiveNodeId = jest.fn();
  const mockSetUnstackedAggregateNodeIds = jest.fn();
  const mockSetActiveMenuNodeId = jest.fn();
  const Providers = ({ children }: PropsWithChildren) => {
    return (
      <CelestialStateProvider
        mocks={{
          selectedNodeId: undefined,
          setSelectedNodeId: mockSetActiveNodeId,
          unstackedAggregateNodeIds: [],
          setUnstackedAggregateNodeIds: mockSetUnstackedAggregateNodeIds,
          activeMenuNodeId: null,
          setActiveMenuNodeId: mockSetActiveMenuNodeId,
          viewLock: { lock: jest.fn(), isLocked: jest.fn().mockReturnValue(false) },
        }}
      >
        <CelestialNodeActionsProvider onDataFetch={onDataFetch} addBreadcrumb={addBreadcrumb}>
          {children}
        </CelestialNodeActionsProvider>
      </CelestialStateProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with basic props', () => {
    render(<CelestialCard {...defaultProps} />, { wrapper: Providers });
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
  });

  it('applies correct styling when alarming', () => {
    const { container } = render(<CelestialCard {...defaultProps} health={breachedHealth} />, {
      wrapper: Providers,
    });
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('osd:border-status-breached');
    expect(card).toHaveClass('osd:bg-container-breached');
  });

  // Skip until we release uninstrumented
  it.skip('applies correct border style when not instrumented', () => {
    const { container } = render(<CelestialCard {...defaultProps} isInstrumented={false} />, {
      wrapper: Providers,
    });
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('border-dashed');
  });

  describe('Group functionality', () => {
    const groupProps = {
      ...defaultProps,
      isGroup: true,
    };

    it('renders group toggle button when isGroup is true', () => {
      render(<CelestialCard {...groupProps} />, { wrapper: Providers });
      const toggleButton = screen.getByRole('button', { expanded: false });
      expect(toggleButton).toBeInTheDocument();
    });

    it('calls onGroupToggle when clicking group header', async () => {
      render(<CelestialCard {...groupProps} />, { wrapper: Providers });
      const groupHeader = screen.getByText('Test Title').parentElement;
      fireEvent.click(groupHeader!);

      await waitFor(() => {
        expect(addBreadcrumb).toHaveBeenCalledWith(groupProps.title, groupProps);
        expect(onDataFetch).toHaveBeenCalledWith(groupProps);
      });
    });
  });

  describe('Custom color prop', () => {
    it('applies custom borderColor and glow color when color is set', () => {
      const { container } = render(<CelestialCard {...defaultProps} color="#6366F1" />, {
        wrapper: Providers,
      });
      const card = container.firstChild as HTMLElement;
      // jsdom converts hex to rgb
      expect(card.style.borderColor).toBe('rgb(99, 102, 241)');
      expect(card.style.getPropertyValue('--osd-node-glow-color')).toBe('#6366F1');
    });

    it('does not apply custom color when health is breached', () => {
      const { container } = render(
        <CelestialCard {...defaultProps} color="#6366F1" health={breachedHealth} />,
        { wrapper: Providers }
      );
      const card = container.firstChild as HTMLElement;
      expect(card.style.borderColor).not.toBe('#6366F1');
      expect(card).toHaveClass('osd:border-status-breached');
    });

    it('skips default hover border class when color is set', () => {
      const { container } = render(<CelestialCard {...defaultProps} color="#6366F1" />, {
        wrapper: Providers,
      });
      const card = container.firstChild as HTMLElement;
      expect(card.className).not.toContain('osd:hover:border-status-default-hover');
    });
  });

  describe('HealthDonut integration', () => {
    it('renders HealthDonut when icon is provided', () => {
      render(<CelestialCard {...defaultProps} />, { wrapper: Providers });
      const healthDonut = screen.getByTestId(HEALTH_DONUT_TEST_ID);
      expect(healthDonut).toBeInTheDocument();
    });

    it('renders HealthDonut without icon when one is not provided', () => {
      render(<CelestialCard {...defaultProps} icon={undefined} />, { wrapper: Providers });
      const healthDonut = screen.queryByTestId(HEALTH_DONUT_TEST_ID);
      expect(healthDonut).not.toBeInTheDocument();
    });
  });

  describe('Whole-card click and keyboard', () => {
    const onDashboardClick = jest.fn();
    const ClickProviders = ({ children }: PropsWithChildren) => (
      <CelestialStateProvider
        mocks={{
          selectedNodeId: undefined,
          setSelectedNodeId: mockSetActiveNodeId,
          unstackedAggregateNodeIds: [],
          setUnstackedAggregateNodeIds: mockSetUnstackedAggregateNodeIds,
          activeMenuNodeId: null,
          setActiveMenuNodeId: mockSetActiveMenuNodeId,
          viewLock: { lock: jest.fn(), isLocked: jest.fn().mockReturnValue(false) },
        }}
      >
        <CelestialNodeActionsProvider
          onDataFetch={onDataFetch}
          addBreadcrumb={addBreadcrumb}
          onDashboardClick={onDashboardClick}
        >
          {children}
        </CelestialNodeActionsProvider>
      </CelestialStateProvider>
    );
    const groupProps = { ...defaultProps, isGroup: true, numberOfServices: 3 };
    const getCard = (container: HTMLElement) => container.firstChild as HTMLElement;

    it('is a focusable button', () => {
      const { container } = render(<CelestialCard {...defaultProps} />, {
        wrapper: ClickProviders,
      });
      expect(getCard(container)).toHaveAttribute('role', 'button');
      expect(getCard(container)).toHaveAttribute('tabindex', '0');
    });

    it('fires the dashboard action once when a leaf card body is clicked', () => {
      const { container } = render(<CelestialCard {...defaultProps} />, {
        wrapper: ClickProviders,
      });
      fireEvent.click(getCard(container));
      expect(onDashboardClick).toHaveBeenCalledTimes(1);
      expect(onDashboardClick).toHaveBeenCalledWith(defaultProps);
      expect(addBreadcrumb).not.toHaveBeenCalled();
    });

    it('does not double-fire when "View insights" is clicked', () => {
      render(<CelestialCard {...defaultProps} />, { wrapper: ClickProviders });
      fireEvent.click(screen.getByRole('button', { name: 'View insights' }));
      expect(onDashboardClick).toHaveBeenCalledTimes(1);
    });

    it('toggles a group card on body click, and only once on the group header', () => {
      const { container } = render(<CelestialCard {...groupProps} />, {
        wrapper: ClickProviders,
      });
      fireEvent.click(getCard(container));
      expect(addBreadcrumb).toHaveBeenCalledTimes(1);
      fireEvent.click(screen.getByText('Test Title').parentElement!);
      expect(addBreadcrumb).toHaveBeenCalledTimes(2);
      expect(onDashboardClick).not.toHaveBeenCalled();
    });

    it('toggles a group card once on double-click', () => {
      const { container } = render(<CelestialCard {...groupProps} />, {
        wrapper: ClickProviders,
      });
      const card = getCard(container);
      // A browser double-click dispatches click (detail 1), click (detail 2), dblclick.
      fireEvent.click(card, { detail: 1 });
      fireEvent.click(card, { detail: 2 });
      fireEvent.doubleClick(card, { detail: 2 });
      expect(addBreadcrumb).toHaveBeenCalledTimes(1);
      expect(onDataFetch).toHaveBeenCalledTimes(1);
    });

    it('toggles once on a double-click of the group header', () => {
      render(<CelestialCard {...groupProps} />, { wrapper: ClickProviders });
      const header = screen.getByText('Test Title').parentElement!;
      fireEvent.click(header, { detail: 1 });
      fireEvent.click(header, { detail: 2 });
      fireEvent.doubleClick(header, { detail: 2 });
      expect(addBreadcrumb).toHaveBeenCalledTimes(1);
    });

    it('fires the dashboard action once on a double-click of "View insights"', () => {
      render(<CelestialCard {...defaultProps} />, { wrapper: ClickProviders });
      const insights = screen.getByRole('button', { name: 'View insights' });
      fireEvent.click(insights, { detail: 1 });
      fireEvent.click(insights, { detail: 2 });
      fireEvent.doubleClick(insights, { detail: 2 });
      expect(onDashboardClick).toHaveBeenCalledTimes(1);
    });

    it.each(['Enter', ' '])('activates a focused card with %p', (key) => {
      const { container } = render(<CelestialCard {...defaultProps} />, {
        wrapper: ClickProviders,
      });
      fireEvent.keyDown(getCard(container), { key });
      expect(onDashboardClick).toHaveBeenCalledWith(defaultProps);
    });

    it('ignores other keys', () => {
      const { container } = render(<CelestialCard {...groupProps} />, {
        wrapper: ClickProviders,
      });
      fireEvent.keyDown(getCard(container), { key: 'a' });
      expect(addBreadcrumb).not.toHaveBeenCalled();
      expect(onDashboardClick).not.toHaveBeenCalled();
    });

    it('names the card for its action, and keeps inner duplicates out of the tab order', () => {
      const { container } = render(<CelestialCard {...groupProps} />, {
        wrapper: ClickProviders,
      });
      expect(getCard(container)).toHaveAttribute('aria-label', 'Test Title, expand group');
      container
        .querySelectorAll('button')
        .forEach((button) => expect(button).toHaveAttribute('tabindex', '-1'));
    });

    it('toggles a focused group card with Enter, once per key press', () => {
      const { container } = render(<CelestialCard {...groupProps} />, {
        wrapper: ClickProviders,
      });
      const card = getCard(container);
      fireEvent.keyDown(card, { key: 'Enter' });
      // A held key auto-repeats keydown.
      fireEvent.keyDown(card, { key: 'Enter', repeat: true });
      expect(addBreadcrumb).toHaveBeenCalledTimes(1);
      expect(onDashboardClick).not.toHaveBeenCalled();
    });

    it('does not pass a handled key on to the React Flow node wrapper', () => {
      const onWrapperKeyDown = jest.fn();
      const { container } = render(
        <div onKeyDown={onWrapperKeyDown}>
          <CelestialCard {...defaultProps} />
        </div>,
        { wrapper: ClickProviders }
      );
      fireEvent.keyDown(container.firstChild!.firstChild as HTMLElement, { key: 'Enter' });
      expect(onDashboardClick).toHaveBeenCalledTimes(1);
      expect(onWrapperKeyDown).not.toHaveBeenCalled();
    });

    it('fires no dashboard action for an aggregated (stacked) leaf card', () => {
      const { container } = render(
        <CelestialCard {...defaultProps} stackedNodeIds={['a', 'b']} />,
        { wrapper: ClickProviders }
      );
      fireEvent.click(getCard(container));
      fireEvent.keyDown(getCard(container), { key: 'Enter' });
      expect(onDashboardClick).not.toHaveBeenCalled();
    });

    it('lets a "View insights" click reach the React Flow node (selection, zoom)', () => {
      const onWrapperClick = jest.fn();
      render(
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events
        <div onClick={onWrapperClick}>
          <CelestialCard {...defaultProps} />
        </div>,
        { wrapper: ClickProviders }
      );
      fireEvent.click(screen.getByRole('button', { name: 'View insights' }));
      expect(onDashboardClick).toHaveBeenCalledTimes(1);
      expect(onWrapperClick).toHaveBeenCalledTimes(1);
    });

    it('leaves Enter on an inner button to that button', () => {
      render(<CelestialCard {...groupProps} />, { wrapper: ClickProviders });
      const insights = screen.getByRole('button', { name: 'View insights' });
      const notPrevented = fireEvent.keyDown(insights, { key: 'Enter' });
      // The card must not hijack the key (toggling the group) or cancel the
      // button's native Enter -> click activation.
      expect(notPrevented).toBe(true);
      expect(addBreadcrumb).not.toHaveBeenCalled();
    });
  });
});
