/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useRef, useState } from 'react';
import { monaco } from '@osd/monaco';
import { CodeEditor } from '../../../../../../opensearch_dashboards_react/public';
import { getEditorConfig, LanguageType } from './shared';
import { EuiIcon } from '@elastic/eui';
import { EditOrClear } from './edit_or_clear';

interface PromptEditorProps {
  languageType: LanguageType;
  prompt: string;
  onChange: (value: string) => void;
  handlePromptRun: (queryString?: string) => void;
  isPromptReadOnly: boolean;
  handlePromptEdit: () => void;
  handleClearEditor: () => void;
}

const PromptEditor: React.FC<PromptEditorProps> = ({
  languageType,
  onChange,
  handlePromptRun,
  prompt,
  isPromptReadOnly,
  handlePromptEdit,
  handleClearEditor,
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const editorConfig = getEditorConfig(languageType);
  const [editorIsFocused, setEditorIsFocused] = useState(false);
  const blurTimeoutRef = useRef<NodeJS.Timeout | undefined>();

  const handleEditClick = () => {
    handlePromptEdit();
    editorRef.current?.updateOptions({ readOnly: false });
    editorRef.current?.focus();
  };

  const handleEditorDidMount = useCallback(
    (editor: monaco.editor.IStandaloneCodeEditor) => {
      editorRef.current = editor;

      editor.onDidFocusEditorText(() => {
        setEditorIsFocused(true);
      });

      editor.onDidBlurEditorText(() => {
        setEditorIsFocused(false);
      });
      // Set up Enter key handling
      editor.addAction({
        id: 'run-prompt-on-enter',
        label: 'Run Prompt on Enter',
        keybindings: [monaco.KeyCode.Enter],
        contextMenuGroupId: 'navigation',
        contextMenuOrder: 1.5,
        run: () => {
          const promptValue = editor.getValue();
          handlePromptRun(promptValue);
          handlePromptEdit();
        },
      });

      editor.addAction({
        id: 'insert-new-line-prompt',
        label: 'Insert New Line Prompt',
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

      editor.onDidContentSizeChange(() => {
        const contentHeight = editor.getContentHeight();
        editor.layout({ width: editor.getLayoutInfo().width, height: contentHeight });
      });

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

      return () => {
        focusDisposable.dispose();
        blurDisposable.dispose();
        if (blurTimeoutRef.current) {
          clearTimeout(blurTimeoutRef.current);
        }
      };
    },
    [handlePromptRun, prompt]
  );

  return (
    <div className="promptEditorWrapper" style={{ position: 'relative' }}>
      <div
        className={`promptEditor ${isPromptReadOnly ? 'promptEditor--readonly' : ''}`}
        style={editorIsFocused && !isPromptReadOnly ? { borderBottom: '1px solid #006BB4' } : {}}
        data-test-subj="osdQueryEditor__multiLine"
      >
        <CodeEditor
          languageId={editorConfig.languageId}
          value={prompt}
          onChange={onChange}
          editorDidMount={handleEditorDidMount}
          options={{
            fixedOverflowWidgets: true,
            lineNumbers: 'off', // Disabled line numbers
            lineHeight: 18,
            fontSize: 14,
            fontFamily: 'Roboto Mono',
            minimap: {
              enabled: false,
            },
            padding: {
              top: 7,
              bottom: 7,
            },
            scrollBeyondLastLine: false,
            wordWrap: 'on', // Disabled word wrapping
            wrappingIndent: 'indent', // No indent since wrapping is off
            folding: false,
            glyphMargin: false,
            lineDecorationsWidth: 0,
            scrollbar: {
              vertical: 'hidden',
              horizontalScrollbarSize: 1,
            },
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            cursorStyle: 'line-thin',
            cursorBlinking: 'blink',
            ...editorConfig, // Spread the dynamic configuration
          }}
        />

        {!prompt && !editorIsFocused && !isPromptReadOnly && (
          <div
            className="monacoPlaceholder"
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              color: '#676E75',
              fontSize: 14,
              fontWeight: 400,
              fontFamily: 'Roboto Mono',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            Ask a question or search using
            <EuiIcon type="editorCodeBlock" /> PPL
          </div>
        )}

        {isPromptReadOnly && (
          <EditOrClear
            className="promptEditor__editOverlay"
            handleClearEditor={handleClearEditor}
            handleEditClick={handleEditClick}
            editText="Edit Prompt"
            clearText="Clear Editor"
          />
        )}
      </div>
    </div>
  );
};

export { PromptEditor };
