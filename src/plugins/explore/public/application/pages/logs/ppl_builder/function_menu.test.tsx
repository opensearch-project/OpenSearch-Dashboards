/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { FunctionMenu } from './function_menu';

describe('FunctionMenu', () => {
  it('renders the ƒx trigger', () => {
    render(<FunctionMenu onAddFunction={jest.fn()} dataTestSubj="pplBuilderFx" />);
    const trigger = screen.getByTestId('pplBuilderFx');
    expect(trigger).toHaveTextContent('ƒx');
    expect(trigger).toHaveAttribute('aria-label', 'Wrap in function');
  });

  it('opens the popover and shows grouped scalar functions with category headers', () => {
    render(<FunctionMenu onAddFunction={jest.fn()} dataTestSubj="pplBuilderFx" />);
    fireEvent.click(screen.getByTestId('pplBuilderFx'));
    // Category headers derived from consecutive option groups.
    expect(screen.getByText('Math')).toBeInTheDocument();
    expect(screen.getByText('String')).toBeInTheDocument();
    expect(screen.getByText('Date & time')).toBeInTheDocument();
  });

  it('fires onAddFunction with a fresh ScalarCall carrying a copy of the params', () => {
    const onAddFunction = jest.fn();
    render(<FunctionMenu onAddFunction={onAddFunction} dataTestSubj="pplBuilderFx" />);
    fireEvent.click(screen.getByTestId('pplBuilderFx'));
    fireEvent.click(screen.getByTestId('pplBuilderFnOption-round'));
    expect(onAddFunction).toHaveBeenCalledWith({ id: 'round', name: 'round', params: [''] });
  });

  it('filters functions via the search box', () => {
    render(<FunctionMenu onAddFunction={jest.fn()} dataTestSubj="pplBuilderFx" />);
    fireEvent.click(screen.getByTestId('pplBuilderFx'));
    fireEvent.change(screen.getByTestId('pplBuilderFx-search'), { target: { value: 'lower' } });
    expect(screen.getByTestId('pplBuilderFnOption-lower')).toBeInTheDocument();
    expect(screen.queryByTestId('pplBuilderFnOption-abs')).not.toBeInTheDocument();
  });
});
