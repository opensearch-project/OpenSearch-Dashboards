/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { ResizableQueryContainer, getInitialQueryPanelSize } from './resizable_query_container';

// Mock the scss import
jest.mock('./resizable_query_container.scss', () => ({}));

// Mock react-redux
const mockUseSelector = jest.fn();
jest.mock('react-redux', () => ({
  useSelector: (selector: any) => mockUseSelector(selector),
}));

// Mock the selectors module
jest.mock('../../../application/utils/state_management/selectors', () => ({
  selectLastExecutedTranslatedQuery: jest.fn(),
  selectIsPromptEditorMode: 'selectIsPromptEditorMode',
}));

// Mock ResizeObserver (still needed by EUI internals)
const mockObserve = jest.fn();
const mockDisconnect = jest.fn();
const resizeObserverCallbacks: ResizeObserverCallback[] = [];
global.ResizeObserver = jest.fn().mockImplementation((callback: ResizeObserverCallback) => {
  resizeObserverCallbacks.push(callback);
  return {
    observe: mockObserve,
    unobserve: jest.fn(),
    disconnect: mockDisconnect,
  };
});

// Track resize events
const resizeEvents: Event[] = [];
const originalDispatchEvent = window.dispatchEvent;

describe('ResizableQueryContainer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    resizeEvents.length = 0;
    resizeObserverCallbacks.length = 0;
    mockObserve.mockClear();
    mockDisconnect.mockClear();
    // Default: not in prompt mode (PPL/resizable path)
    mockUseSelector.mockImplementation((selector: any) => {
      if (selector === 'selectIsPromptEditorMode') return false;
      return '';
    });
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

  it('uses the fixed pixel height on the first render without a settle pass', () => {
    renderComponent();

    const container = document.querySelector('.exploreResizableQueryContainer') as HTMLElement;
    expect(container.style.getPropertyValue('--explore-query-panel-height')).toBe('72px');
    expect(mockObserve.mock.calls.filter(([target]) => target === container)).toHaveLength(1);

    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(container.style.getPropertyValue('--explore-query-panel-height')).toBe('72px');
  });

  it('updates the fixed pixel height when EUI resizes the panel', () => {
    renderComponent();

    const container = document.querySelector('.exploreResizableQueryContainer') as HTMLElement;
    const queryPanelWrapper = document.querySelector(
      '.exploreResizableQueryContainer__queryPanelWrapper'
    ) as HTMLElement;
    const contentPanel = document.querySelector(
      '.exploreResizableQueryContainer__contentPanelWrapper'
    ) as HTMLElement;
    const rect = (height: number) =>
      ({
        width: 1000,
        height,
        top: 0,
        right: 1000,
        bottom: height,
        left: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect;
    jest.spyOn(container, 'getBoundingClientRect').mockReturnValue(rect(800));
    jest.spyOn(queryPanelWrapper, 'getBoundingClientRect').mockReturnValue(rect(82));
    jest.spyOn(contentPanel, 'getBoundingClientRect').mockReturnValue(rect(686));

    act(() => {
      resizeObserverCallbacks.forEach((callback) =>
        callback([] as ResizeObserverEntry[], {} as ResizeObserver)
      );
    });
    fireEvent.keyDown(
      document.querySelector('.exploreResizableQueryContainer__resizeHandle') as HTMLElement,
      { key: 'ArrowDown' }
    );

    expect(container.style.getPropertyValue('--explore-query-panel-height')).toBe('92px');
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
    Object.defineProperty(window, 'innerHeight', {
      value: 768,
      writable: true,
      configurable: true,
    });
    // 72 / 768 * 100 ≈ 9.38%
    expect(getInitialQueryPanelSize()).toBeCloseTo(9.38, 0);
  });

  it('clamps initial size to minimum 5%', () => {
    Object.defineProperty(window, 'innerHeight', {
      value: 2000,
      writable: true,
      configurable: true,
    });
    // 72 / 2000 * 100 = 3.6%, clamped to 5%
    expect(getInitialQueryPanelSize()).toBe(5);
  });

  it('clamps initial size to maximum 15%', () => {
    Object.defineProperty(window, 'innerHeight', {
      value: 200,
      writable: true,
      configurable: true,
    });
    // 72 / 200 * 100 = 36%, clamped to 15%
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

  describe('builder mode', () => {
    const builderPanel = (
      <div data-test-subj="query-panel">
        <div className="plqBuilder">Builder</div>
      </div>
    );

    const queryPanelSize = () =>
      parseFloat(
        (
          document.querySelector('.exploreResizableQueryContainer') as HTMLElement
        ).style.getPropertyValue('--explore-query-panel-height')
      );

    const renderBuilder = (natural: number) => {
      const result = render(
        <ResizableQueryContainer queryPanel={builderPanel}>{content}</ResizableQueryContainer>
      );
      const containerEl = document.querySelector('.exploreResizableQueryContainer') as HTMLElement;
      const builderEl = document.querySelector('.plqBuilder') as HTMLElement;
      Object.defineProperty(containerEl, 'clientHeight', { value: 800, configurable: true });
      // jsdom reports 0 for every rect, so the panel-chrome term measures as 0
      // and the builder's own scrollHeight is the whole natural height.
      Object.defineProperty(builderEl, 'scrollHeight', { value: natural, configurable: true });
      return result;
    };

    it('grows the query panel to the builder height', () => {
      const { rerender } = renderBuilder(400);

      act(() => {
        rerender(
          <ResizableQueryContainer queryPanel={builderPanel} builderActive>
            {content}
          </ResizableQueryContainer>
        );
      });

      expect(queryPanelSize()).toBe(400);
    });

    it('leaves the panel alone when the builder already fits', () => {
      const { rerender } = renderBuilder(10);
      const before = queryPanelSize();

      act(() => {
        rerender(
          <ResizableQueryContainer queryPanel={builderPanel} builderActive>
            {content}
          </ResizableQueryContainer>
        );
      });

      expect(queryPanelSize()).toBe(before);
    });

    it('lets the user drag the resizer smaller than the builder height', () => {
      const { rerender } = renderBuilder(400);

      const containerEl = document.querySelector('.exploreResizableQueryContainer') as HTMLElement;
      const queryPanelWrapper = document.querySelector(
        '.exploreResizableQueryContainer__queryPanelWrapper'
      ) as HTMLElement;
      const contentPanel = document.querySelector(
        '.exploreResizableQueryContainer__contentPanelWrapper'
      ) as HTMLElement;
      const rect = (height: number) =>
        ({
          width: 1000,
          height,
          top: 0,
          right: 1000,
          bottom: height,
          left: 0,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect;
      jest.spyOn(containerEl, 'getBoundingClientRect').mockReturnValue(rect(800));
      jest.spyOn(queryPanelWrapper, 'getBoundingClientRect').mockReturnValue(rect(82));
      jest.spyOn(contentPanel, 'getBoundingClientRect').mockReturnValue(rect(686));

      act(() => {
        rerender(
          <ResizableQueryContainer queryPanel={builderPanel} builderActive>
            {content}
          </ResizableQueryContainer>
        );
      });
      // Panel grew to the builder's natural height as its default.
      expect(queryPanelSize()).toBe(400);

      // User drags the resizer — EUI's ResizeObserver + arrow keys reports a
      // new panel size, which flips the "user resized" flag.
      act(() => {
        resizeObserverCallbacks.forEach((callback) =>
          callback([] as ResizeObserverEntry[], {} as ResizeObserver)
        );
      });
      fireEvent.keyDown(
        document.querySelector('.exploreResizableQueryContainer__resizeHandle') as HTMLElement,
        { key: 'ArrowUp' }
      );
      const afterDrag = queryPanelSize();
      expect(afterDrag).toBeLessThan(400);

      // The builder observer firing again must not push the panel back up.
      act(() => {
        resizeObserverCallbacks.forEach((callback) =>
          callback([] as ResizeObserverEntry[], {} as ResizeObserver)
        );
      });
      expect(queryPanelSize()).toBe(afterDrag);
    });
  });

  describe('widgets bar sizing', () => {
    const panelWithWidgets = (
      <div data-test-subj="query-panel">
        <div className="exploreQueryPanel__widgetsRow">Widgets</div>
      </div>
    );

    const queryPanelSize = () =>
      parseFloat(
        (
          document.querySelector('.exploreResizableQueryContainer') as HTMLElement
        ).style.getPropertyValue('--explore-query-panel-height')
      );

    it('grows the default panel height when the widgets bar wraps to more rows', () => {
      render(
        <ResizableQueryContainer queryPanel={panelWithWidgets}>{content}</ResizableQueryContainer>
      );
      const widgetsEl = document.querySelector('.exploreQueryPanel__widgetsRow') as HTMLElement;
      Object.defineProperty(widgetsEl, 'scrollHeight', { value: 54, configurable: true });

      act(() => {
        resizeObserverCallbacks.forEach((callback) =>
          callback([] as ResizeObserverEntry[], {} as ResizeObserver)
        );
      });

      // 54px widgets bar + 42px editor line.
      expect(queryPanelSize()).toBe(96);
    });

    it('keeps the dragged height after switching to the builder and back', () => {
      const panelWithBuilder = (
        <div data-test-subj="query-panel">
          <div className="exploreQueryPanel__widgetsRow">Widgets</div>
          <div className="plqBuilder">Builder</div>
        </div>
      );
      const { rerender } = render(
        <ResizableQueryContainer queryPanel={panelWithBuilder}>{content}</ResizableQueryContainer>
      );

      const containerEl = document.querySelector('.exploreResizableQueryContainer') as HTMLElement;
      const queryPanelWrapper = document.querySelector(
        '.exploreResizableQueryContainer__queryPanelWrapper'
      ) as HTMLElement;
      const contentPanel = document.querySelector(
        '.exploreResizableQueryContainer__contentPanelWrapper'
      ) as HTMLElement;
      const rect = (height: number) =>
        ({
          width: 1000,
          height,
          top: 0,
          right: 1000,
          bottom: height,
          left: 0,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect;
      jest.spyOn(containerEl, 'getBoundingClientRect').mockReturnValue(rect(800));
      jest.spyOn(queryPanelWrapper, 'getBoundingClientRect').mockReturnValue(rect(300));
      jest.spyOn(contentPanel, 'getBoundingClientRect').mockReturnValue(rect(500));
      const builderEl = document.querySelector('.plqBuilder') as HTMLElement;
      Object.defineProperty(builderEl, 'scrollHeight', { value: 400, configurable: true });

      // User drags the resizer in code mode to a custom height.
      act(() => {
        resizeObserverCallbacks.forEach((callback) =>
          callback([] as ResizeObserverEntry[], {} as ResizeObserver)
        );
      });
      fireEvent.keyDown(
        document.querySelector('.exploreResizableQueryContainer__resizeHandle') as HTMLElement,
        { key: 'ArrowDown' }
      );
      const dragged = queryPanelSize();

      act(() => {
        rerender(
          <ResizableQueryContainer queryPanel={panelWithBuilder} builderActive>
            {content}
          </ResizableQueryContainer>
        );
      });
      act(() => {
        rerender(
          <ResizableQueryContainer queryPanel={panelWithBuilder}>{content}</ResizableQueryContainer>
        );
      });

      expect(queryPanelSize()).toBe(dragged);
    });
  });

  describe('prompt mode', () => {
    beforeEach(() => {
      mockUseSelector.mockImplementation((selector: any) => {
        if (selector === 'selectIsPromptEditorMode') return true;
        return '';
      });
    });

    it('adds the prompt mode class to the container', () => {
      renderComponent();

      const container = document.querySelector('.exploreResizableQueryContainer--promptMode');
      expect(container).toBeInTheDocument();
    });

    it('still renders query panel, content, and resize handle in the DOM', () => {
      renderComponent();

      expect(screen.getByTestId('query-panel')).toBeInTheDocument();
      expect(screen.getByTestId('content-panel')).toBeInTheDocument();

      // Resize handle is still in the DOM (just hidden via CSS)
      const handle = document.querySelector('.exploreResizableQueryContainer__resizeHandle');
      expect(handle).toBeInTheDocument();
    });
  });
});
