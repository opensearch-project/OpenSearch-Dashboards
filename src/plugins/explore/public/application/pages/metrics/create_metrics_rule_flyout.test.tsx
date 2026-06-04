/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CreateMetricsRuleFlyout } from './create_metrics_rule_flyout';

describe('CreateMetricsRuleFlyout', () => {
  const mockHttp = { post: jest.fn().mockResolvedValue({}) };
  const mockClose = jest.fn();
  const mockToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
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

    // Two non-empty queries → two rule cards
    expect(screen.getByText('Query 1')).toBeInTheDocument();
    expect(screen.getByText('Query 2')).toBeInTheDocument();
    expect(screen.queryByText('Query 3')).not.toBeInTheDocument();
  });

  it('derives rule name from metric name without _alert suffix', () => {
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
    expect(mockToast).toHaveBeenCalledWith(expect.stringContaining('2'), 'success');
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
    });

    expect(mockHttp.post).toHaveBeenCalledWith(
      '/api/alerting/prometheus/ds%2Fwith%2Fslashes/rules',
      expect.anything()
    );
  });
});
