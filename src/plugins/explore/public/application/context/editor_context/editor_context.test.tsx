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
      <div data-test-subj="editor-text">{context.editorText}</div>
      <div data-test-subj="editor-focused">{context.editorIsFocused.toString()}</div>
      <button
        data-test-subj="set-editor-text"
        onClick={() => context.setEditorText('new editor text')}
      >
        Set Editor Text
      </button>
      <button data-test-subj="set-editor-focused" onClick={() => context.setEditorIsFocused(true)}>
        Set Editor Focused
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
      expect(screen.getByTestId('editor-text')).toHaveTextContent('initial query');
      expect(screen.getByTestId('editor-focused')).toHaveTextContent('false');
    });

    it('should initialize with query string from selector', () => {
      renderWithProvider(<TestComponent />, 'test query');
      expect(screen.getByTestId('editor-text')).toHaveTextContent('test query');
      expect(screen.getByTestId('editor-focused')).toHaveTextContent('false');
    });

    it('should allow updating editor text', () => {
      renderWithProvider(<TestComponent />);

      fireEvent.click(screen.getByTestId('set-editor-text'));

      expect(screen.getByTestId('editor-text')).toHaveTextContent('new editor text');
    });

    it('should allow updating editor focus state', () => {
      renderWithProvider(<TestComponent />);

      fireEvent.click(screen.getByTestId('set-editor-focused'));

      expect(screen.getByTestId('editor-focused')).toHaveTextContent('true');
    });

    it('should provide editor ref', () => {
      const TestRefComponent: React.FC = () => {
        const { editorRef } = useContext(EditorContext);
        return <div data-test-subj="editor-ref-exists">{editorRef ? 'true' : 'false'}</div>;
      };

      renderWithProvider(<TestRefComponent />);
      expect(screen.getByTestId('editor-ref-exists')).toHaveTextContent('true');
    });
  });
});
