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

      // Add a custom status bar with the "Tab to insert, ESC to close window" message
      const addCustomStatusBar = () => {
        // Find the suggestion widget
        const editorElement = editor.getDomNode();
        if (!editorElement) return;

        // Use a MutationObserver to detect when the suggestion widget is shown
        const observer = new MutationObserver(() => {
          // Check if the suggestion widget is visible
          const suggestWidget = editorElement.querySelector(
            '.monaco-editor .suggest-widget.visible'
          );
          if (!suggestWidget) return;

          // Get the suggestion list container (the widget itself)
          const suggestWidgetElement = suggestWidget as HTMLElement;

          // Check if our custom status bar already exists
          let statusBar = document.querySelector('.custom-suggest-widget-status-bar');

          // If the status bar doesn't exist, create it
          if (!statusBar) {
            statusBar = document.createElement('div');
            statusBar.className = 'custom-suggest-widget-status-bar';
            statusBar.textContent = 'Tab to insert, ESC to close window';

            // Position it absolutely to avoid taking vertical space
            const statusBarStyle = statusBar as HTMLElement;
            statusBarStyle.style.position = 'absolute';
            statusBarStyle.style.bottom = '0';
            statusBarStyle.style.left = '0';
            statusBarStyle.style.zIndex = '10';

            // Add it to the document body so we can position it independently
            document.body.appendChild(statusBar);
          }

          // Get the exact dimensions and position of the suggestion widget
          const widgetRect = suggestWidgetElement.getBoundingClientRect();
          const statusBarElement = statusBar as HTMLElement;

          // Position the status bar at the bottom of the suggestion widget
          statusBarElement.style.width = `${widgetRect.width}px`;
          statusBarElement.style.left = `${widgetRect.left}px`;
          statusBarElement.style.top = `${widgetRect.bottom}px`;

          // Make sure it's visible
          statusBarElement.style.display = 'block';
        });

        // Start observing the editor DOM for changes
        observer.observe(editorElement, {
          childList: true,
          subtree: true,
          attributes: true,
        });

        // Also listen for keyboard events that might trigger suggestions
        editor.onKeyUp(() => {
          // Check if the suggestion widget is visible
          const suggestWidget = editorElement.querySelector(
            '.monaco-editor .suggest-widget.visible'
          );
          if (!suggestWidget) {
            // Hide the status bar if suggestions are not visible
            const statusBar = document.querySelector('.custom-suggest-widget-status-bar');
            if (statusBar) {
              (statusBar as HTMLElement).style.display = 'none';
            }
            return;
          }

          // Update the position of the status bar
          const statusBar = document.querySelector('.custom-suggest-widget-status-bar');
          if (!statusBar) return;

          const suggestWidgetElement = suggestWidget as HTMLElement;
          const widgetRect = suggestWidgetElement.getBoundingClientRect();
          const statusBarElement = statusBar as HTMLElement;

          statusBarElement.style.width = `${widgetRect.width}px`;
          statusBarElement.style.left = `${widgetRect.left}px`;
          statusBarElement.style.top = `${widgetRect.bottom}px`;
          statusBarElement.style.display = 'block';
        });

        // Clean up the status bar when editor loses focus
        editor.onDidBlurEditorText(() => {
          const statusBar = document.querySelector('.custom-suggest-widget-status-bar');
          if (statusBar) {
            (statusBar as HTMLElement).style.display = 'none';
          }
        });
      };

      // Call the function to set up the observer and add the custom status bar
      addCustomStatusBar();

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
            // Replace wordBasedSuggestions with suggest.showWords
            suggest: {
              showWords: false,
              // Ensure all suggestions are shown
              snippetsPreventQuickSuggestions: false,
              // Don't filter suggestions
              filterGraceful: false,
            },
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
