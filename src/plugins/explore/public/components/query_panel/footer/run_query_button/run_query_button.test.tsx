/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { RunQueryButton } from './run_query_button';

// Mock all the deep imports to avoid i18n initialization issues
jest.mock('../../../../application/utils/state_management/actions/query_editor', () => ({
  onEditorRunActionCreator: jest.fn(),
}));

jest.mock('../../../../application/utils/state_management/selectors', () => ({
  selectIsLoading: jest.fn(),
}));

jest.mock('../../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn(),
}));

jest.mock('../../../../application/context', () => ({
  useEditorContext: jest.fn(),
}));

// Mock i18n to avoid SearchBar initialization issues
jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: jest.fn((id, options) => options?.defaultMessage || id),
  },
}));

import { onEditorRunActionCreator } from '../../../../application/utils/state_management/actions/query_editor';
import { selectIsLoading } from '../../../../application/utils/state_management/selectors';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { useEditorContext } from '../../../../application/context';

const mockDispatch = jest.fn();
const mockOnEditorRunActionCreator = onEditorRunActionCreator as jest.MockedFunction<
  typeof onEditorRunActionCreator
>;
const mockSelectIsLoading = selectIsLoading as jest.MockedFunction<typeof selectIsLoading>;
const mockUseOpenSearchDashboards = useOpenSearchDashboards as jest.MockedFunction<
  typeof useOpenSearchDashboards
>;
const mockUseEditorContext = useEditorContext as jest.MockedFunction<typeof useEditorContext>;

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

  const mockEditorContext = {
    editorText: 'SELECT * FROM logs',
    dataset: undefined,
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
    mockUseEditorContext.mockReturnValue(mockEditorContext as any);
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

  it('is enabled when editor text is not empty', () => {
    renderWithProvider(<RunQueryButton />);

    const button = screen.getByRole('button', { name: /run query/i });
    expect(button).not.toBeDisabled();
  });

  it('is disabled when editor text is empty', () => {
    mockUseEditorContext.mockReturnValue({
      ...mockEditorContext,
      editorText: '',
    } as any);

    renderWithProvider(<RunQueryButton />);

    const button = screen.getByRole('button', { name: /run query/i });
    expect(button).toBeDisabled();
  });

  it('is disabled when editor text contains only whitespace', () => {
    mockUseEditorContext.mockReturnValue({
      ...mockEditorContext,
      editorText: '   \n\t  ',
    } as any);

    renderWithProvider(<RunQueryButton />);

    const button = screen.getByRole('button', { name: /run query/i });
    expect(button).toBeDisabled();
  });

  it('dispatches onEditorRunActionCreator when clicked', () => {
    renderWithProvider(<RunQueryButton />);

    const button = screen.getByRole('button', { name: /run query/i });
    fireEvent.click(button);

    expect(mockOnEditorRunActionCreator).toHaveBeenCalledWith(mockServices, mockEditorContext);
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'MOCK_ACTION' });
  });

  it('does not dispatch action when button is disabled', () => {
    mockUseEditorContext.mockReturnValue({
      ...mockEditorContext,
      editorText: '',
    } as any);

    renderWithProvider(<RunQueryButton />);

    const button = screen.getByRole('button', { name: /run query/i });
    fireEvent.click(button);

    expect(mockOnEditorRunActionCreator).not.toHaveBeenCalled();
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('calls onEditorRunActionCreator with correct parameters', () => {
    const customEditorContext = {
      editorText: 'SELECT COUNT(*) FROM users',
      dataset: { id: 'test-dataset' },
    };

    mockUseEditorContext.mockReturnValue(customEditorContext as any);

    renderWithProvider(<RunQueryButton />);

    const button = screen.getByRole('button', { name: /run query/i });
    fireEvent.click(button);

    expect(mockOnEditorRunActionCreator).toHaveBeenCalledWith(mockServices, customEditorContext);
  });
});
