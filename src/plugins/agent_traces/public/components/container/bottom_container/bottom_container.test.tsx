/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { BottomContainer } from './bottom_container';

// The fields panel is driven entirely through `collapsePanel`, so the mock exposes it as a
// button — that is how both layouts dismiss the panel.
jest.mock('../../fields_selector/fields_selector_panel', () => ({
  DiscoverPanel: ({ collapsePanel }: { collapsePanel: () => void }) => (
    <div data-test-subj="discover-panel">
      Discover Panel
      <button data-test-subj="mock-collapse-panel" onClick={collapsePanel}>
        Collapse
      </button>
    </div>
  ),
}));

// Stands in for `TraceFlyoutProvider`, which lives inside `BottomRightContainer` and calls
// `collapseSidebar()` before opening the trace details flyout.
jest.mock('./bottom_right_container/bottom_right_container', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { useSidebarPanel: useSidebarPanelHook } = require('./sidebar_panel_context');
  return {
    BottomRightContainer: () => {
      const { collapseSidebar } = useSidebarPanelHook();
      return (
        <div data-test-subj="bottom-right-container">
          Bottom Right Container
          <button data-test-subj="mock-collapse-sidebar" onClick={collapseSidebar}>
            Collapse sidebar
          </button>
        </div>
      );
    },
  };
});

// `BottomContainer` picks its layout from the measured *container* width, so the tests have to
// supply one: jsdom reports 0 for every element, and the global ResizeObserver stand-in
// (src/dev/jest/mocks/resize_observer_mock.js) never invokes its callback.
let containerWidth = 0;
let resizeCallbacks: Array<(entries: Array<{ contentRect: { width: number } }>) => void> = [];

const resizeTo = (width: number) => {
  containerWidth = width;
  act(() => {
    resizeCallbacks.forEach((cb) => cb([{ contentRect: { width } }]));
  });
};

const renderAtWidth = (width: number) => {
  containerWidth = width;
  return render(<BottomContainer />);
};

const NARROW = 940; // the embedded-canvas target width
const WIDE = 1400;

describe('BottomContainer', () => {
  let originalGetBoundingClientRect: typeof HTMLElement.prototype.getBoundingClientRect;
  let originalResizeObserver: typeof global.ResizeObserver;

  beforeEach(() => {
    resizeCallbacks = [];
    containerWidth = 0;

    originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;
    HTMLElement.prototype.getBoundingClientRect = function getBoundingClientRect() {
      return { width: containerWidth, height: 0 } as DOMRect;
    };

    originalResizeObserver = global.ResizeObserver;
    global.ResizeObserver = class {
      constructor(callback: (entries: Array<{ contentRect: { width: number } }>) => void) {
        resizeCallbacks.push(callback);
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof global.ResizeObserver;
  });

  afterEach(() => {
    HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect;
    global.ResizeObserver = originalResizeObserver;
  });

  describe('wide container', () => {
    it('renders both panels inline in the resizable container', () => {
      renderAtWidth(WIDE);

      expect(document.querySelector('.agentTraces-layout__bottom-panel')).toBeInTheDocument();
      expect(screen.getByTestId('dscBottomLeftCanvas')).toBeInTheDocument();
      expect(screen.getByTestId('discover-panel')).toBeInTheDocument();
      expect(screen.getByTestId('bottom-right-container')).toBeInTheDocument();
    });

    it('does not offer the fields flyout', () => {
      renderAtWidth(WIDE);

      expect(screen.queryByTestId('agentTracesFieldsFlyoutToggle')).not.toBeInTheDocument();
    });
  });

  describe('narrow container', () => {
    it('replaces the inline fields panel with a rail toggle', () => {
      renderAtWidth(NARROW);

      expect(screen.getByTestId('agentTracesFieldsFlyoutToggle')).toBeInTheDocument();
      expect(screen.getByTestId('bottom-right-container')).toBeInTheDocument();
      // The panel is not merely hidden — it is unmounted until the flyout is opened.
      expect(screen.queryByTestId('discover-panel')).not.toBeInTheDocument();
    });

    it('opens the fields flyout from the rail toggle', () => {
      renderAtWidth(NARROW);
      fireEvent.click(screen.getByTestId('agentTracesFieldsFlyoutToggle'));

      expect(screen.getByTestId('agentTracesFieldsFlyout')).toBeInTheDocument();
      expect(screen.getByTestId('discover-panel')).toBeInTheDocument();
    });

    it.each([
      [
        'the mask is clicked',
        () => fireEvent.click(document.querySelector('.agentTraces-layout__fieldsFlyoutMask')!),
      ],
      ['Escape is pressed', () => fireEvent.keyDown(window, { key: 'Escape' })],
      // Same affordance the wide layout uses, so the collapse button behaves identically in both.
      [
        'the panel collapses itself',
        () => fireEvent.click(screen.getByTestId('mock-collapse-panel')),
      ],
      // The trace details flyout would otherwise open on top of the fields flyout.
      [
        'a consumer calls collapseSidebar',
        () => fireEvent.click(screen.getByTestId('mock-collapse-sidebar')),
      ],
    ])('closes the fields flyout when %s', (_label, close) => {
      renderAtWidth(NARROW);
      fireEvent.click(screen.getByTestId('agentTracesFieldsFlyoutToggle'));
      expect(screen.getByTestId('agentTracesFieldsFlyout')).toBeInTheDocument();

      close();

      expect(screen.queryByTestId('agentTracesFieldsFlyout')).not.toBeInTheDocument();
    });
  });

  describe('sidebar panel context', () => {
    // The provider is hoisted above both layouts, so `useSidebarPanel` has to resolve in the
    // narrow one too — where there is no `EuiResizableContainer` to supply `togglePanel`.
    it('is available to descendants in both layouts', () => {
      renderAtWidth(NARROW);
      expect(screen.getByTestId('mock-collapse-sidebar')).toBeInTheDocument();

      resizeTo(WIDE);
      expect(screen.getByTestId('mock-collapse-sidebar')).toBeInTheDocument();
    });

    // Guards against the narrow branch of `collapseSidebar` leaking into the wide layout, where
    // it must collapse the resizable panel rather than unmount anything.
    it('keeps the inline fields panel mounted when collapseSidebar runs in the wide layout', () => {
      renderAtWidth(WIDE);

      fireEvent.click(screen.getByTestId('mock-collapse-sidebar'));

      expect(screen.getByTestId('discover-panel')).toBeInTheDocument();
      expect(screen.getByTestId('dscBottomLeftCanvas')).toBeInTheDocument();
    });
  });

  describe('resizing', () => {
    it('swaps to the inline layout when the container grows, dropping the flyout', () => {
      renderAtWidth(NARROW);
      fireEvent.click(screen.getByTestId('agentTracesFieldsFlyoutToggle'));

      resizeTo(WIDE);

      expect(screen.queryByTestId('agentTracesFieldsFlyout')).not.toBeInTheDocument();
      expect(screen.getByTestId('dscBottomLeftCanvas')).toBeInTheDocument();
    });

    it('swaps to the flyout layout when the container shrinks', () => {
      renderAtWidth(WIDE);

      resizeTo(NARROW);

      expect(screen.getByTestId('agentTracesFieldsFlyoutToggle')).toBeInTheDocument();
      expect(screen.queryByTestId('dscBottomLeftCanvas')).not.toBeInTheDocument();
    });

    // A container can measure 0 before its first real layout (e.g. an inactive tab). Committing
    // to a layout then would flash the wrong one, so the component waits for a non-zero width.
    it('renders neither layout until a non-zero width is measured', () => {
      renderAtWidth(0);

      expect(screen.queryByTestId('agentTracesFieldsFlyoutToggle')).not.toBeInTheDocument();
      expect(screen.queryByTestId('dscBottomLeftCanvas')).not.toBeInTheDocument();

      resizeTo(NARROW);

      expect(screen.getByTestId('agentTracesFieldsFlyoutToggle')).toBeInTheDocument();
    });
  });
});
