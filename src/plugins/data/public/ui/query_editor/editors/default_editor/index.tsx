/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiFlexItem, EuiFlexGroup } from '@elastic/eui';
import { monaco } from '@osd/monaco';
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
}

export const DefaultInput: React.FC<DefaultInputProps> = ({
  languageId,
  value,
  onChange,
  footerItems,
  editorDidMount,
  headerRef,
  provideCompletionItems,
}) => {
  return (
    <div className="defaultEditor" data-test-subj="osdQueryEditor__multiLine">
      <div ref={headerRef} className="defaultEditor__header" data-test-subj="defaultEditorHeader" />
      <CodeEditor
        height={100}
        languageId={languageId}
        value={value}
        onChange={onChange}
        editorDidMount={editorDidMount}
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
          wordBasedSuggestions: false,
        }}
        suggestionProvider={{
          provideCompletionItems,
          triggerCharacters: [' '],
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

export const createDefaultEditor = createEditor(SingleLineInput, null, DefaultInput);
