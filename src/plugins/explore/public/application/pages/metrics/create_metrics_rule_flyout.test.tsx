/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CreateMetricsRuleFlyout } from './create_metrics_rule_flyout';

describe('CreateMetricsRuleFlyout', () => {
  const mockHttp = {
    post: jest.fn().mockResolvedValue({}),
    get: jest
      .fn()
      .mockResolvedValue({ groups: [{ name: 'up' }, { name: 'node_cpu_seconds_total' }] }),
  };
  const mockClose = jest.fn();
  const mockToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders rule cards for each non-empty query', () => {
    render(
      <CreateMetricsRuleFlyout
        queries={['up', 'process_resident_memory_bytes', '']}
        datasourceId="ds-1"
        onClose={mockClose}
        http={mockHttp}
        addToast={mockToast}
      />
    );

    // Two non-empty queries -> two rule cards
    expect(screen.getByText('Query 1')).toBeInTheDocument();
    expect(screen.getByText('Query 2')).toBeInTheDocument();
    expect(screen.queryByText('Query 3')).not.toBeInTheDocument();
  });

  it('derives rule name from metric name', () => {
    render(
      <CreateMetricsRuleFlyout
        queries={['rate(http_requests_total[5m])', 'up']}
        datasourceId="ds-1"
        onClose={mockClose}
        http={mockHttp}
      />
    );

    // Should derive "http_requests_total" from rate(http_requests_total[5m])
    const nameInputs = screen.getAllByDisplayValue(/http_requests_total|up/);
    expect(nameInputs.length).toBe(2);
    expect(nameInputs[0]).toHaveValue('http_requests_total');
    expect(nameInputs[1]).toHaveValue('up');
  });

  it('shows empty state when no queries provided', () => {
    render(
      <CreateMetricsRuleFlyout
        queries={[]}
        datasourceId="ds-1"
        onClose={mockClose}
        http={mockHttp}
      />
    );

    expect(screen.getByText('No queries to create rules from')).toBeInTheDocument();
  });

  it('calls http.post for each rule on save', async () => {
    render(
      <CreateMetricsRuleFlyout
        queries={['up', 'node_cpu_seconds_total']}
        datasourceId="prom-ds-123"
        onClose={mockClose}
        http={mockHttp}
        addToast={mockToast}
      />
    );

    const saveButton = screen.getByRole('button', { name: /Create 2 rule/i });
    await act(async () => {
      fireEvent.click(saveButton);
      // Flush microtasks for the async save (http.post promises)
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    // Advance past the polling interval (5s per attempt)
    await act(async () => {
      jest.advanceTimersByTime(5000);
      await Promise.resolve();
    });

    // Advance past the close timeout (1000ms)
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockHttp.post).toHaveBeenCalledTimes(2);
    expect(mockHttp.post).toHaveBeenCalledWith(
      '/api/alerting/prometheus/prom-ds-123/rules',
      expect.objectContaining({
        body: expect.stringContaining('"name":"up"'),
      })
    );
    expect(mockHttp.post).toHaveBeenCalledWith(
      '/api/alerting/prometheus/prom-ds-123/rules',
      expect.objectContaining({
        body: expect.stringContaining('"name":"node_cpu_seconds_total"'),
      })
    );
    expect(mockClose).toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalledWith(expect.any(String), 'success');
  });

  it('includes evaluationInterval and forDuration in payload', async () => {
    render(
      <CreateMetricsRuleFlyout
        queries={['up']}
        datasourceId="ds-1"
        onClose={mockClose}
        http={mockHttp}
      />
    );

    const saveButton = screen.getByRole('button', { name: /Create 1 rule/i });
    await act(async () => {
      fireEvent.click(saveButton);
      await Promise.resolve();
      await Promise.resolve();
    });

    // Advance past polling
    await act(async () => {
      jest.advanceTimersByTime(5000);
      await Promise.resolve();
    });

    const body = JSON.parse(mockHttp.post.mock.calls[0][1].body);
    expect(body.evaluationInterval).toBe('1m');
    expect(body.forDuration).toBe('5m');
    expect(body.operator).toBe('>');
    expect(body.threshold).toBe(0);
    expect(body.groupName).toBe('up');
  });

  it('calls onClose when Cancel is clicked', () => {
    render(
      <CreateMetricsRuleFlyout
        queries={['up']}
        datasourceId="ds-1"
        onClose={mockClose}
        http={mockHttp}
      />
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(mockClose).toHaveBeenCalled();
  });

  it('disables save button when rule name is empty', () => {
    render(
      <CreateMetricsRuleFlyout
        queries={['up']}
        datasourceId="ds-1"
        onClose={mockClose}
        http={mockHttp}
      />
    );

    // Clear the rule name
    const nameInput = screen.getByDisplayValue('up');
    fireEvent.change(nameInput, { target: { value: '' } });

    const saveButton = screen.getByRole('button', { name: /Create 1 rule/i });
    expect(saveButton).toBeDisabled();
  });

  it('shows error toast on API failure', async () => {
    mockHttp.post.mockRejectedValueOnce(new Error('Network error'));

    render(
      <CreateMetricsRuleFlyout
        queries={['up']}
        datasourceId="ds-1"
        onClose={mockClose}
        http={mockHttp}
        addToast={mockToast}
      />
    );

    const saveButton = screen.getByRole('button', { name: /Create 1 rule/i });
    await act(async () => {
      fireEvent.click(saveButton);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockToast).toHaveBeenCalledWith(expect.any(String), 'danger');
    expect(mockClose).not.toHaveBeenCalled();
  });

  it('URL-encodes datasourceId in the API path', async () => {
    render(
      <CreateMetricsRuleFlyout
        queries={['up']}
        datasourceId="ds/with/slashes"
        onClose={mockClose}
        http={mockHttp}
      />
    );

    const saveButton = screen.getByRole('button', { name: /Create 1 rule/i });
    await act(async () => {
      fireEvent.click(saveButton);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockHttp.post).toHaveBeenCalledWith(
      '/api/alerting/prometheus/ds%2Fwith%2Fslashes/rules',
      expect.anything()
    );
  });
});

describe('deriveRuleName', () => {
  // Import the exported function directly
  const { deriveRuleName } = jest.requireActual('./create_metrics_rule_flyout');

  it.each([
    // Function-wrapped metrics → extracts inner metric name
    ['rate(http_requests_total[5m])', 'http_requests_total'],
    ['sum(node_cpu_seconds_total)', 'node_cpu_seconds_total'],
    ['avg(container_memory_usage_bytes{namespace="prod"})', 'container_memory_usage_bytes'],
    [
      'histogram_quantile(0.99, rate(http_duration_seconds_bucket[5m]))',
      'http_duration_seconds_bucket',
    ],
    ['increase(process_cpu_seconds_total[1h])', 'process_cpu_seconds_total'],

    // Simple metric names (no function wrapper)
    ['up', 'up'],
    ['node_load1', 'node_load1'],
    ['process_resident_memory_bytes', 'process_resident_memory_bytes'],

    // Metric with label selector (no function)
    ['http_requests_total{method="GET"}', 'http_requests_total'],

    // Nested functions → extracts deepest metric
    ['rate(http_requests_total{code=~"5.."}[5m])', 'http_requests_total'],

    // Fallback for unrecognizable input
    ['123 + 456', 'metrics_alert'],
  ])('deriveRuleName(%s) → %s', (input, expected) => {
    expect(deriveRuleName(input)).toBe(expected);
  });
});
