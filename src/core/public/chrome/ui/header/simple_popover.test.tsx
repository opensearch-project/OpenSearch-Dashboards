/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, fireEvent, act } from '@testing-library/react';
import { SimplePopover } from './simple_popover';

describe('<SimplePopover />', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the button', () => {
    const { getByText } = render(
      <SimplePopover button={<span>Trigger</span>}>
        <div>Content</div>
      </SimplePopover>
    );
    expect(getByText('Trigger')).toBeInTheDocument();
  });

  it('opens on mouse enter and closes on mouse leave with debounce', () => {
    const { getByText, queryByText } = render(
      <SimplePopover button={<span>Trigger</span>} debounceMs={100}>
        <div>Popover Content</div>
      </SimplePopover>
    );

    expect(queryByText('Popover Content')).toBeNull();

    fireEvent.mouseEnter(getByText('Trigger').parentElement!);
    expect(getByText('Popover Content')).toBeInTheDocument();

    fireEvent.mouseLeave(getByText('Trigger').parentElement!);
    expect(getByText('Popover Content')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(100);
    });
  });

  it('cancels close when mouse re-enters before debounce expires', () => {
    const { getByText } = render(
      <SimplePopover button={<span>Trigger</span>} debounceMs={200}>
        <div>Popover Content</div>
      </SimplePopover>
    );

    fireEvent.mouseEnter(getByText('Trigger').parentElement!);
    expect(getByText('Popover Content')).toBeInTheDocument();

    fireEvent.mouseLeave(getByText('Trigger').parentElement!);

    act(() => {
      jest.advanceTimersByTime(100);
    });

    fireEvent.mouseEnter(getByText('Trigger').parentElement!);

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(getByText('Popover Content')).toBeInTheDocument();
  });

  it('cleans up pending timeout on unmount', () => {
    const { getByText, unmount } = render(
      <SimplePopover button={<span>Trigger</span>} debounceMs={200}>
        <div>Popover Content</div>
      </SimplePopover>
    );

    fireEvent.mouseEnter(getByText('Trigger').parentElement!);
    fireEvent.mouseLeave(getByText('Trigger').parentElement!);

    // Unmount while close timeout is pending — should not throw
    unmount();

    act(() => {
      jest.advanceTimersByTime(300);
    });
  });
});
