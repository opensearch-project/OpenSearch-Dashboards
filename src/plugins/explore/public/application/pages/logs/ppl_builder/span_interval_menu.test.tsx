/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { SpanIntervalMenu } from './span_interval_menu';

describe('SpanIntervalMenu', () => {
  it('renders the trigger showing the current interval', () => {
    render(<SpanIntervalMenu interval="5m" onChange={jest.fn()} dataTestSubj="pplBuilderSpan" />);
    expect(screen.getByTestId('pplBuilderSpan')).toHaveTextContent('5m');
  });

  it('marks the trigger invalid when isInvalid is set', () => {
    render(
      <SpanIntervalMenu
        interval="bad"
        onChange={jest.fn()}
        isInvalid
        dataTestSubj="pplBuilderSpan"
      />
    );
    expect(screen.getByTestId('pplBuilderSpan').className).toContain('plqChip__param--invalid');
  });

  it('opens the preset list and fires onChange with the chosen preset', () => {
    const onChange = jest.fn();
    render(<SpanIntervalMenu interval="5m" onChange={onChange} dataTestSubj="pplBuilderSpan" />);
    fireEvent.click(screen.getByTestId('pplBuilderSpan'));
    fireEvent.click(screen.getByTestId('pplBuilderSpanIntervalOption-1h'));
    expect(onChange).toHaveBeenCalledWith('1h');
  });

  it('applies a custom typed interval verbatim via the create row', () => {
    const onChange = jest.fn();
    render(<SpanIntervalMenu interval="5m" onChange={onChange} dataTestSubj="pplBuilderSpan" />);
    fireEvent.click(screen.getByTestId('pplBuilderSpan'));
    fireEvent.change(screen.getByTestId('pplBuilderSpan-search'), { target: { value: '45s' } });
    fireEvent.click(screen.getByTestId('pplBuilderSpanIntervalCustom'));
    expect(onChange).toHaveBeenCalledWith('45s');
  });
});
