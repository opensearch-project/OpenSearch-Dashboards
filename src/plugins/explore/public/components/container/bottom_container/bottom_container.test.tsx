/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { BottomContainer } from './bottom_container';
import {
  addColumn,
  legacyReducer,
  removeColumn,
  setColumns,
} from '../../../application/utils/state_management/slices/legacy';

const mockUseKeyboardShortcut = jest.fn();

jest.mock('../../../../../opensearch_dashboards_react/public', () => ({
  withOpenSearchDashboards: jest.fn((component) => component),
  useOpenSearchDashboards: () => ({
    services: { keyboardShortcut: { useKeyboardShortcut: mockUseKeyboardShortcut } },
  }),
}));

jest.mock('../../../application/context', () => ({
  useDatasetContext: () => ({ dataset: { timeFieldName: '@timestamp' } }),
}));

jest.mock('../../fields_selector/fields_selector_panel', () => ({
  DiscoverPanel: jest.fn(({ collapsePanel }: { collapsePanel: () => void }) => (
    <div data-test-subj="discover-panel">
      Discover Panel
      <button onClick={collapsePanel}>Collapse</button>
    </div>
  )),
}));

// Local result state makes remounts observable when the Fields panel toggles.
jest.mock('./bottom_right_container/bottom_right_container', () => {
  const React = jest.requireActual('react');
  return {
    BottomRightContainer: () => {
      const [expanded, setExpanded] = React.useState(false);
      return (
        <div data-test-subj="bottom-right-container">
          <button aria-pressed={expanded} onClick={() => setExpanded(!expanded)}>
            Expand result
          </button>
        </div>
      );
    },
  };
});

const { DiscoverPanel: mockDiscoverPanel } = jest.requireMock(
  '../../fields_selector/fields_selector_panel'
);

// jsdom has no layout, so supply the container measurements used by ResizeObserver.
let containerWidth = 0;
let resizeCallbacks: Array<(entries: Array<{ contentRect: { width: number } }>) => void> = [];
const createStore = () => configureStore({ reducer: { legacy: legacyReducer } });
let store: ReturnType<typeof createStore>;

const containerWithStore = () => (
  <Provider store={store}>
    <BottomContainer />
  </Provider>
);

const resizeTo = (width: number) => {
  containerWidth = width;
  act(() => {
    resizeCallbacks.forEach((cb) => cb([{ contentRect: { width } }]));
  });
};

const renderAtWidth = (width: number) => {
  containerWidth = width;
  return render(containerWithStore());
};

const NARROW = 940;
const WIDE = 1400;

const layouts: Array<[string, number]> = [
  ['wide', WIDE],
  ['narrow', NARROW],
];

describe('BottomContainer', () => {
  let originalGetBoundingClientRect: typeof HTMLElement.prototype.getBoundingClientRect;
  let originalResizeObserver: typeof global.ResizeObserver;

  beforeEach(() => {
    jest.clearAllMocks();
    resizeCallbacks = [];
    containerWidth = 0;
    store = createStore();
    store.dispatch(setColumns(['_source']));

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

  describe.each(layouts)('%s container', (_layout, width) => {
    it('starts closed without mounting the Fields panel', () => {
      renderAtWidth(width);

      const toggle = screen.getByRole('button', { name: 'Show fields' });
      expect(toggle).toHaveTextContent('Fields');
      expect(toggle).toHaveAttribute('aria-expanded', 'false');
      expect(mockDiscoverPanel).not.toHaveBeenCalled();
      expect(screen.queryByTestId('discover-panel')).not.toBeInTheDocument();
      expect(screen.getByTestId('bottom-right-container')).toBeInTheDocument();
    });

    it('mounts Fields on opening and unmounts it on collapse', async () => {
      renderAtWidth(width);
      fireEvent.click(screen.getByRole('button', { name: 'Show fields' }));
      expect(screen.getByTestId('discover-panel')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Collapse' }));
      expect(screen.queryByTestId('discover-panel')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Show fields' })).toHaveAttribute(
        'aria-expanded',
        'false'
      );
      await waitFor(() =>
        expect(screen.getByRole('button', { name: 'Show fields' })).toHaveFocus()
      );
    });

    it('keeps the chosen open or closed state when the parent updates', () => {
      const { rerender } = renderAtWidth(width);
      fireEvent.click(screen.getByRole('button', { name: 'Show fields' }));
      rerender(containerWithStore());
      expect(screen.getByTestId('discover-panel')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Collapse' }));
      rerender(containerWithStore());
      expect(screen.queryByTestId('discover-panel')).not.toBeInTheDocument();
    });

    it('connects the Fields control to the same panel before and after opening', () => {
      renderAtWidth(width);
      const toggle = screen.getByRole('button', { name: 'Show fields' });
      const panelId = toggle.getAttribute('aria-controls') ?? '';
      const panel = document.getElementById(panelId);
      expect(panel).toBeInTheDocument();

      fireEvent.click(toggle);
      expect(document.getElementById(panelId)).toContainElement(
        screen.getByTestId('discover-panel')
      );
      expect(screen.queryByRole('button', { name: 'Show fields' })).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Collapse' }));
      expect(screen.getByRole('button', { name: 'Show fields' })).toHaveAttribute(
        'aria-controls',
        panelId
      );
      expect(document.getElementById(panelId)).toBeInTheDocument();
    });

    it('gives each Fields control its own panel when multiple views are mounted', () => {
      containerWidth = width;
      render(
        <Provider store={store}>
          <BottomContainer />
          <BottomContainer />
        </Provider>
      );
      const toggles = screen.getAllByRole('button', { name: 'Show fields' });
      const firstPanelId = toggles[0].getAttribute('aria-controls') ?? '';
      const secondPanelId = toggles[1].getAttribute('aria-controls') ?? '';
      expect(firstPanelId).not.toEqual(secondPanelId);
      expect(document.getElementById(firstPanelId)).toBeInTheDocument();
      expect(document.getElementById(secondPanelId)).toBeInTheDocument();

      fireEvent.click(toggles[0]);
      expect(document.getElementById(firstPanelId)).toContainElement(
        screen.getByTestId('discover-panel')
      );
      expect(document.getElementById(secondPanelId)).not.toContainElement(
        screen.getByTestId('discover-panel')
      );
      expect(toggles[1]).toHaveAttribute('aria-expanded', 'false');
    });

    it('preserves result interaction state when Fields opens and closes', () => {
      renderAtWidth(width);
      fireEvent.click(screen.getByRole('button', { name: 'Expand result' }));

      fireEvent.click(screen.getByRole('button', { name: 'Show fields' }));
      expect(screen.getByRole('button', { name: 'Expand result' })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
      fireEvent.click(screen.getByRole('button', { name: 'Collapse' }));
      expect(screen.getByRole('button', { name: 'Expand result' })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
    });

    it.each(['{enter}', ' '])('opens Fields with the %s key', async (key) => {
      renderAtWidth(width);
      screen.getByRole('button', { name: 'Show fields' }).focus();
      await userEvent.keyboard(key);
      expect(screen.getByTestId('discover-panel')).toBeInTheDocument();
    });

    it('keeps the existing shortcut available while Fields is closed', () => {
      renderAtWidth(width);
      const shortcut = mockUseKeyboardShortcut.mock.calls[0][0];
      expect(shortcut).toMatchObject({
        id: 'ToggleFieldsPanel',
        pluginId: 'explore',
        keys: 'shift+f',
      });

      act(() => shortcut.execute());
      expect(screen.getByTestId('discover-panel')).toBeInTheDocument();
      act(() => shortcut.execute());
      expect(screen.queryByTestId('discover-panel')).not.toBeInTheDocument();
    });

    it('removes _source when a table action adds a column while Fields is closed', () => {
      renderAtWidth(width);

      act(() => {
        store.dispatch(addColumn({ column: 'foo' }));
      });

      expect(store.getState().legacy.columns).toEqual(['foo']);
      expect(mockDiscoverPanel).not.toHaveBeenCalled();
    });

    it('restores _source when a table action removes the last column while Fields is closed', () => {
      store.dispatch(setColumns(['foo']));
      renderAtWidth(width);

      act(() => {
        store.dispatch(removeColumn('foo'));
      });

      expect(store.getState().legacy.columns).toEqual(['_source']);
      expect(mockDiscoverPanel).not.toHaveBeenCalled();
    });

    it('cleans up columns loaded into state while Fields is closed', () => {
      renderAtWidth(width);

      act(() => {
        store.dispatch(setColumns(['_source', 'foo']));
      });
      expect(store.getState().legacy.columns).toEqual(['foo']);

      act(() => {
        store.dispatch(setColumns([]));
      });
      expect(store.getState().legacy.columns).toEqual(['_source']);
      expect(mockDiscoverPanel).not.toHaveBeenCalled();
    });

    it('excludes a newly added time field while Fields is closed', () => {
      store.dispatch(setColumns(['foo']));
      renderAtWidth(width);

      act(() => {
        store.dispatch(addColumn({ column: '@timestamp' }));
      });

      expect(store.getState().legacy.columns).toEqual(['foo']);
      expect(mockDiscoverPanel).not.toHaveBeenCalled();
    });

    it('keeps a time field that was already part of the saved selection', () => {
      store.dispatch(setColumns(['@timestamp', 'foo']));
      renderAtWidth(width);

      act(() => {
        store.dispatch(addColumn({ column: 'bar' }));
      });

      expect(store.getState().legacy.columns).toEqual(['@timestamp', 'foo', 'bar']);
      expect(mockDiscoverPanel).not.toHaveBeenCalled();
    });

    it('continues cleaning up columns after Fields has been collapsed', () => {
      renderAtWidth(width);
      fireEvent.click(screen.getByRole('button', { name: 'Show fields' }));
      act(() => {
        store.dispatch(addColumn({ column: 'foo' }));
      });
      expect(store.getState().legacy.columns).toEqual(['foo']);

      fireEvent.click(screen.getByRole('button', { name: 'Collapse' }));
      act(() => {
        store.dispatch(removeColumn('foo'));
      });

      expect(store.getState().legacy.columns).toEqual(['_source']);
      expect(screen.queryByTestId('discover-panel')).not.toBeInTheDocument();
    });
  });

  describe('wide container', () => {
    it('opens the resizable sidebar inline', () => {
      renderAtWidth(WIDE);
      fireEvent.click(screen.getByRole('button', { name: 'Show fields' }));

      expect(screen.getByTestId('dscBottomLeftCanvas')).toBeInTheDocument();
      expect(screen.queryByRole('dialog', { name: 'Fields' })).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Press left or right to adjust panels size' })
      ).toBeEnabled();
    });

    it('disables resizing while Fields is closed', () => {
      renderAtWidth(WIDE);
      expect(
        screen.getByRole('button', { name: 'Press left or right to adjust panels size' })
      ).toBeDisabled();
    });
  });

  describe('narrow container', () => {
    it('opens the Fields flyout from the rail toggle', () => {
      renderAtWidth(NARROW);
      fireEvent.click(screen.getByRole('button', { name: 'Show fields' }));

      expect(screen.getByRole('dialog', { name: 'Fields' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Show fields' })).not.toBeInTheDocument();
    });

    it.each([
      [
        'the mask is clicked',
        () => fireEvent.click(document.querySelector('.expBottomContainer__fieldsFlyoutMask')!),
      ],
      ['Escape is pressed', () => fireEvent.keyDown(window, { key: 'Escape' })],
      [
        'the panel collapses itself',
        () => fireEvent.click(screen.getByRole('button', { name: 'Collapse' })),
      ],
    ])('closes the Fields flyout when %s', (_label, close) => {
      renderAtWidth(NARROW);
      fireEvent.click(screen.getByRole('button', { name: 'Show fields' }));
      close();
      expect(screen.queryByRole('dialog', { name: 'Fields' })).not.toBeInTheDocument();
      expect(screen.queryByTestId('discover-panel')).not.toBeInTheDocument();
    });

    it('keeps the flyout open when Escape confirms an IME composition', () => {
      renderAtWidth(NARROW);
      fireEvent.click(screen.getByRole('button', { name: 'Show fields' }));
      fireEvent.keyDown(window, { key: 'Escape', isComposing: true });
      expect(screen.getByRole('dialog', { name: 'Fields' })).toBeInTheDocument();

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(screen.queryByRole('dialog', { name: 'Fields' })).not.toBeInTheDocument();
    });
  });

  describe('resizing', () => {
    it('keeps an open Fields panel open when switching layouts', () => {
      renderAtWidth(NARROW);
      fireEvent.click(screen.getByRole('button', { name: 'Show fields' }));

      resizeTo(WIDE);
      expect(screen.queryByRole('dialog', { name: 'Fields' })).not.toBeInTheDocument();
      expect(screen.getByTestId('dscBottomLeftCanvas')).toBeInTheDocument();

      resizeTo(NARROW);
      expect(screen.getByRole('dialog', { name: 'Fields' })).toBeInTheDocument();
    });

    it('keeps Fields closed when switching layouts', () => {
      renderAtWidth(WIDE);
      resizeTo(NARROW);
      expect(screen.getByRole('button', { name: 'Show fields' })).toBeInTheDocument();
      expect(screen.queryByTestId('discover-panel')).not.toBeInTheDocument();

      resizeTo(WIDE);
      expect(screen.getByRole('button', { name: 'Show fields' })).toBeInTheDocument();
      expect(screen.queryByTestId('discover-panel')).not.toBeInTheDocument();
    });

    it('renders neither layout until a non-zero width is measured', () => {
      renderAtWidth(0);
      expect(screen.queryByRole('button', { name: 'Show fields' })).not.toBeInTheDocument();
      expect(screen.queryByTestId('discover-panel')).not.toBeInTheDocument();

      resizeTo(NARROW);
      expect(screen.getByRole('button', { name: 'Show fields' })).toBeInTheDocument();
    });
  });
});
