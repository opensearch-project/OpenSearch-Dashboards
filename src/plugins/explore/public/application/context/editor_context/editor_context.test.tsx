/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import {
  EditorContextProvider,
  useEditorContext,
  useEditorContextByEditorComponent,
} from './editor_context';
import { EditorMode } from '../../utils/state_management/types';

// Mock the selectors
jest.mock('../../utils/state_management/selectors', () => ({
  selectEditorMode: jest.fn(),
  selectQueryString: jest.fn(),
}));

import { selectEditorMode, selectQueryString } from '../../utils/state_management/selectors';

const mockSelectEditorMode = selectEditorMode as jest.MockedFunction<typeof selectEditorMode>;
const mockSelectQueryString = selectQueryString as jest.MockedFunction<typeof selectQueryString>;

// Create a test component that uses the hook
const TestComponent: React.FC<{ testHook?: 'editor' | 'internal' }> = ({ testHook = 'editor' }) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const editorContext = testHook === 'editor' ? useEditorContext() : null;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const internalContext = testHook === 'internal' ? useEditorContextByEditorComponent() : null;
  const context = editorContext || internalContext;

  if (!context) return <div>No context</div>;

  if (testHook === 'internal') {
    const internalCtx = context as ReturnType<typeof useEditorContextByEditorComponent>;
    return (
      <div>
        <div data-test-subj="top-editor-text">{internalCtx.topEditorText}</div>
        <div data-test-subj="bottom-editor-text">{internalCtx.bottomEditorText}</div>
        <button
          data-test-subj="set-top-text"
          onClick={() => internalCtx.setTopEditorText('new top text')}
        >
          Set Top Text
        </button>
        <button
          data-test-subj="set-bottom-text"
          onClick={() => internalCtx.setBottomEditorText('new bottom text')}
        >
          Set Bottom Text
        </button>
      </div>
    );
  }

  const editorCtx = context as ReturnType<typeof useEditorContext>;
  return (
    <div>
      <div data-test-subj="editor-text">{editorCtx.editorText}</div>
      <div data-test-subj="query">{editorCtx.query}</div>
      <div data-test-subj="prompt">{editorCtx.prompt}</div>
      <button
        data-test-subj="set-editor-text"
        onClick={() => editorCtx.setEditorText('new editor text')}
      >
        Set Editor Text
      </button>
      <button data-test-subj="clear-editors" onClick={() => editorCtx.clearEditors()}>
        Clear Editors
      </button>
      <button
        data-test-subj="clear-and-set-text"
        onClick={() => editorCtx.clearEditorsAndSetText('cleared and set')}
      >
        Clear and Set Text
      </button>
      <button
        data-test-subj="set-bottom-text"
        onClick={() => editorCtx.setBottomEditorText('bottom text')}
      >
        Set Bottom Text
      </button>
    </div>
  );
};

// Create a mock store
const createMockStore = (editorMode = EditorMode.SingleQuery, queryString = 'initial query') => {
  mockSelectEditorMode.mockReturnValue(editorMode);
  mockSelectQueryString.mockReturnValue(queryString);

  return configureStore({
    reducer: {
      explore: () => ({
        query: {
          queryString,
        },
        system: {
          editorMode,
        },
      }),
    },
  });
};

const renderWithProvider = (
  component: React.ReactElement,
  editorMode = EditorMode.SingleQuery,
  queryString = 'initial query'
) => {
  const store = createMockStore(editorMode, queryString);
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
    });

    it('should initialize with query string from selector', () => {
      renderWithProvider(<TestComponent />, EditorMode.SingleQuery, 'test query');
      expect(screen.getByTestId('editor-text')).toHaveTextContent('test query');
    });
  });

  describe('useEditorContext', () => {
    describe('SingleQuery mode', () => {
      it('should return top editor text as editor text', () => {
        renderWithProvider(<TestComponent />, EditorMode.SingleQuery);
        expect(screen.getByTestId('editor-text')).toHaveTextContent('initial query');
      });

      it('should return top editor text as query', () => {
        renderWithProvider(<TestComponent />, EditorMode.SingleQuery);
        expect(screen.getByTestId('query')).toHaveTextContent('initial query');
      });

      it('should return empty string as prompt', () => {
        renderWithProvider(<TestComponent />, EditorMode.SingleQuery);
        expect(screen.getByTestId('prompt')).toHaveTextContent('');
      });

      it('should set top editor text when setEditorText is called', () => {
        renderWithProvider(<TestComponent />, EditorMode.SingleQuery);

        act(() => {
          screen.getByTestId('set-editor-text').click();
        });

        expect(screen.getByTestId('editor-text')).toHaveTextContent('new editor text');
      });
    });

    describe('DualQuery mode', () => {
      it('should return bottom editor text as editor text', () => {
        renderWithProvider(<TestComponent />, EditorMode.DualQuery);

        // First set some bottom text
        act(() => {
          screen.getByTestId('set-bottom-text').click();
        });

        expect(screen.getByTestId('editor-text')).toHaveTextContent('bottom text');
      });

      it('should return bottom editor text as query', () => {
        renderWithProvider(<TestComponent />, EditorMode.DualQuery);

        act(() => {
          screen.getByTestId('set-bottom-text').click();
        });

        expect(screen.getByTestId('query')).toHaveTextContent('bottom text');
      });

      it('should return top editor text as prompt', () => {
        renderWithProvider(<TestComponent />, EditorMode.DualQuery);
        expect(screen.getByTestId('prompt')).toHaveTextContent('initial query');
      });

      it('should set bottom editor text when setEditorText is called', () => {
        renderWithProvider(<TestComponent />, EditorMode.DualQuery);

        act(() => {
          screen.getByTestId('set-editor-text').click();
        });

        expect(screen.getByTestId('editor-text')).toHaveTextContent('new editor text');
      });
    });

    describe('DualPrompt mode', () => {
      it('should return top editor text as editor text', () => {
        renderWithProvider(<TestComponent />, EditorMode.DualPrompt);
        expect(screen.getByTestId('editor-text')).toHaveTextContent('initial query');
      });

      it('should return empty bottom text as query', () => {
        renderWithProvider(<TestComponent />, EditorMode.DualPrompt);
        expect(screen.getByTestId('query')).toHaveTextContent('');
      });

      it('should return top editor text as prompt', () => {
        renderWithProvider(<TestComponent />, EditorMode.DualPrompt);
        expect(screen.getByTestId('prompt')).toHaveTextContent('initial query');
      });
    });

    describe('clearEditors', () => {
      it('should clear both editors', () => {
        renderWithProvider(<TestComponent />);

        act(() => {
          screen.getByTestId('clear-editors').click();
        });

        expect(screen.getByTestId('editor-text')).toHaveTextContent('');
      });
    });

    describe('clearEditorsAndSetText', () => {
      it('should clear bottom editor and set top editor text', () => {
        renderWithProvider(<TestComponent />);

        // First set some bottom text
        act(() => {
          screen.getByTestId('set-bottom-text').click();
        });

        act(() => {
          screen.getByTestId('clear-and-set-text').click();
        });

        expect(screen.getByTestId('editor-text')).toHaveTextContent('cleared and set');
      });
    });

    describe('setBottomEditorText', () => {
      it('should set bottom editor text', () => {
        renderWithProvider(<TestComponent />, EditorMode.DualQuery);

        act(() => {
          screen.getByTestId('set-bottom-text').click();
        });

        expect(screen.getByTestId('editor-text')).toHaveTextContent('bottom text');
      });
    });
  });

  describe('useEditorContextByEditorComponent', () => {
    it('should return internal context value', () => {
      renderWithProvider(<TestComponent testHook="internal" />);
      expect(screen.getByTestId('top-editor-text')).toHaveTextContent('initial query');
      expect(screen.getByTestId('bottom-editor-text')).toHaveTextContent('');
    });

    it('should allow setting top editor text', () => {
      renderWithProvider(<TestComponent testHook="internal" />);

      act(() => {
        screen.getByTestId('set-top-text').click();
      });

      expect(screen.getByTestId('top-editor-text')).toHaveTextContent('new top text');
    });

    it('should allow setting bottom editor text', () => {
      renderWithProvider(<TestComponent testHook="internal" />);

      act(() => {
        screen.getByTestId('set-bottom-text').click();
      });

      expect(screen.getByTestId('bottom-editor-text')).toHaveTextContent('new bottom text');
    });
  });

  describe('memoization', () => {
    it('should memoize context value based on editor texts', () => {
      const { rerender } = renderWithProvider(<TestComponent />);
      const initialEditorText = screen.getByTestId('editor-text').textContent;

      // Rerender with same props
      rerender(
        <Provider store={createMockStore()}>
          <EditorContextProvider>
            <TestComponent />
          </EditorContextProvider>
        </Provider>
      );

      expect(screen.getByTestId('editor-text')).toHaveTextContent(initialEditorText || '');
    });

    it('should update when editor mode changes', () => {
      const { rerender } = renderWithProvider(<TestComponent />, EditorMode.SingleQuery);
      expect(screen.getByTestId('prompt')).toHaveTextContent('');

      // Change to DualPrompt mode
      mockSelectEditorMode.mockReturnValue(EditorMode.DualPrompt);
      rerender(
        <Provider store={createMockStore(EditorMode.DualPrompt)}>
          <EditorContextProvider>
            <TestComponent />
          </EditorContextProvider>
        </Provider>
      );

      expect(screen.getByTestId('prompt')).toHaveTextContent('initial query');
    });
  });
});
