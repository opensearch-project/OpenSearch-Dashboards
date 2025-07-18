/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { RunQueryButton } from './run_query_button';

jest.mock('../../../../application/utils/state_management/actions/query_editor', () => ({
  onEditorRunActionCreator: jest.fn(),
}));

jest.mock('../../../../application/utils/state_management/selectors', () => ({
  selectIsLoading: jest.fn(),
}));

jest.mock('../../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn(),
}));

jest.mock('../../../../application/hooks', () => ({
  useEditorText: jest.fn(),
}));

import { onEditorRunActionCreator } from '../../../../application/utils/state_management/actions/query_editor';
import { selectIsLoading } from '../../../../application/utils/state_management/selectors';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { useEditorText } from '../../../../application/hooks';

const mockDispatch = jest.fn();
const mockOnEditorRunActionCreator = onEditorRunActionCreator as jest.MockedFunction<
  typeof onEditorRunActionCreator
>;
const mockSelectIsLoading = selectIsLoading as jest.MockedFunction<typeof selectIsLoading>;
const mockUseOpenSearchDashboards = useOpenSearchDashboards as jest.MockedFunction<
  typeof useOpenSearchDashboards
>;
const mockUseEditorText = useEditorText as jest.MockedFunction<typeof useEditorText>;

// Mock redux hooks
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
  useSelector: (selector: any) => selector(),
}));

describe('RunQueryButton', () => {
  const mockServices = {
    data: {
      query: {
        queryString: {
          getQuery: jest.fn(),
        },
      },
    },
    core: {
      http: {
        post: jest.fn(),
      },
    },
  };

  const createMockStore = () => {
    return configureStore({
      reducer: {
        root: (state = {}) => state,
      },
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseOpenSearchDashboards.mockReturnValue({ services: mockServices } as any);
    mockUseEditorText.mockReturnValue('SELECT * FROM logs');
    mockSelectIsLoading.mockReturnValue(false);
    mockOnEditorRunActionCreator.mockReturnValue({ type: 'MOCK_ACTION' } as any);
  });

  const renderWithProvider = (component: React.ReactElement) => {
    const store = createMockStore();
    return render(<Provider store={store}>{component}</Provider>);
  };

  it('renders the run query button with correct text', () => {
    renderWithProvider(<RunQueryButton />);

    const button = screen.getByRole('button', { name: /run query/i });
    expect(button).toBeInTheDocument();
  });

  it('dispatches onEditorRunActionCreator when clicked', () => {
    renderWithProvider(<RunQueryButton />);

    const button = screen.getByRole('button', { name: /run query/i });
    fireEvent.click(button);

    expect(mockOnEditorRunActionCreator).toHaveBeenCalledWith(mockServices, 'SELECT * FROM logs');
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'MOCK_ACTION' });
  });

  it('calls onEditorRunActionCreator with correct parameters', () => {
    const customEditorText = 'SELECT COUNT(*) FROM users';
    mockUseEditorText.mockReturnValue(customEditorText);

    renderWithProvider(<RunQueryButton />);

    const button = screen.getByRole('button', { name: /run query/i });
    fireEvent.click(button);

    expect(mockOnEditorRunActionCreator).toHaveBeenCalledWith(mockServices, customEditorText);
  });

  it('uses current editor text when button is clicked', () => {
    const editorText = 'SHOW TABLES';
    mockUseEditorText.mockReturnValue(editorText);

    renderWithProvider(<RunQueryButton />);

    const button = screen.getByRole('button', { name: /run query/i });
    fireEvent.click(button);

    expect(mockOnEditorRunActionCreator).toHaveBeenCalledWith(mockServices, editorText);
  });

  it('shows loading state when isLoading is true', () => {
    mockSelectIsLoading.mockReturnValue(true);

    renderWithProvider(<RunQueryButton />);

    const loadingSpinner = document.querySelector('.euiLoadingSpinner');
    expect(loadingSpinner).toBeInTheDocument();
  });

  it('does not show loading state when isLoading is false', () => {
    mockSelectIsLoading.mockReturnValue(false);

    renderWithProvider(<RunQueryButton />);

    const loadingSpinner = document.querySelector('.euiLoadingSpinner');
    expect(loadingSpinner).not.toBeInTheDocument();
  });
});
