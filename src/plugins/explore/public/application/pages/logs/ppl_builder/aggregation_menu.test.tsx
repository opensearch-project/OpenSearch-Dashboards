/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { AggregationMenu } from './aggregation_menu';

describe('AggregationMenu', () => {
  it('renders the trigger showing the selected aggregation label', () => {
    render(<AggregationMenu value="count" onChange={jest.fn()} dataTestSubj="pplBuilderAgg" />);
    const trigger = screen.getByTestId('pplBuilderAgg');
    expect(trigger).toHaveTextContent('Count');
  });

  it('reflects a different selected value', () => {
    render(<AggregationMenu value="avg" onChange={jest.fn()} dataTestSubj="pplBuilderAgg" />);
    expect(screen.getByTestId('pplBuilderAgg')).toHaveTextContent('Average');
  });

  it('opens the list and fires onChange with the picked aggregation id', () => {
    const onChange = jest.fn();
    render(<AggregationMenu value="count" onChange={onChange} dataTestSubj="pplBuilderAgg" />);
    fireEvent.click(screen.getByTestId('pplBuilderAgg'));
    fireEvent.click(screen.getByTestId('pplBuilderAggOption-sum'));
    expect(onChange).toHaveBeenCalledWith('sum');
  });

  it('filters the list via the search box', () => {
    const onChange = jest.fn();
    render(<AggregationMenu value="count" onChange={onChange} dataTestSubj="pplBuilderAgg" />);
    fireEvent.click(screen.getByTestId('pplBuilderAgg'));
    fireEvent.change(screen.getByTestId('pplBuilderAgg-search'), { target: { value: 'median' } });
    expect(screen.getByTestId('pplBuilderAggOption-median')).toBeInTheDocument();
    expect(screen.queryByTestId('pplBuilderAggOption-count')).not.toBeInTheDocument();
  });
});
