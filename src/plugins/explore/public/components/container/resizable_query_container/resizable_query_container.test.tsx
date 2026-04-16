/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { ResizableQueryContainer, getInitialQueryPanelSize } from './resizable_query_container';

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

  it('computes initial size based on viewport height', () => {
    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
    // 80 / 768 * 100 ≈ 10.42%
    expect(getInitialQueryPanelSize()).toBeCloseTo(10.42, 0);
  });

  it('clamps initial size to minimum 5%', () => {
    Object.defineProperty(window, 'innerHeight', { value: 2000, writable: true });
    // 80 / 2000 * 100 = 4%, clamped to 5%
    expect(getInitialQueryPanelSize()).toBe(5);
  });

  it('clamps initial size to maximum 15%', () => {
    Object.defineProperty(window, 'innerHeight', { value: 200, writable: true });
    // 80 / 200 * 100 = 40%, clamped to 15%
    expect(getInitialQueryPanelSize()).toBe(15);
  });

  it('dispatches resize event after mount timeout', () => {
    renderComponent();

    // No resize events should have been dispatched yet (timer hasn't fired)
    const preTimerResizes = resizeEvents.filter((e) => e.type === 'resize').length;

    act(() => {
      jest.advanceTimersByTime(100);
    });

    const postTimerResizes = resizeEvents.filter((e) => e.type === 'resize').length;
    expect(postTimerResizes).toBeGreaterThan(preTimerResizes);
  });
});
