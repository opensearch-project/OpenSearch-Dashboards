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
    <div className="defaultEditor">
      <div ref={headerRef} className="defaultEditor__header" />
      <CodeEditor
        height={100}
        languageId={languageId}
        value={value}
        onChange={onChange}
        editorDidMount={editorDidMount}
        options={{
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 14,
          fontFamily: 'Roboto Mono',
          lineNumbers: 'on',
          folding: true,
          wordWrap: 'on',
          wrappingIndent: 'same',
          lineDecorationsWidth: 0,
          lineNumbersMinChars: 2,
          wordBasedSuggestions: false,
        }}
        suggestionProvider={{
          provideCompletionItems,
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
      />
      {footerItems && (
        <EuiFlexGroup direction="row" className="defaultEditor__footer">
          <EuiFlexGroup direction="row">
            {footerItems.start?.map((item) => (
              <EuiFlexItem grow={false} color="red" className="defaultEditor__footerItem">
                {item}
              </EuiFlexItem>
            ))}
          </EuiFlexGroup>
          <EuiFlexGroup direction="row" className="defaultEditor__footerItem__end">
            {footerItems.end?.map((item) => (
              <EuiFlexItem grow={false}>{item}</EuiFlexItem>
            ))}
          </EuiFlexGroup>
        </EuiFlexGroup>
      )}
    </div>
  );
};

export const createDefaultEditor = createEditor(SingleLineInput, null, DefaultInput);
