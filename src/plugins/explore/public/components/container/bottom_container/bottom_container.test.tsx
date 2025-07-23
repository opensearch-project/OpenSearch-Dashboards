/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { BottomContainer } from './bottom_container';

// Mock the components
jest.mock('../../fields_selector/fields_selector_panel', () => ({
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
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIsWithinBreakpoints.mockReturnValue(false);
  });

  const renderComponent = () => {
    return render(<BottomContainer />);
  };

  it('renders the resizable container with both panels', () => {
    renderComponent();

    expect(screen.getByTestId('discover-panel')).toBeInTheDocument();
    expect(screen.getByTestId('bottom-right-container')).toBeInTheDocument();
  });

  it('renders left panel', () => {
    renderComponent();

    const leftPanel = screen.getByTestId('dscBottomLeftCanvas');
    expect(leftPanel).toBeInTheDocument();
  });

  it('renders with correct resizable container', () => {
    renderComponent();

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
