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
  // Create a wrapper for editorDidMount to add our custom status bar
  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    // Call the original editorDidMount function
    editorDidMount(editor);

    // Add a custom status bar with the "Tab to insert, ESC to close window" message
    const addCustomStatusBar = () => {
      // Find the suggestion widget
      const editorElement = editor.getDomNode();
      if (!editorElement) return;

      // Use a MutationObserver to detect when the suggestion widget is shown
      const observer = new MutationObserver(() => {
        // Check if the suggestion widget is visible
        const suggestWidget = editorElement.querySelector('.monaco-editor .suggest-widget.visible');
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
        const suggestWidget = editorElement.querySelector('.monaco-editor .suggest-widget.visible');
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
