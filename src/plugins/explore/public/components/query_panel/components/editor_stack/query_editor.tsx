/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useCallback, useState, useEffect } from 'react';
import { monaco } from '@osd/monaco';
import { CodeEditor } from '../../../../../../opensearch_dashboards_react/public';
import { LanguageType } from './shared';
import { EditOrClear } from './edit_or_clear';

interface QueryEditorProps {
  languageType: LanguageType;
  queryString: string;
  onChange: (value: string) => void;
  handleQueryRun: (queryString?: string) => void;
  isEditorReadOnly: boolean;
  handleQueryEdit: () => void;
  handleClearEditor: () => void;
}

const FIXED_COMMENT = '// AI Generated PPL at 00.03.33pm';

export const QueryEditor: React.FC<QueryEditorProps> = ({
  queryString,
  languageType,
  onChange,
  handleQueryRun,
  isEditorReadOnly,
  handleQueryEdit,
  handleClearEditor,
}) => {
  const [editorIsFocused, setEditorIsFocused] = useState(false);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [decorated, setDecorated] = useState(false);
  const blurTimeoutRef = useRef<NodeJS.Timeout | undefined>();

  // 🧠 Inject comment only once when content is loaded
  useEffect(() => {
    if (queryString && !queryString.startsWith(FIXED_COMMENT)) {
      onChange(`${FIXED_COMMENT}\n${queryString}`);
    }
  }, [queryString, onChange]);

  const handleEditClick = () => {
    handleQueryEdit();
    editorRef.current?.updateOptions({ readOnly: false });
    editorRef.current?.focus();
  };

  const handleEditorDidMount = useCallback(
    (editor: monaco.editor.IStandaloneCodeEditor) => {
      const focusDisposable = editor.onDidFocusEditorText(() => {
        if (blurTimeoutRef.current) {
          clearTimeout(blurTimeoutRef.current);
        }
        setEditorIsFocused(true);
      });

      const blurDisposable = editor.onDidBlurEditorText(() => {
        blurTimeoutRef.current = setTimeout(() => {
          setEditorIsFocused(false);
        }, 300);
      });

      editorRef.current = editor;

      // editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      //   handleQueryRun(editor.getValue());
      // });

      // Set up Enter key handling
      editor.addAction({
        id: 'run-query-on-enter',
        label: 'Run Query on Enter',
        keybindings: [monaco.KeyCode.Enter],
        contextMenuGroupId: 'navigation',
        contextMenuOrder: 1.5,
        run: () => {
          handleQueryRun(editor.getValue());
        },
      });

      editor.addAction({
        id: 'insert-new-line-query',
        label: 'Insert New Line Query',
        keybindings: [monaco.KeyMod.Shift | monaco.KeyCode.Enter],
        run: (ed) => {
          if (ed.hasTextFocus()) {
            const currentPosition = ed.getPosition();
            if (currentPosition) {
              ed.executeEdits('', [
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
              ed.setPosition({
                lineNumber: currentPosition.lineNumber + 1,
                column: 1,
              });
            }
          }
        },
      });

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

      return () => {
        focusDisposable.dispose();
        blurDisposable.dispose();
        if (blurTimeoutRef.current) {
          clearTimeout(blurTimeoutRef.current);
        }
      };
    },
    [decorated, handleQueryRun, queryString]
  );

  return (
    <div className="queryEditorWrapper" data-test-subj="osdQueryEditor__multiLine">
      <div
        className={`queryEditor ${isEditorReadOnly ? 'queryEditor--readonly' : ''}`}
        style={editorIsFocused && !isEditorReadOnly ? { borderBottom: '1px solid #006BB4' } : {}}
        data-test-subj="osdQueryEditor__multiLine"
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

        {isEditorReadOnly && (
          <EditOrClear
            className="queryEditor__editOverlay"
            handleClearEditor={handleClearEditor}
            handleEditClick={handleEditClick}
            editText="Edit Query"
            clearText="Clear Editor"
          />
        )}
      </div>
    </div>
  );
};
