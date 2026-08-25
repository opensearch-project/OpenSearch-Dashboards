/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { TraceServiceNode, TraceServiceNodeData } from './trace_service_node';

jest.mock('@osd/apm-topology', () => ({
  NodeShell: ({ children, onClick, borderColor, isSelected, ...rest }: any) => (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events
    <div
      data-test-subj={rest['data-test-subj']}
      data-border={borderColor}
      data-selected={String(!!isSelected)}
      onClick={onClick}
    >
      {children}
    </div>
  ),
}));

const baseData: TraceServiceNodeData = {
  id: 'cart',
  title: 'cart',
  subtitle: '1.20s',
  color: '#54B399',
  hasError: false,
  metrics: [
    { label: 'Requests', value: 12, max: 20, color: '#69707D', formattedValue: '12' },
    { label: 'Errors', value: 0, max: 12, color: '#017D73', formattedValue: '0' },
    { label: 'Duration', value: 1200, max: 5000, color: '#0268BC', formattedValue: '1.20s' },
  ],
};

describe('TraceServiceNode', () => {
  it('renders the title and all three labeled metrics', () => {
    const { getByText } = render(<TraceServiceNode data={baseData} />);
    getByText('cart');
    ['Requests', 'Errors', 'Duration'].forEach((label) => getByText(label));
    getByText('12');
    getByText('1.20s');
  });

  it('uses the service color for the border and no error dot when healthy', () => {
    const { getByTestId, container } = render(<TraceServiceNode data={baseData} />);
    expect(getByTestId('traceServiceNode-cart')).toHaveAttribute('data-border', '#54B399');
    expect(container.querySelector('.exploreTraceServiceNode__errorDot')).toBeNull();
  });

  it('uses a red border and shows an error dot when the service has errors', () => {
    const data = {
      ...baseData,
      hasError: true,
      metrics: [
        ...baseData.metrics.slice(0, 1),
        { label: 'Errors', value: 2, max: 12, color: '#BD271E', formattedValue: '2 (17%)' },
        baseData.metrics[2],
      ],
    };
    const { getByTestId, container, getByText } = render(<TraceServiceNode data={data} />);
    expect(getByTestId('traceServiceNode-cart')).toHaveAttribute('data-border', '#BD271E');
    expect(container.querySelector('.exploreTraceServiceNode__errorDot')).toBeInTheDocument();
    getByText('2 (17%)');
  });

  it('fires onSelect with the service id when the card is clicked', () => {
    const onSelect = jest.fn();
    const { getByTestId } = render(<TraceServiceNode data={{ ...baseData, onSelect }} />);
    fireEvent.click(getByTestId('traceServiceNode-cart'));
    expect(onSelect).toHaveBeenCalledWith('cart');
  });

  it('marks the node selected when its filter is active', () => {
    const { getByTestId } = render(
      <TraceServiceNode data={{ ...baseData, isFilterActive: true }} />
    );
    expect(getByTestId('traceServiceNode-cart')).toHaveAttribute('data-selected', 'true');
  });
});
