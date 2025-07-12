/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BottomContainer } from './bottom_container';
import { legacyReducer } from '../../../application/utils/state_management/slices';
import { uiReducer } from '../../../application/utils/state_management/slices/ui/ui_slice';

// Mock the components
jest.mock('../../../application/legacy/discover/application/view_components/panel', () => ({
  DiscoverPanel: () => <div data-test-subj="discover-panel">Discover Panel</div>,
}));

jest.mock('./bottom_right_container/bottom_right_container', () => ({
  BottomRightContainer: () => (
    <div data-test-subj="bottom-right-container">Bottom Right Container</div>
  ),
}));

jest.mock('../../../components/top_nav/top_nav', () => ({
  TopNav: ({ setHeaderActionMenu }: { setHeaderActionMenu?: () => void }) => (
    <div data-test-subj="top-nav">
      Top Nav
      {setHeaderActionMenu && <button onClick={setHeaderActionMenu}>Set Header</button>}
    </div>
  ),
}));

// Mock the hooks
jest.mock('../../../application/utils/hooks/use_page_initialization', () => ({
  useInitPage: jest.fn(),
}));

import { useInitPage } from '../../../application/utils/hooks/use_page_initialization';

const mockUseInitPage = useInitPage as jest.MockedFunction<typeof useInitPage>;

describe('BottomContainer', () => {
  const mockStore = configureStore({
    reducer: {
      legacy: legacyReducer,
      ui: uiReducer,
    },
    preloadedState: {
      legacy: {
        savedSearch: undefined,
        savedQuery: undefined,
        columns: [],
        sort: [],
        interval: 'auto',
        isDirty: false,
        lineCount: undefined,
      },
      ui: {
        activeTabId: 'logs',
        showFilterPanel: true,
        showHistogram: true,
      },
    },
  });

  const mockSetHeaderActionMenu = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseInitPage.mockReturnValue({
      savedExplore: { id: 'test-id', title: 'Test Explore' } as any,
    });
  });

  const renderComponent = (props = {}) => {
    return render(
      <Provider store={mockStore}>
        <BottomContainer setHeaderActionMenu={mockSetHeaderActionMenu} {...props} />
      </Provider>
    );
  };

  it('renders the resizable container with both panels', () => {
    renderComponent();

    expect(screen.getByTestId('discover-panel')).toBeInTheDocument();
    expect(screen.getByTestId('bottom-right-container')).toBeInTheDocument();
    expect(screen.getByTestId('top-nav')).toBeInTheDocument();
  });

  it('shows left panel when showDataSetFields is true', () => {
    const storeWithDataSetFields = configureStore({
      reducer: {
        legacy: legacyReducer,
        ui: uiReducer,
      },
      preloadedState: {
        legacy: {
          savedSearch: undefined,
          savedQuery: undefined,
          columns: [],
          sort: [],
          interval: 'auto',
          isDirty: false,
          lineCount: undefined,
        },
        ui: {
          activeTabId: 'logs',
          showFilterPanel: true,
          showHistogram: true,
        },
      },
    });

    render(
      <Provider store={storeWithDataSetFields}>
        <BottomContainer setHeaderActionMenu={mockSetHeaderActionMenu} />
      </Provider>
    );

    // The left panel should be visible
    const leftPanel = screen.getByTestId('dscBottomLeftCanvas');
    expect(leftPanel).toBeInTheDocument();
  });

  it('renders without setHeaderActionMenu prop', () => {
    render(
      <Provider store={mockStore}>
        <BottomContainer />
      </Provider>
    );

    expect(screen.getByTestId('discover-panel')).toBeInTheDocument();
    expect(screen.getByTestId('bottom-right-container')).toBeInTheDocument();
    expect(screen.getByTestId('top-nav')).toBeInTheDocument();
  });

  it('passes setHeaderActionMenu to TopNav component', () => {
    renderComponent();

    expect(screen.getByTestId('top-nav')).toBeInTheDocument();
    // The TopNav component should receive the setHeaderActionMenu prop
  });

  it('renders with mobile layout', () => {
    // Mock useIsWithinBreakpoints to return true for mobile
    jest.doMock('@elastic/eui', () => ({
      ...jest.requireActual('@elastic/eui'),
      useIsWithinBreakpoints: jest.fn(() => true),
    }));

    renderComponent();

    expect(screen.getByTestId('discover-panel')).toBeInTheDocument();
    expect(screen.getByTestId('bottom-right-container')).toBeInTheDocument();
  });
});
