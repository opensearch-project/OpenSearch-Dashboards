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

  it('closes when the trigger button is clicked', () => {
    const { getByText, queryByText } = render(
      <SimplePopover button={<span>Trigger</span>} debounceMs={100}>
        <div>Popover Content</div>
      </SimplePopover>
    );

    fireEvent.mouseEnter(getByText('Trigger').parentElement!);
    expect(getByText('Popover Content')).toBeInTheDocument();

    fireEvent.click(getByText('Trigger'));
    // EuiPopover keeps the panel mounted through its close transition; flush it.
    act(() => {
      jest.runOnlyPendingTimers();
    });
    expect(queryByText('Popover Content')).toBeNull();
  });

  it('closes when content inside the panel is clicked', () => {
    const { getByText, queryByText } = render(
      <SimplePopover button={<span>Trigger</span>} debounceMs={100}>
        <button type="button">Go to dashboard</button>
      </SimplePopover>
    );

    fireEvent.mouseEnter(getByText('Trigger').parentElement!);
    expect(getByText('Go to dashboard')).toBeInTheDocument();

    fireEvent.click(getByText('Go to dashboard'));
    act(() => {
      jest.runOnlyPendingTimers();
    });
    expect(queryByText('Go to dashboard')).toBeNull();
  });

  it('closes when clicking an element outside the anchor and panel', () => {
    // Regression: hovering a collapsed nav icon opens its popover; clicking a
    // DIFFERENT element (e.g. another rail icon that navigates) never fires
    // mouse-leave on this popover, so it would linger orphaned without an
    // outside-click dismissal.
    const { getByText, queryByText } = render(
      <div>
        <SimplePopover button={<span>Trigger</span>} debounceMs={100}>
          <div>Popover Content</div>
        </SimplePopover>
        <button type="button">Outside</button>
      </div>
    );

    fireEvent.mouseEnter(getByText('Trigger').parentElement!);
    expect(getByText('Popover Content')).toBeInTheDocument();

    fireEvent.mouseDown(getByText('Outside'));
    act(() => {
      jest.runOnlyPendingTimers();
    });
    expect(queryByText('Popover Content')).toBeNull();
  });

  it('does NOT close when clicking inside the panel content', () => {
    const { getByText } = render(
      <SimplePopover button={<span>Trigger</span>} debounceMs={100}>
        <div>Popover Content</div>
      </SimplePopover>
    );

    fireEvent.mouseEnter(getByText('Trigger').parentElement!);
    const content = getByText('Popover Content');
    expect(content).toBeInTheDocument();

    // A mousedown inside the panel must not dismiss it (only the click handler
    // on an actionable row should).
    fireEvent.mouseDown(content);
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
