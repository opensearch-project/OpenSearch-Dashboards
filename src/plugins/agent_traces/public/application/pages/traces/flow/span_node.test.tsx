/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { SpanNode } from './span_node';
import { CategorizedSpan } from '../../../../services/span_categorization';

jest.mock('@osd/ui-shared-deps/theme', () => ({
  euiThemeVars: {
    euiColorDanger: '#BD271E',
    euiTextColor: '#343741',
    euiColorLightShade: '#D3DAE6',
    euiColorDarkShade: '#69707D',
  },
}));

jest.mock('../../../../services/span_categorization', () => ({
  getCategoryBadgeStyle: jest.fn(() => ({ backgroundColor: '#eee', color: '#333' })),
  getCategoryMeta: jest.fn(() => ({
    color: '#006BB4',
    bgColor: '#006BB4',
    icon: 'user',
    label: 'Agent',
  })),
  hexToRgba: jest.fn(() => 'rgba(0,107,180,0.1)'),
}));

jest.mock('@xyflow/react', () => ({
  Handle: ({ type }: any) => <div data-test-subj={`handle-${type}`} />,
  Position: { Top: 'top', Bottom: 'bottom' },
}));

const makeSpan = (overrides: Partial<CategorizedSpan> = {}): CategorizedSpan =>
  ({
    id: 'span-1',
    spanId: 'span-1',
    traceId: 'trace-1',
    parentSpanId: null,
    status: 'success',
    kind: 'chat',
    name: 'Test Span',
    displayName: 'test/agent/run',
    category: 'AGENT' as const,
    categoryLabel: 'Agent',
    categoryColor: '#006BB4',
    categoryIcon: 'user',
    input: '',
    output: '',
    startTime: '',
    endTime: '',
    latency: '200ms',
    totalTokens: 10,
    totalCost: '—',
    ...overrides,
  } as CategorizedSpan);

describe('SpanNode', () => {
  it('renders display name', () => {
    render(<SpanNode data={{ span: makeSpan(), totalDuration: 1000 }} />);
    expect(screen.getByText('test/agent/run')).toBeInTheDocument();
  });

  it('renders category badge', () => {
    render(<SpanNode data={{ span: makeSpan(), totalDuration: 1000 }} />);
    expect(screen.getByText('AGENT')).toBeInTheDocument();
  });

  it('renders latency', () => {
    render(<SpanNode data={{ span: makeSpan(), totalDuration: 1000 }} />);
    expect(screen.getByText('200ms')).toBeInTheDocument();
  });

  it('renders error badge for error status', () => {
    render(<SpanNode data={{ span: makeSpan({ status: 'error' }), totalDuration: 1000 }} />);
    expect(screen.getByText('ERR')).toBeInTheDocument();
  });

  it('does not render error badge for success status', () => {
    render(<SpanNode data={{ span: makeSpan(), totalDuration: 1000 }} />);
    expect(screen.queryByText('ERR')).not.toBeInTheDocument();
  });

  it('renders handles', () => {
    render(<SpanNode data={{ span: makeSpan(), totalDuration: 1000 }} />);
    expect(screen.getByTestId('handle-target')).toBeInTheDocument();
    expect(screen.getByTestId('handle-source')).toBeInTheDocument();
  });
});
