/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { render, screen, fireEvent, waitFor } from '../../test-utils/vitest.utilities';
import { CelestialNodeActionsProvider } from '../../shared/contexts/NodeActionsContext';
import { PropsWithChildren } from 'react';
import { CelestialStateProvider } from '../../shared/contexts/CelestialStateContext';
import { CelestialCard } from './CelestialCard';
import { HEALTH_DONUT_TEST_ID } from '../HealthDonut';

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
});
