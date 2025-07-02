/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { i18n } from '@osd/i18n';
import { monaco } from '@osd/monaco';
import { CodeEditor } from '../../../../../../opensearch_dashboards_react/public';
import { EditToolbar } from './edit_toolbar';
import { EditorType } from './types';

export interface ReusableEditorProps {
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
  editorType?: EditorType;
  height?: number;
  provideCompletionItems?: monaco.languages.CompletionItemProvider['provideCompletionItems'];
}

// Map EditorType enum to actual CSS class prefixes
const getEditorClassPrefix = (editorType: EditorType): string => {
  switch (editorType) {
    case EditorType.Prompt:
      return 'promptEditor';
    case EditorType.Query:
      return 'queryEditor';
    default:
      return 'queryEditor'; // fallback
  }
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
  editText,
  clearText,
  height = 32, // default height
  editorType = EditorType.Query,
  provideCompletionItems,
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [editorIsFocused, setEditorIsFocused] = useState(false);
  const blurTimeoutRef = useRef<number | undefined>(undefined);
  const [editorHeight, setEditorHeight] = useState(height);

  const editorClassPrefix = getEditorClassPrefix(editorType);

  useEffect(() => {
    return () => {
      clearTimeout(blurTimeoutRef.current);
    };
  }, []);

  const editTextI18n =
    editText ||
    i18n.translate('explore.queryPanel.reusableEditor.edit', {
      defaultMessage: 'Edit',
    });
  const clearTextI18n =
    clearText ||
    i18n.translate('explore.queryPanel.reusableEditor.clear', {
      defaultMessage: 'Clear',
    });

  const handleEditClick = () => {
    onEdit();
    editorRef.current?.updateOptions({ readOnly: false });
    editorRef.current?.focus();
  };

  const handleEditorDidMount = useCallback(
    (editor: monaco.editor.IStandaloneCodeEditor) => {
      const focusDisposable = editor.onDidFocusEditorText(() => {
        clearTimeout(blurTimeoutRef.current);
        setEditorIsFocused(true);
      });

      const blurDisposable = editor.onDidBlurEditorText(() => {
        blurTimeoutRef.current = window.setTimeout(() => {
          setEditorIsFocused(false);
        }, 300);
      });

      editorRef.current = editor;

      editor.addAction({
        id: `run-on-enter-${editorType}`,
        label: i18n.translate('explore.queryPanel.reusableEditor.run', {
          defaultMessage: 'Run',
        }),
        // eslint-disable-next-line no-bitwise
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
        contextMenuGroupId: 'navigation',
        contextMenuOrder: 1.5,
        run: () => {
          // Close autocomplete if open
          editor.trigger('keyboard', 'hideSuggestWidget', {});
          const val = editor.getValue();
          onRun(val);
          onEdit();
        },
      });

      editor.addAction({
        id: `insert-new-line-${editorType}`,
        label: i18n.translate('explore.queryPanel.reusableEditor.insertNewLine', {
          defaultMessage: 'Insert New Line on {editorType}',
          values: { editorType },
        }),
        // eslint-disable-next-line no-bitwise
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

      // Add Tab key handling to trigger next autosuggestions after selection
      editor.addCommand(monaco.KeyCode.Tab, () => {
        // First accept the selected suggestion
        editor.trigger('keyboard', 'acceptSelectedSuggestion', {});

        // Then retrigger suggestions after a short delay
        setTimeout(() => {
          editor.trigger('keyboard', 'editor.action.triggerSuggest', {});
        }, 100);
      });

      // Add Enter key handling for suggestions
      editor.addCommand(monaco.KeyCode.Enter, () => {
        // Check if suggestion widget is visible by checking for any suggestion context
        const contextKeyService = (editor as any)._contextKeyService;
        const suggestWidgetVisible = contextKeyService?.getContextKeyValue('suggestWidgetVisible');

        if (suggestWidgetVisible) {
          // Accept the selected suggestion and trigger next suggestions
          editor.trigger('keyboard', 'acceptSelectedSuggestion', {});
          setTimeout(() => {
            editor.trigger('keyboard', 'editor.action.triggerSuggest', {});
          }, 100);
        } else {
          // Run the query if no suggestions are visible
          const val = editor.getValue();
          onRun(val);
          onEdit();
        }
      });

      editor.onDidContentSizeChange(() => {
        const contentHeight = editor.getContentHeight();
        const maxHeight = 100;
        const finalHeight = Math.min(contentHeight, maxHeight);

        setEditorHeight(finalHeight);

        editor.layout({
          width: editor.getLayoutInfo().width,
          height: finalHeight,
        });

        editor.updateOptions({
          scrollBeyondLastLine: false,
          scrollbar: {
            vertical: contentHeight > maxHeight ? 'visible' : 'hidden',
          },
        });
      });

      onEditorDidMount?.(editor);

      return () => {
        focusDisposable.dispose();
        blurDisposable.dispose();
        clearTimeout(blurTimeoutRef.current);
        return editor;
      };
    },
    [onRun, onEdit, editorType, onEditorDidMount]
  );

  return (
    <div className={`${editorClassPrefix}Wrapper`}>
      <div
        className={`${editorClassPrefix} ${isReadOnly ? `${editorClassPrefix}--readonly` : ''} ${
          editorIsFocused && !isReadOnly ? `${editorClassPrefix}--focused` : ''
        }`}
        data-test-subj="exploreReusableEditor"
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
          useLatestTheme={true}
          suggestionProvider={{
            triggerCharacters: [' '],
            provideCompletionItems: async (model, position, context, token) => {
              // If a custom completion provider is provided
              if (provideCompletionItems) {
                return provideCompletionItems(model, position, context, token);
              }
              return { suggestions: [] };
            },
          }}
        />

        {!value &&
          !editorIsFocused &&
          !isReadOnly &&
          placeholder &&
          editorType !== EditorType.Query && (
            <div className={`${editorClassPrefix}__placeholder`}>{placeholder}</div>
          )}

        {isReadOnly && (
          <EditToolbar
            className={`${editorClassPrefix}__editOverlay`}
            onClearEditor={onClear}
            onEditClick={handleEditClick}
            editText={editTextI18n}
            clearText={clearTextI18n}
          />
        )}
      </div>
    </div>
  );
};
