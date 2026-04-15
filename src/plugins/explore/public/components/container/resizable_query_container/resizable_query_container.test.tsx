/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { render, screen, act } from '@testing-library/react';
import { ResizableQueryContainer, getInitialQueryPanelSize } from './resizable_query_container';

// Mock the scss import
jest.mock('./resizable_query_container.scss', () => ({}));

// Mock react-redux
const mockUseSelector = jest.fn();
jest.mock('react-redux', () => ({
  useSelector: (selector: any) => mockUseSelector(selector),
}));

// Mock the selectors module
const mockSelectIsPromptEditorMode = jest.fn();
jest.mock('../../../application/utils/state_management/selectors', () => ({
  selectLastExecutedTranslatedQuery: jest.fn(),
  selectIsPromptEditorMode: mockSelectIsPromptEditorMode,
}));

// Mock ResizeObserver (still needed by EUI internals)
const mockObserve = jest.fn();
const mockDisconnect = jest.fn();
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: mockObserve,
  unobserve: jest.fn(),
  disconnect: mockDisconnect,
}));

// Track resize events
const resizeEvents: Event[] = [];
const originalDispatchEvent = window.dispatchEvent;

describe('ResizableQueryContainer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    resizeEvents.length = 0;
    // Default: not in prompt mode (PPL/resizable path)
    mockUseSelector.mockImplementation((selector: any) => {
      if (selector === mockSelectIsPromptEditorMode) return false;
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

  describe('prompt mode', () => {
    beforeEach(() => {
      mockUseSelector.mockImplementation((selector: any) => {
        if (selector === mockSelectIsPromptEditorMode) return true;
        return '';
      });
    });

    it('renders a simple stacked layout without the resizable handle', () => {
      renderComponent();

      expect(screen.getByTestId('query-panel')).toBeInTheDocument();
      expect(screen.getByTestId('content-panel')).toBeInTheDocument();

      const promptContainer = document.querySelector('.exploreResizableQueryContainer--promptMode');
      expect(promptContainer).toBeInTheDocument();

      // No resize handle in prompt mode
      const handle = document.querySelector('.exploreResizableQueryContainer__resizeHandle');
      expect(handle).not.toBeInTheDocument();
    });

    it('does not render the resizable panel inner wrapper', () => {
      renderComponent();

      const inner = document.querySelector('.exploreResizableQueryContainer__queryPanelInner');
      expect(inner).not.toBeInTheDocument();
    });
  });
});
