/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TimelineGantt, TimelineGanttProps } from './timeline_gantt';
import { TimelineSpan } from './tree_helpers';

jest.mock('@osd/i18n/react', () => ({
  FormattedMessage: ({ defaultMessage }: { defaultMessage: string }) => <>{defaultMessage}</>,
}));

jest.mock('@osd/ui-shared-deps/theme', () => ({
  euiThemeVars: {
    euiColorLightestShade: '#f5f7fa',
    euiColorPrimary: '#006BB4',
  },
}));

jest.mock('../../../../services/span_categorization', () => ({
  getCategoryMeta: jest.fn(() => ({
    color: '#54B399',
    bgColor: '#54B399',
    icon: 'Bot',
    label: 'Agent',
  })),
  hexToRgba: jest.fn(() => 'rgba(0,0,0,0.1)'),
}));

const makeSpan = (overrides: Partial<TimelineSpan> = {}): TimelineSpan => ({
  node: { id: 'n1', label: 'Span 1', latency: '100ms' },
  depth: 0,
  startMs: 1000,
  endMs: 2000,
  durationMs: 1000,
  category: 'AGENT',
  categoryColor: '#006BB4',
  hasChildren: false,
  ...overrides,
});

const defaultProps: TimelineGanttProps = {
  timelineVisibleSpans: [makeSpan()],
  timelineRange: { minMs: 1000, maxMs: 2000, durationMs: 1000 },
  selectedNodeId: undefined,
  expandedNodes: new Set(),
  onSelectNode: jest.fn(),
  onToggleExpanded: jest.fn(),
};

describe('TimelineGantt', () => {
  it('renders loading state', () => {
    render(<TimelineGantt {...defaultProps} isLoadingFullTree={true} />);
    expect(screen.getByText('Loading trace timeline...')).toBeInTheDocument();
  });

  it('renders empty state when no spans', () => {
    render(
      <TimelineGantt
        {...defaultProps}
        timelineVisibleSpans={[]}
        timelineRange={{ minMs: 0, maxMs: 0, durationMs: 0 }}
      />
    );
    expect(screen.getByText('No timing data available for timeline.')).toBeInTheDocument();
  });

  it('renders timeline rows', () => {
    render(<TimelineGantt {...defaultProps} />);
    expect(screen.getByText('Span 1')).toBeInTheDocument();
    expect(screen.getByText('100ms')).toBeInTheDocument();
  });

  it('calls onSelectNode when row is clicked', () => {
    const onSelectNode = jest.fn();
    render(<TimelineGantt {...defaultProps} onSelectNode={onSelectNode} />);
    fireEvent.click(screen.getByText('Span 1'));
    expect(onSelectNode).toHaveBeenCalledWith('n1');
  });

  it('calls onToggleExpanded when expand icon is clicked', () => {
    const onToggleExpanded = jest.fn();
    const span = makeSpan({ hasChildren: true });
    render(
      <TimelineGantt
        {...defaultProps}
        timelineVisibleSpans={[span]}
        onToggleExpanded={onToggleExpanded}
      />
    );
    const expandIcon = document.querySelector('.agentTracesFlyout__timelineLabelExpand');
    if (expandIcon) fireEvent.click(expandIcon);
    expect(onToggleExpanded).toHaveBeenCalledWith('n1');
  });

  it('highlights selected row', () => {
    render(<TimelineGantt {...defaultProps} selectedNodeId="n1" />);
    const row = document.querySelector('.agentTracesFlyout__timelineRow--selected');
    expect(row).toBeTruthy();
  });
});
