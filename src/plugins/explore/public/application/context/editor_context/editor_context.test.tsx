/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useContext } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { EditorContextProvider, EditorContext } from './editor_context';

// Mock the selectors
jest.mock('../../utils/state_management/selectors', () => ({
  selectQueryString: jest.fn(),
}));

import { selectQueryString } from '../../utils/state_management/selectors';

const mockSelectQueryString = selectQueryString as jest.MockedFunction<typeof selectQueryString>;

// Create a test component that uses the context
const TestComponent: React.FC = () => {
  const context = useContext(EditorContext);

  return (
    <div>
      <div data-test-subj="top-editor-text">{context.topEditorText}</div>
      <div data-test-subj="bottom-editor-text">{context.bottomEditorText}</div>
      <button
        data-test-subj="set-top-text"
        onClick={() => context.setTopEditorText('new top text')}
      >
        Set Top Text
      </button>
      <button
        data-test-subj="set-bottom-text"
        onClick={() => context.setBottomEditorText('new bottom text')}
      >
        Set Bottom Text
      </button>
    </div>
  );
};

// Create a mock store
const createMockStore = (queryString = 'initial query') => {
  mockSelectQueryString.mockReturnValue(queryString);

  return configureStore({
    reducer: {
      explore: () => ({
        query: {
          queryString,
        },
      }),
    },
  });
};

const renderWithProvider = (component: React.ReactElement, queryString = 'initial query') => {
  const store = createMockStore(queryString);
  return render(
    <Provider store={store}>
      <EditorContextProvider>{component}</EditorContextProvider>
    </Provider>
  );
};

describe('EditorContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('EditorContextProvider', () => {
    it('should provide context to children', () => {
      renderWithProvider(<TestComponent />);
      expect(screen.getByTestId('top-editor-text')).toHaveTextContent('initial query');
      expect(screen.getByTestId('bottom-editor-text')).toHaveTextContent('');
    });

    it('should initialize with query string from selector', () => {
      renderWithProvider(<TestComponent />, 'test query');
      expect(screen.getByTestId('top-editor-text')).toHaveTextContent('test query');
      expect(screen.getByTestId('bottom-editor-text')).toHaveTextContent('');
    });

    it('should allow updating top editor text', () => {
      renderWithProvider(<TestComponent />);

      fireEvent.click(screen.getByTestId('set-top-text'));

      expect(screen.getByTestId('top-editor-text')).toHaveTextContent('new top text');
    });

    it('should allow updating bottom editor text', () => {
      renderWithProvider(<TestComponent />);

      fireEvent.click(screen.getByTestId('set-bottom-text'));

      expect(screen.getByTestId('bottom-editor-text')).toHaveTextContent('new bottom text');
    });
  });
});
