/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { monaco } from '@osd/monaco';
import { CodeEditor } from '../../../../../../opensearch_dashboards_react/public';
import { getEditorConfig, LanguageType } from './shared';

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
  const editorConfig = getEditorConfig(languageType);

  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    // Call the original editorDidMount function
    // editorDidMount(editor);

    // Return the original editor instance

    editor.addCommand(monaco.KeyCode.Enter, () => {
      console.log('Enter key pressed');
      handlePromptRun(editor.getValue());
    });
    return editor;
  };

  return (
    <div className="promptEditor" data-test-subj="osdQueryEditor__multiLine">
      <CodeEditor
        height={32}
        languageId={editorConfig.languageId}
        value={prompt}
        onChange={onChange}
        editorDidMount={handleEditorDidMount}
        options={{
          fixedOverflowWidgets: true,
          lineNumbers: 'off', // Disabled line numbers
          lineHeight: 32,
          fontSize: 14,
          fontFamily: 'Roboto Mono',
          minimap: {
            enabled: false,
          },
          scrollBeyondLastLine: false,
          wordWrap: 'off', // Disabled word wrapping
          wrappingIndent: 'none', // No indent since wrapping is off
          folding: false,
          glyphMargin: false,
          lineDecorationsWidth: 0,
          scrollbar: {
            vertical: 'hidden',
            horizontalScrollbarSize: 1,
          },
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          cursorStyle: 'line',
          ...editorConfig, // Spread the dynamic configuration
        }}
      />
    </div>
  );
};

export { PromptEditor };
