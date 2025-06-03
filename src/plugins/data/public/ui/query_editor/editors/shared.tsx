/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiCompressedFieldText, EuiProgress } from '@elastic/eui';
import { monaco } from '@osd/monaco';
import React, { Fragment, useCallback, useRef, useState } from 'react';
import { CodeEditor } from '../../../../../opensearch_dashboards_react/public';
import { QueryStatus, ResultStatus } from '../../../query';

interface SingleLineInputProps extends React.JSX.IntrinsicAttributes {
  languageId: string;
  value: string;
  onChange: (value: string) => void;
  editorDidMount: (editor: any) => void;
  provideCompletionItems: (
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    context: monaco.languages.CompletionContext,
    token: monaco.CancellationToken
  ) => Promise<monaco.languages.CompletionList>;
  prepend?: React.ComponentProps<typeof EuiCompressedFieldText>['prepend'];
  footerItems?: any;
  queryStatus?: QueryStatus;
}

type CollapsedComponent<T> = React.ComponentType<T>;
type ExpandedComponent<T> = React.ComponentType<T> | null;
type BodyComponent<T> = React.ComponentType<T>;

export interface EditorInstance<TCollapsed, TExpanded, TBody> {
  TopBar: {
    Collapsed: () => React.ReactElement;
    Expanded: (() => React.ReactElement) | null;
    Controls: React.ReactElement[];
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
  controls: React.ReactElement[],
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
      Controls: controls,
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
  footerItems,
  queryStatus,
}) => {
  const [editorIsFocused, setEditorIsFocused] = useState(false);
  const blurTimeoutRef = useRef<NodeJS.Timeout | undefined>();
  const handleEditorDidMount = useCallback(
    (editor: monaco.editor.IStandaloneCodeEditor) => {
      editorDidMount(editor);

      const focusDisposable = editor.onDidFocusEditorText(() => {
        if (blurTimeoutRef.current) {
          clearTimeout(blurTimeoutRef.current);
        }
        setEditorIsFocused(true);
      });

      const blurDisposable = editor.onDidBlurEditorText(() => {
        blurTimeoutRef.current = setTimeout(() => {
          setEditorIsFocused(false);
        }, 500);
      });

      return () => {
        focusDisposable.dispose();
        blurDisposable.dispose();
        if (blurTimeoutRef.current) {
          clearTimeout(blurTimeoutRef.current);
        }
      };
    },
    [editorDidMount]
  );

  return (
    <div
      className="euiFormControlLayout euiFormControlLayout--compressed euiFormControlLayout--group osdQueryBar__wrap"
      data-test-subj="osdQueryBarWrapper"
    >
      {prepend}
      <div
        className="osdQuerEditor__singleLine euiFormControlLayout__childrenWrapper"
        data-test-subj="osdQueryEditor__singleLine"
      >
        <CodeEditor
          height={20} // Adjusted to match lineHeight for a single line
          languageId={languageId}
          value={value}
          onChange={onChange}
          editorDidMount={handleEditorDidMount}
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
              horizontalScrollbarSize: 1,
            },
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            cursorStyle: 'line',
            // Configure suggestion behavior
            suggest: {
              snippetsPreventQuickSuggestions: false, // Ensure all suggestions are shown
              filterGraceful: false, // Don't filter suggestions
              showWords: false, // Disable word-based suggestions
              showStatusBar: true, // Enable the built-in status bar
            },
            // Using Monaco's built-in status bar with default behavior
          }}
          suggestionProvider={{
            triggerCharacters: [' '],
            // Make sure all parameters are passed to the provideCompletionItems function
            provideCompletionItems: async (model, position, context, token) => {
              return provideCompletionItems(model, position, context, token);
            },
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
          triggerSuggestOnFocus={true}
        />
        <div className="queryEditor__progress" data-test-subj="queryEditorProgress">
          {queryStatus?.status === ResultStatus.LOADING && (
            <EuiProgress size="xs" color="accent" position="absolute" />
          )}
        </div>
        {editorIsFocused && (
          <div className="queryEditor__footer" data-test-subj="queryEditorFooter">
            {footerItems && (
              <Fragment>
                {footerItems.start?.map((item: React.ReactNode, index: number) => (
                  <div key={index} className="queryEditor__footerItem">
                    {item}
                  </div>
                ))}
                <div className="queryEditor__footerSpacer" />
                {footerItems.end?.map((item: React.ReactNode, index: number) => (
                  <div key={index} className="queryEditor__footerItem">
                    {item}
                  </div>
                ))}
              </Fragment>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
