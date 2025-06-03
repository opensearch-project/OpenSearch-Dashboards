/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useCallback } from 'react';
import { monaco } from '@osd/monaco';
import { CodeEditor } from '../../../../../../opensearch_dashboards_react/public';
import { EditToobar } from './edit_toolbar';

interface ReusableEditorProps {
  value: string;
  editText?: string;
  clearText?: string;
  onChange: (value: string) => void;
  onRun: (value?: string) => void;
  onEditorDidMount?: (editor: monaco.editor.IStandaloneCodeEditor) => void;
  onEdit: () => void;
  onClear: () => void;
  isReadOnly: boolean;
  editorConfig: any;
  placeholder?: React.ReactNode;
  editorType?: 'query' | 'prompt';
  height?: number;
}

const placeholderStyles: React.CSSProperties = {
  position: 'absolute',
  top: 10,
  left: 10,
  color: '#676E75',
  fontSize: 14,
  fontWeight: 400,
  fontFamily: 'Roboto Mono',
  pointerEvents: 'none',
  zIndex: 1,
};

export const ReusableEditor: React.FC<ReusableEditorProps> = ({
  value,
  onChange,
  onRun,
  isReadOnly,
  onEdit,
  onClear,
  onEditorDidMount,
  editorConfig,
  placeholder,
  editText = 'Edit',
  clearText = 'Clear',
  height = 32,
  editorType = 'query',
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [editorIsFocused, setEditorIsFocused] = useState(false);
  const blurTimeoutRef = useRef<NodeJS.Timeout | undefined>();
  const [editorHeight, setEditorHeight] = useState(height);

  const handleEditClick = () => {
    onEdit();
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

      editor.addAction({
        id: `run-on-enter-${editorType}`,
        label: `Run on ${editorType} Enter`,
        keybindings: [monaco.KeyCode.Enter],
        contextMenuGroupId: 'navigation',
        contextMenuOrder: 1.5,
        run: () => {
          const val = editor.getValue();
          onRun(val);
          onEdit();
        },
      });

      editor.addAction({
        id: `insert-new-line-${editorType}`,
        label: `Insert New Line on ${editorType}`,
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
        setEditorHeight(contentHeight);
        editor.layout({ width: editor.getLayoutInfo().width, height: contentHeight });
      });

      onEditorDidMount?.(editor);

      return () => {
        focusDisposable.dispose();
        blurDisposable.dispose();
        if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
        return editor;
      };
    },
    [onRun, onEdit, editorType, onEditorDidMount]
  );

  return (
    <div
      className={`${editorType}EditorWrapper`}
      style={{
        position: 'relative',
      }}
    >
      <div
        className={`${editorType}Editor ${isReadOnly ? `${editorType}Editor--readonly` : ''}`}
        style={{
          borderBottom: editorIsFocused && !isReadOnly ? '1px solid #006BB4' : undefined,
        }}
        data-test-subj={`osd${editorType}Editor__multiLine`}
      >
        <CodeEditor
          height={editorHeight}
          languageId={editorConfig.languageId}
          value={value}
          onChange={onChange}
          editorDidMount={handleEditorDidMount}
          options={editorConfig.options}
          languageConfiguration={editorConfig.languageConfiguration}
          triggerSuggestOnFocus={editorConfig.triggerSuggestOnFocus}
        />

        {!value && !editorIsFocused && !isReadOnly && (
          <div style={placeholderStyles}>{placeholder}</div>
        )}

        {isReadOnly && (
          <EditToobar
            className={`${editorType}Editor__editOverlay`}
            handleClearEditor={onClear}
            handleEditClick={handleEditClick}
            editText={editText}
            clearText={clearText}
          />
        )}
      </div>
    </div>
  );
};
