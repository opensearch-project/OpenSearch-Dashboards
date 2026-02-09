/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useContext } from 'react';
import { render, screen } from '@testing-library/react';
import { EditorContextProvider, EditorContext } from './editor_context';

// Create a test component that uses the context
const TestComponent: React.FC = () => {
  const editorRef = useContext(EditorContext);

  return (
    <div>
      <div data-test-subj="editor-ref-exists">{editorRef ? 'true' : 'false'}</div>
      <div data-test-subj="editor-ref-current">
        {editorRef.current ? 'has-editor' : 'no-editor'}
      </div>
    </div>
  );
};

const renderWithProvider = (component: React.ReactElement) => {
  // @ts-expect-error TS2559 TODO(ts-error): fixme
  return render(<EditorContextProvider>{component}</EditorContextProvider>);
};

describe('EditorContext', () => {
  describe('EditorContextProvider', () => {
    it('should provide editor ref to children', () => {
      renderWithProvider(<TestComponent />);
      expect(screen.getByTestId('editor-ref-exists')).toHaveTextContent('true');
      expect(screen.getByTestId('editor-ref-current')).toHaveTextContent('no-editor');
    });

    it('should provide a mutable ref object', () => {
      const TestRefComponent: React.FC = () => {
        const editorRef = useContext(EditorContext);

        // Test that we can modify the ref
        const handleClick = () => {
          editorRef.current = {} as any;
        };

        return (
          <div>
            <div data-test-subj="editor-ref-type">{typeof editorRef}</div>
            <div data-test-subj="has-current-prop">{'current' in editorRef ? 'true' : 'false'}</div>
            <button data-test-subj="modify-ref" onClick={handleClick}>
              Modify Ref
            </button>
          </div>
        );
      };

      renderWithProvider(<TestRefComponent />);
      expect(screen.getByTestId('editor-ref-type')).toHaveTextContent('object');
      expect(screen.getByTestId('has-current-prop')).toHaveTextContent('true');
    });
  });
});
