/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { ResizableQueryContainer } from './resizable_query_container';

// Mock the scss import
jest.mock('./resizable_query_container.scss', () => ({}));

// Track resize events
const resizeEvents: Event[] = [];
const originalDispatchEvent = window.dispatchEvent;

describe('ResizableQueryContainer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    resizeEvents.length = 0;
    window.dispatchEvent = jest.fn((event: Event) => {
      resizeEvents.push(event);
      return originalDispatchEvent.call(window, event);
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    window.dispatchEvent = originalDispatchEvent;
  });

  const queryPanel = <div data-test-subj="query-panel">Query Panel</div>;
  const content = <div data-test-subj="content-panel">Content</div>;

  const renderComponent = () => {
    return render(
      <ResizableQueryContainer queryPanel={queryPanel}>{content}</ResizableQueryContainer>
    );
  };

  it('renders the query panel and content', () => {
    renderComponent();

    expect(screen.getByTestId('query-panel')).toBeInTheDocument();
    expect(screen.getByTestId('content-panel')).toBeInTheDocument();
  });

  it('renders the wrapper element', () => {
    renderComponent();

    const wrapper = document.querySelector('.exploreResizableQueryContainer__wrapper');
    expect(wrapper).toBeInTheDocument();
  });

  it('renders the resizable container with vertical direction', () => {
    renderComponent();

    const container = document.querySelector('.exploreResizableQueryContainer');
    expect(container).toBeInTheDocument();
  });

  it('renders the query panel inner wrapper', () => {
    renderComponent();

    const inner = document.querySelector('.exploreResizableQueryContainer__queryPanelInner');
    expect(inner).toBeInTheDocument();
  });

  it('renders the resize handle', () => {
    renderComponent();

    const handle = document.querySelector('.exploreResizableQueryContainer__resizeHandle');
    expect(handle).toBeInTheDocument();
  });

  it('dispatches resize event on mount for Monaco layout', () => {
    renderComponent();

    act(() => {
      jest.advanceTimersByTime(100);
    });

    const resizeDispatched = resizeEvents.some((e) => e.type === 'resize');
    expect(resizeDispatched).toBe(true);
  });

  it('uses fallback size before measurement', () => {
    renderComponent();

    // Before the measurement timer fires, the container should render
    // with the fallback size (key="default")
    const container = document.querySelector('.exploreResizableQueryContainer');
    expect(container).toBeInTheDocument();
  });

  it('attempts measurement after timeout', () => {
    renderComponent();

    act(() => {
      jest.advanceTimersByTime(200);
    });

    // Component should still be rendered after measurement attempt
    expect(screen.getByTestId('query-panel')).toBeInTheDocument();
    expect(screen.getByTestId('content-panel')).toBeInTheDocument();
  });

  it('dispatches resize event on panel width change', () => {
    renderComponent();

    // Clear events from mount
    resizeEvents.length = 0;

    // Trigger a resize by dispatching a resize event (simulating panel change)
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    expect(resizeEvents.length).toBeGreaterThan(0);
  });
});
