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

// Mock EUI hooks
jest.mock('@elastic/eui', () => ({
  ...jest.requireActual('@elastic/eui'),
  useIsWithinBreakpoints: jest.fn(() => false),
}));

import { useIsWithinBreakpoints } from '@elastic/eui';

const mockUseIsWithinBreakpoints = useIsWithinBreakpoints as jest.MockedFunction<
  typeof useIsWithinBreakpoints
>;

describe('BottomContainer', () => {
  const createMockStore = (showFilterPanel = false) =>
    configureStore({
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
          showFilterPanel,
          showHistogram: true,
        },
      },
    });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIsWithinBreakpoints.mockReturnValue(false);
  });

  const renderComponent = (showFilterPanel = false) => {
    const store = createMockStore(showFilterPanel);
    return render(
      <Provider store={store}>
        <BottomContainer />
      </Provider>
    );
  };

  it('renders the resizable container with both panels', () => {
    renderComponent();

    expect(screen.getByTestId('discover-panel')).toBeInTheDocument();
    expect(screen.getByTestId('bottom-right-container')).toBeInTheDocument();
  });

  it('shows left panel when showFilterPanel is true', () => {
    renderComponent(true);

    // The left panel should be visible
    const leftPanel = screen.getByTestId('dscBottomLeftCanvas');
    expect(leftPanel).toBeInTheDocument();
    expect(leftPanel.closest('.euiResizablePanel')).toHaveStyle('display: block');
  });

  it('hides left panel when showFilterPanel is false', () => {
    renderComponent(false);

    const leftPanel = screen.getByTestId('dscBottomLeftCanvas');
    expect(leftPanel).toBeInTheDocument();
    // The parent EuiResizablePanel should have display: none
    expect(leftPanel.closest('.euiResizablePanel')).toHaveStyle('display: none');
  });

  it('renders with correct resizable panel sizes', () => {
    renderComponent(true);

    const container = document.querySelector('.explore-layout__bottom-panel');
    expect(container).toBeInTheDocument();
  });

  it('renders with mobile layout', () => {
    mockUseIsWithinBreakpoints.mockReturnValue(true);

    renderComponent();

    expect(screen.getByTestId('discover-panel')).toBeInTheDocument();
    expect(screen.getByTestId('bottom-right-container')).toBeInTheDocument();
  });
});
