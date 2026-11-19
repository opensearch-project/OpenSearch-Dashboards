/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { QueryOptionsBar, QueryOptionsOverlay } from './query_options';

describe('QueryOptionsBar', () => {
  it('shows the max data points, or auto', () => {
    const { rerender } = render(<QueryOptionsBar isOpen={false} onToggle={jest.fn()} />);
    expect(screen.getByTestId('queryOptionsMaxDataPointsValue')).toHaveTextContent('auto');

    rerender(<QueryOptionsBar isOpen={false} maxDataPoints={200} onToggle={jest.fn()} />);
    expect(screen.getByTestId('queryOptionsMaxDataPointsValue')).toHaveTextContent('200');
  });

  it('toggles the options', () => {
    const onToggle = jest.fn();
    render(<QueryOptionsBar isOpen onToggle={onToggle} />);

    const toggle = screen.getByTestId('queryOptionsToggle');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(toggle);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});

describe('QueryOptionsOverlay', () => {
  const setup = (maxDataPoints?: number) => {
    const onMaxDataPointsChange = jest.fn();
    const onClose = jest.fn();
    render(
      <QueryOptionsOverlay
        maxDataPoints={maxDataPoints}
        onMaxDataPointsChange={onMaxDataPointsChange}
        onClose={onClose}
      />
    );
    const input = screen.getByTestId('queryOptionsMaxDataPointsInput') as HTMLInputElement;
    return { input, onMaxDataPointsChange, onClose };
  };

  it('applies a whole number of 1 or more', () => {
    const { input, onMaxDataPointsChange } = setup(200);
    expect(input.value).toBe('200');

    fireEvent.change(input, { target: { value: '500' } });
    expect(onMaxDataPointsChange).toHaveBeenLastCalledWith(500);
  });

  it('clears to auto', () => {
    const { input, onMaxDataPointsChange } = setup(200);
    fireEvent.change(input, { target: { value: '' } });
    expect(onMaxDataPointsChange).toHaveBeenLastCalledWith(undefined);
  });

  it("shows an error and doesn't apply an invalid value", () => {
    const { input, onMaxDataPointsChange } = setup();
    fireEvent.change(input, { target: { value: '0' } });

    expect(onMaxDataPointsChange).not.toHaveBeenCalled();
    expect(screen.getByText('Enter a whole number of 1 or more.')).toBeInTheDocument();
  });

  it('closes on Escape', () => {
    const { input, onClose } = setup();
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on a click beside the form', () => {
    const { onClose } = setup();
    fireEvent.click(screen.getByTestId('queryOptionsBackdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
