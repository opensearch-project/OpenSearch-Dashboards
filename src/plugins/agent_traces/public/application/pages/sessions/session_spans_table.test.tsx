/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { SessionSpansTable } from './session_spans_table';
import { TraceRow } from '../traces/hooks/tree_utils';

const row = (overrides: Partial<TraceRow> = {}): TraceRow => ({
  id: 's1',
  spanId: 's1',
  traceId: 't1',
  parentSpanId: null,
  status: 'success',
  kind: 'invoke_agent',
  name: 'POST /plan',
  input: JSON.stringify([{ role: 'user', parts: [{ type: 'text', content: 'Plan a trip' }] }]),
  output: JSON.stringify([{ role: 'assistant', parts: [{ type: 'text', content: 'Sure!' }] }]),
  startTime: '',
  endTime: '',
  latency: '2.70s',
  durationNanos: 2.7e9,
  totalTokens: 100,
  inputTokens: 60,
  outputTokens: 40,
  totalCost: '—',
  ...overrides,
});

describe('SessionSpansTable', () => {
  it('renders status, kind, name, message previews and latency', () => {
    render(<SessionSpansTable rows={[row()]} onRowClick={jest.fn()} />);
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('POST /plan')).toBeInTheDocument();
    expect(screen.getByText('Plan a trip')).toBeInTheDocument();
    expect(screen.getByText('Sure!')).toBeInTheDocument();
    expect(screen.getByText('2.70s')).toBeInTheDocument();
  });

  it('shows Error status and a dash for empty previews', () => {
    render(
      <SessionSpansTable
        rows={[row({ status: 'error', input: '—', output: '—' })]}
        onRowClick={jest.fn()}
      />
    );
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBe(2);
  });

  it('calls onRowClick with the row', () => {
    const onRowClick = jest.fn();
    const r = row();
    render(<SessionSpansTable rows={[r]} onRowClick={onRowClick} />);
    fireEvent.click(screen.getByText('POST /plan'));
    expect(onRowClick).toHaveBeenCalledWith(r);
  });
});
