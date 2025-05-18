/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { monaco } from '@osd/monaco';
import { CodeEditor } from '../../../../../../opensearch_dashboards_react/public';
import { getEditorConfig, LanguageType } from './shared';
import { EuiIcon } from '@elastic/eui';

interface PromptEditorProps {
  languageType: LanguageType;
  prompt: string;
  onChange: (value: string) => void;
  handlePromptRun: (queryString?: string) => void;
}

const PromptEditor: React.FC<PromptEditorProps> = ({
  languageType,
  onChange,
  handlePromptRun,
  prompt,
}) => {
  const [isReadOnly, setIsReadOnly] = useState(false);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const editorConfig = getEditorConfig(languageType);
  const [editorIsFocused, setEditorIsFocused] = useState(false);

  const handleEditClick = () => {
    setIsReadOnly(false);
    editorRef.current?.updateOptions({ readOnly: false });
    editorRef.current?.focus();
  };

  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;

    editor.onDidFocusEditorText(() => {
      setEditorIsFocused(true);
    });

    editor.onDidBlurEditorText(() => {
      setEditorIsFocused(false);
    });

    editor.updateOptions({
      placeholder: 'Enter your prompt here...',
    });

    editor.addCommand(monaco.KeyCode.Enter, () => {
      const promptValue = editor.getValue();
      handlePromptRun(promptValue);
      editor.updateOptions({ readOnly: true });
      setIsReadOnly(true);
    });

    // Add command for Shift + Enter to insert a new line
    editor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => {
      if (editor.hasTextFocus()) {
        console.log('Shift + Enter pressed prompt');
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

    editor.onDidContentSizeChange(() => {
      const contentHeight = editor.getContentHeight();
      editor.layout({ width: editor.getLayoutInfo().width, height: contentHeight });
    });
    return editor;
  };

  return (
    <div className="promptEditorWrapper" style={{ position: 'relative' }}>
      <div
        className={`promptEditor ${isReadOnly ? 'promptEditor--readonly' : ''}`}
        style={editorIsFocused && !isReadOnly ? { borderBottom: '1px solid #006BB4' } : {}}
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

        {!prompt && !editorIsFocused && !isReadOnly && (
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

        {isReadOnly && (
          <div className="promptEditor__editOverlay" onClick={handleEditClick}>
            <span className="edit_toolbar">
              {' '}
              <EuiIcon type="pencil" /> Edit prompt <span> | </span>{' '}
              <EuiIcon type="crossInCircleEmpty" /> Clear editor{' '}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export { PromptEditor };
