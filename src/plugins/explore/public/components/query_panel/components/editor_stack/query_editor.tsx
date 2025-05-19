/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useCallback, useState, useEffect } from 'react';
import { monaco } from '@osd/monaco';
import { CodeEditor } from '../../../../../../opensearch_dashboards_react/public';
import { LanguageType } from './shared';
import { EuiIcon, EuiFlexGroup, EuiFlexItem, EuiHorizontalRule } from '@elastic/eui';

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
    [decorated, handleQueryRun, queryString]
  );

  return (
    <div
      className="queryEditor"
      data-test-subj="osdQueryEditor__multiLine"
      style={editorIsFocused ? { borderBottom: '1px solid #006BB4' } : {}}
    >
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
          <div className="queryEditor__editOverlay">
            <EuiFlexGroup
              direction="row"
              gutterSize="s"
              justifyContent="spaceAround"
              className="edit_toolbar"
            >
              <EuiFlexItem grow={false}>
                <span onClick={handleEditClick}>
                  <EuiIcon type="pencil" style={{ marginRight: '2px' }} />{' '}
                  <span style={{ textDecorationLine: 'underline' }}> Edit query </span>
                </span>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiHorizontalRule
                  margin="xs"
                  className="vertical-separator"
                  style={{ margin: '0px' }}
                />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <span onClick={handleClearEditor}>
                  <EuiIcon type="crossInCircleEmpty" style={{ marginRight: '3px' }} />
                  <span style={{ textDecorationLine: 'underline' }}> Clear editor</span>
                </span>
              </EuiFlexItem>
            </EuiFlexGroup>
          </div>
        )}
      </div>
    </div>
  );
};
