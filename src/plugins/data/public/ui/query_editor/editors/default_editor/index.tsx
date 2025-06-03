/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiFlexItem, EuiFlexGroup, EuiProgress } from '@elastic/eui';
import { monaco } from '@osd/monaco';
import { QueryStatus, ResultStatus } from '../../../../query';
import { CodeEditor } from '../../../../../../opensearch_dashboards_react/public';
import { createEditor, SingleLineInput } from '../shared';

export interface DefaultInputProps extends React.JSX.IntrinsicAttributes {
  languageId: string;
  value: string;
  onChange: (value: string) => void;
  editorDidMount: (editor: any) => void;
  footerItems?: {
    start?: any[];
    end?: any[];
  };
  headerRef?: React.RefObject<HTMLDivElement>;
  provideCompletionItems: monaco.languages.CompletionItemProvider['provideCompletionItems'];
  queryStatus?: QueryStatus;
}

export const DefaultInput: React.FC<DefaultInputProps> = ({
  languageId,
  value,
  onChange,
  footerItems,
  editorDidMount,
  headerRef,
  provideCompletionItems,
  queryStatus,
}) => {
  // Simple wrapper for editorDidMount
  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    // Call the original editorDidMount function
    editorDidMount(editor);

    // Return the original editor instance
    return editor;
  };
  return (
    <div className="defaultEditor" data-test-subj="osdQueryEditor__multiLine">
      <div ref={headerRef} className="defaultEditor__header" data-test-subj="defaultEditorHeader" />
      <CodeEditor
        height={100}
        languageId={languageId}
        value={value}
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
        suggestionProvider={{
          triggerCharacters: [' '],
          provideCompletionItems: async (model, position, context, token) => {
            return provideCompletionItems(model, position, context, token);
          },
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
      <div className="defaultEditor__progress" data-test-subj="defaultEditorProgress">
        {queryStatus?.status === ResultStatus.LOADING && (
          <EuiProgress size="xs" color="accent" position="absolute" />
        )}
      </div>
      <div className="defaultEditor__footer" data-test-subj="defaultEditorFooter">
        {footerItems && (
          <EuiFlexGroup
            direction="row"
            alignItems="center"
            gutterSize="none"
            className="defaultEditor__footerRow"
            data-test-subj="defaultEditorFooterRow"
          >
            {footerItems.start?.map((item, idx) => (
              <EuiFlexItem
                key={`defaultEditor__footerItem-start-${idx}`}
                grow={false}
                className="defaultEditor__footerItem"
                data-test-subj="defaultEditorFooterStartItem"
              >
                {item}
              </EuiFlexItem>
            ))}
            <EuiFlexItem grow />
            {footerItems.end?.map((item, idx) => (
              <EuiFlexItem
                key={`defaultEditor__footerItem-end-${idx}`}
                grow={false}
                className="defaultEditor__footerItem"
                data-test-subj="defaultEditorFooterEndItem"
              >
                {item}
              </EuiFlexItem>
            ))}
          </EuiFlexGroup>
        )}
      </div>
    </div>
  );
};

export const createDefaultEditor = createEditor(SingleLineInput, null, [], DefaultInput);
