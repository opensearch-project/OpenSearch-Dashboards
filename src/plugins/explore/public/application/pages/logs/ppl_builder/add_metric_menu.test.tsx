/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { AddMetricMenu } from './add_metric_menu';

describe('AddMetricMenu', () => {
  it('renders a labelled "Aggregation" button when no metric exists yet', () => {
    render(<AddMetricMenu onAdd={jest.fn()} dataTestSubj="pplBuilderAddAggregation" />);
    const trigger = screen.getByTestId('pplBuilderAddAggregation');
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveTextContent('Aggregation');
  });

  it('collapses to an icon-only trigger once a metric exists', () => {
    render(<AddMetricMenu onAdd={jest.fn()} hasMetrics dataTestSubj="pplBuilderAddAggregation" />);
    const trigger = screen.getByTestId('pplBuilderAddAggregation');
    // Icon trigger uses the label only as an aria-label, not visible text.
    expect(trigger).toHaveAttribute('aria-label', 'Aggregation');
    expect(trigger).not.toHaveTextContent('Aggregation');
  });

  it('opens the aggregation list and fires onAdd with the chosen aggregation id', () => {
    const onAdd = jest.fn();
    render(<AddMetricMenu onAdd={onAdd} dataTestSubj="pplBuilderAddAggregation" />);
    fireEvent.click(screen.getByTestId('pplBuilderAddAggregation'));
    // The catalog labels appear inside the opened popover.
    fireEvent.click(screen.getByText('Count'));
    expect(onAdd).toHaveBeenCalledWith('count');
  });

  it('fires onAdd for a field-based aggregation such as Average', () => {
    const onAdd = jest.fn();
    render(<AddMetricMenu onAdd={onAdd} dataTestSubj="pplBuilderAddAggregation" />);
    fireEvent.click(screen.getByTestId('pplBuilderAddAggregation'));
    fireEvent.click(screen.getByText('Average'));
    expect(onAdd).toHaveBeenCalledWith('avg');
  });
});
