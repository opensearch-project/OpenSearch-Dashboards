/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiText, EuiTextColorProps } from '@elastic/eui';
import { monaco } from '@osd/monaco';
import { CodeEditor } from '../../../../../../opensearch_dashboards_react/public';
import { createEditor, SingleLineInput } from '../shared';

interface FooterItem {
  text: string;
  color?: EuiTextColorProps['color'];
}

interface DefaultInputProps extends React.JSX.IntrinsicAttributes {
  languageId: string;
  value: string;
  onChange: (value: string) => void;
  editorDidMount: (editor: any) => void;
  footerItems?: {
    start?: Array<FooterItem | string>;
    end?: Array<FooterItem | string>;
  };
  headerRef?: React.RefObject<HTMLDivElement>;
  provideCompletionItems: monaco.languages.CompletionItemProvider['provideCompletionItems'];
}

const DefaultInput: React.FC<DefaultInputProps> = ({
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
        <div className="defaultEditor__footer">
          {footerItems.start?.map((item, index) => (
            <FooterItem key={index} item={item} />
          ))}
          <div className="defaultEditor__footerSpacer" />
          {footerItems.end?.map((item, index) => (
            <FooterItem key={index} item={item} />
          ))}
        </div>
      )}
    </div>
  );
};

const FooterItem: React.FC<{ item: FooterItem | string }> = ({ item }) => {
  const color = typeof item === 'string' ? ('subdued' as const) : item.color;
  const text = typeof item === 'string' ? item : item.text;
  return (
    <EuiText size="xs" className="defaultEditor__footerItem" color={color}>
      {text}
    </EuiText>
  );
};

export const createDefaultEditor = createEditor(SingleLineInput, null, DefaultInput);
