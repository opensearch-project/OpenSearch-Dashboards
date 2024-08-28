/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiCompressedFieldText } from '@elastic/eui';
import { monaco } from '@osd/monaco';
import { CodeEditor } from '../../../../../opensearch_dashboards_react/public';

interface SingleLineInputProps extends React.JSX.IntrinsicAttributes {
  languageId: string;
  value: string;
  onChange: (value: string) => void;
  editorDidMount: (editor: any) => void;
  provideCompletionItems: monaco.languages.CompletionItemProvider['provideCompletionItems'];
  prepend?: React.ComponentProps<typeof EuiCompressedFieldText>['prepend'];
}

type CollapsedComponent<T> = React.ComponentType<T>;
type ExpandedComponent<T> = React.ComponentType<T> | null;
type BodyComponent<T> = React.ComponentType<T>;

export interface Editor<TCollapsed, TExpanded, TBody> {
  TopBar: {
    Collapsed: CollapsedComponent<TCollapsed>;
    Expanded: ExpandedComponent<TExpanded>;
  };
  Body: BodyComponent<TBody>;
}

export interface EditorInstance<TCollapsed, TExpanded, TBody> {
  TopBar: {
    Collapsed: () => React.ReactElement;
    Expanded: (() => React.ReactElement) | null;
  };
  Body: () => React.ReactElement;
}

export function createEditor<
  TCollapsed extends React.JSX.IntrinsicAttributes,
  TExpanded extends React.JSX.IntrinsicAttributes,
  TBody extends React.JSX.IntrinsicAttributes
>(
  collapsed: CollapsedComponent<TCollapsed>,
  expanded: ExpandedComponent<TExpanded>,
  body: BodyComponent<TBody>
) {
  return (
    collapsedProps: TCollapsed,
    expandedProps: TExpanded,
    bodyProps: TBody
  ): EditorInstance<TCollapsed, TExpanded, TBody> => ({
    TopBar: {
      Collapsed: () => React.createElement(collapsed, collapsedProps),
      Expanded: expanded ? () => React.createElement(expanded, expandedProps) : null,
    },
    Body: () => React.createElement(body, bodyProps),
  });
}

export const SingleLineInput: React.FC<SingleLineInputProps> = ({
  languageId,
  value,
  onChange,
  editorDidMount,
  provideCompletionItems,
  prepend,
}) => (
  <div className="euiFormControlLayout euiFormControlLayout--group euiFormControlLayout--compressed osdQueryBar__wrap">
    {prepend}
    <div className="osdQuerEditor__singleLine euiFormControlLayout__childrenWrapper">
      <CodeEditor
        height={20} // Adjusted to match lineHeight for a single line
        languageId={languageId}
        value={value}
        onChange={onChange}
        editorDidMount={editorDidMount}
        options={{
          lineNumbers: 'off', // Disabled line numbers
          // lineHeight: 40,
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
          },
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          cursorStyle: 'line',
          wordBasedSuggestions: false,
        }}
        suggestionProvider={{
          provideCompletionItems,
        }}
        languageConfiguration={{
          autoClosingPairs: [
            {
              open: '(',
              close: ')',
            },
            {
              open: '"',
              close: '"',
            },
          ],
        }}
      />
    </div>
  </div>
);
