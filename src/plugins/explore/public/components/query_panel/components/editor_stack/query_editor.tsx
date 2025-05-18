/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useState, useEffect } from 'react';
import { monaco } from '@osd/monaco';
import { CodeEditor } from '../../../../../../opensearch_dashboards_react/public';
import { LanguageType } from './shared';

interface QueryEditorProps {
  languageType: LanguageType;
  queryString: string;
  onChange: (value: string) => void;
  handleQueryRun: (queryString?: string) => void;
}

const FIXED_COMMENT = '// This is a fixed comment';

export const QueryEditor: React.FC<QueryEditorProps> = ({
  queryString,
  languageType,
  onChange,
  handleQueryRun,
}) => {
  const [editorIsFocused, setEditorIsFocused] = useState(false);
  const [decorated, setDecorated] = useState(false);

  // 🧠 Inject comment only once when content is loaded
  useEffect(() => {
    if (!queryString.startsWith(FIXED_COMMENT)) {
      onChange(`${FIXED_COMMENT}\n${queryString}`);
    }
  }, [queryString, onChange]);

  const handleEditorDidMount = useCallback(
    (editor: monaco.editor.IStandaloneCodeEditor) => {
      editor.onDidFocusEditorText(() => {
        setEditorIsFocused(true);
      });

      editor.onDidBlurEditorText(() => {
        setEditorIsFocused(false);
      });

      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
        handleQueryRun(editor.getValue());
      });

      // Add command for Shift + Enter to insert a new line
      editor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => {
        if (editor.hasTextFocus()) {
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
        }
      });

      // ✅ Add fixed comment if not already present
      const fixedComment = '// This is a fixed comment';
      if (!queryString.startsWith(fixedComment)) {
        const updated = `${fixedComment}\n${queryString}`;
        onChange(updated);
      }

      // ✅ Decorate comment line after mount (only once)
      if (!decorated) {
        editor.createDecorationsCollection([
          {
            range: new monaco.Range(1, 1, 1, 1),
            options: {
              isWholeLine: true,
              className: 'comment-line',
            },
          },
        ]);
        setDecorated(true);
      }
    },
    [decorated, handleQueryRun, prompt]
  );

  return (
    <div
      className="queryEditor"
      data-test-subj="osdQueryEditor__multiLine"
      style={editorIsFocused ? { borderBottom: '1px solid #006BB4' } : {}}
    >
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
