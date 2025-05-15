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
  // value: string;
  onChange: (value: string) => void;
  // editorDidMount: (editor: any) => void;
}

export const QueryEditor: React.FC<PromptEditorProps> = ({ languageType, onChange }) => {
  // const editorConfig = getEditorConfig(languageType);

  // Simple wrapper for editorDidMount
  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    // Call the original editorDidMount function
    // editorDidMount(editor);

    // Return the original editor instance
    return editor;
  };
  return (
    <div className="queryEditor" data-test-subj="osdQueryEditor__multiLine">
      <CodeEditor
        height={100}
        languageId={languageType}
        value={'query'}
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
