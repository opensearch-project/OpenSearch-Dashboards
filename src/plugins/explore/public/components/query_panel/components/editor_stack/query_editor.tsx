/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useRef } from 'react';
import { monaco } from '@osd/monaco';
import { CodeEditor } from '../../../../../../opensearch_dashboards_react/public';
import { LanguageType } from './shared';

interface PromptEditorProps {
  languageType: LanguageType;
  queryString: string;
  onChange: (value: string) => void;
  handleQueryRun: (queryString?: string) => void;
  // editorDidMount: (editor: any) => void;
}

export const QueryEditor: React.FC<PromptEditorProps> = ({
  queryString,
  languageType,
  onChange,
  handleQueryRun,
}) => {
  // const editorConfig = getEditorConfig(languageType);

  const blurTimeoutRef = useRef<NodeJS.Timeout | undefined>();
  const handleEditorDidMount = useCallback((editor: monaco.editor.IStandaloneCodeEditor) => {
    const focusDisposable = editor.onDidFocusEditorText(() => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    });

    const blurDisposable = editor.onDidBlurEditorText(() => {
      blurTimeoutRef.current = setTimeout(() => {}, 500);
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleQueryRun(editor.getValue());
    });

    // Add command for Shift + Enter to insert a new line
    editor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => {
      const currentPosition = editor.getPosition();
      if (currentPosition) {
        editor.executeEdits('', [
          {
            range: new monaco.Range(
              currentPosition.lineNumber,
              currentPosition.column,
              currentPosition.lineNumber,
              currentPosition.column
            ),
            text: '\n',
            forceMoveMarkers: true,
          },
        ]);
        editor.setPosition({
          lineNumber: currentPosition.lineNumber + 1,
          column: 1,
        });
      }
    });

    return () => {
      focusDisposable.dispose();
      blurDisposable.dispose();
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="queryEditor" data-test-subj="osdQueryEditor__multiLine">
      <CodeEditor
        height={100}
        languageId={languageType}
        value={queryString}
        onChange={onChange}
        editorDidMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 12,
          lineHeight: 20,
          fontFamily: 'var(--font-code)',
          lineNumbers: 'on',
          folding: true,
          wordWrap: 'on',
          wrappingIndent: 'same',
          lineDecorationsWidth: 0,
          lineNumbersMinChars: 1,
          // Configure suggestion behavior
          suggest: {
            snippetsPreventQuickSuggestions: false, // Ensure all suggestions are shown
            filterGraceful: false, // Don't filter suggestions
            showStatusBar: true, // Enable the built-in status bar with default text
            showWords: false, // Disable word-based suggestions
          },
          acceptSuggestionOnEnter: 'off',
        }}
        // suggestionProvider={{
        //   triggerCharacters: [' '],
        //   provideCompletionItems: async (model, position, context, token) => {
        //     return provideCompletionItems(model, position, context, token);
        //   },
        // }}
        languageConfiguration={{
          autoClosingPairs: [
            { open: '(', close: ')' },
            { open: '[', close: ']' },
            { open: '{', close: '}' },
            { open: '"', close: '"' },
            { open: "'", close: "'" },
          ],
        }}
        triggerSuggestOnFocus={true}
      />
    </div>
  );
};
