/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React, { useRef, useCallback, useEffect } from 'react';
import { useResizeDetector } from 'react-resize-detector';
import MonacoEditor from 'react-monaco-editor';

import { monaco } from '@osd/monaco';

import { LIGHT_THEME, DARK_THEME, DEFAULT_DARK_THEME, DEAFULT_LIGHT_THEME } from './editor_theme';

import './editor.scss';

export interface Props {
  /** Width of editor. Defaults to 100%. */
  width?: string | number;

  /** Height of editor. Defaults to 100%. */
  height?: string | number;

  /** ID of the editor language */
  languageId: string;

  /** Value of the editor */
  value: string;

  /** Function invoked when text in editor is changed */
  onChange: (value: string) => void;

  /**
   * Options for the Monaco Code Editor
   * Documentation of options can be found here:
   * https://microsoft.github.io/monaco-editor/docs.html#interfaces/editor.IEditorConstructionOptions.html
   */
  options?: monaco.editor.IEditorConstructionOptions;

  /**
   * Suggestion provider for autocompletion
   * Documentation for the provider can be found here:
   * https://microsoft.github.io/monaco-editor/docs.html#interfaces/languages.CompletionItemProvider.html
   */
  suggestionProvider?: monaco.languages.CompletionItemProvider;

  /**
   * Signature provider for function parameter info
   * Documentation for the provider can be found here:
   * https://microsoft.github.io/monaco-editor/docs.html#interfaces/languages.SignatureHelpProvider.html
   */
  signatureProvider?: monaco.languages.SignatureHelpProvider;

  /**
   * Hover provider for hover documentation
   * Documentation for the provider can be found here:
   * https://microsoft.github.io/monaco-editor/docs.html#interfaces/languages.HoverProvider.html
   */
  hoverProvider?: monaco.languages.HoverProvider;

  /**
   * Language config provider for bracket
   * Documentation for the provider can be found here:
   * https://microsoft.github.io/monaco-editor/docs.html#interfaces/languages.LanguageConfiguration.html
   */
  languageConfiguration?: monaco.languages.LanguageConfiguration;

  /**
   * Function called before the editor is mounted in the view
   */
  editorWillMount?: () => void;
  /**
   * Function called before the editor is mounted in the view
   * and completely replaces the setup behavior called by the component
   */
  overrideEditorWillMount?: () => void;

  /**
   * Function called after the editor is mounted in the view
   */
  editorDidMount?: (editor: monaco.editor.IStandaloneCodeEditor) => void;

  /**
   * Should the editor use the dark theme
   */
  useDarkTheme?: boolean;

  /**
   * Whether the suggestion widget/window will be triggered upon clicking into the editor
   */
  triggerSuggestOnFocus?: boolean;

  /**
   * Should the editor use latest theme variations for dark and light theme. By default it is false and editor uses default themes
   */
  useLatestTheme?: boolean;
}

export const CodeEditor: React.FC<Props> = ({
  languageId,
  value,
  onChange,
  width,
  height,
  options,
  suggestionProvider,
  signatureProvider,
  hoverProvider,
  languageConfiguration,
  editorWillMount,
  overrideEditorWillMount,
  editorDidMount,
  useDarkTheme,
  triggerSuggestOnFocus,
  useLatestTheme,
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  const handleResize = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.layout();
    }
  }, []);

  const { ref: containerRef } = useResizeDetector({
    handleWidth: true,
    handleHeight: true,
    onResize: handleResize,
  });

  const handleEditorWillMount = useCallback(
    (__monaco: unknown) => {
      if (__monaco !== monaco) {
        throw new Error('react-monaco-editor is using a different version of monaco');
      }

      if (overrideEditorWillMount) {
        overrideEditorWillMount();
        return;
      }

      if (editorWillMount) {
        editorWillMount();
      }

      // Register the theme
      monaco.editor.defineTheme(
        'euiColors',
        useLatestTheme
          ? useDarkTheme
            ? DARK_THEME
            : LIGHT_THEME
          : useDarkTheme
          ? DEFAULT_DARK_THEME
          : DEAFULT_LIGHT_THEME
      );
    },
    [overrideEditorWillMount, editorWillMount, useLatestTheme, useDarkTheme]
  );

  const handleEditorDidMount = useCallback(
    (editor: monaco.editor.IStandaloneCodeEditor, __monaco: unknown) => {
      if (__monaco !== monaco) {
        throw new Error('react-monaco-editor is using a different version of monaco');
      }

      editorRef.current = editor;

      if (editorDidMount) {
        editorDidMount(editor);
      }

      if (triggerSuggestOnFocus) {
        editor.onDidFocusEditorWidget(() => {
          editor.trigger('keyboard', 'editor.action.triggerSuggest', {});
        });
      }

      editor.onMouseDown((e) => {
        if (e.target.position) {
          if (e.event.detail === 1) {
            e.event.preventDefault(); // Prevent Monaco's default focus handling
            editor.setPosition(e.target.position!);
            editor.revealPosition(e.target.position!);
          }
          editor.focus();
        }
      });

      // Show the documentation panel by default
      const suggestController = editor.getContribution('editor.contrib.suggestController') as any;
      suggestController.widget.value._setDetailsVisible(true);
    },
    [editorDidMount, triggerSuggestOnFocus]
  );

  useEffect(() => {
    monaco.languages.onLanguage(languageId, () => {
      if (suggestionProvider) {
        monaco.languages.registerCompletionItemProvider(languageId, suggestionProvider);
      }

      if (signatureProvider) {
        monaco.languages.registerSignatureHelpProvider(languageId, signatureProvider);
      }

      if (hoverProvider) {
        monaco.languages.registerHoverProvider(languageId, hoverProvider);
      }

      if (languageConfiguration) {
        monaco.languages.setLanguageConfiguration(languageId, languageConfiguration);
      }
    });
  }, [languageId, suggestionProvider, signatureProvider, hoverProvider, languageConfiguration]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <MonacoEditor
        theme="euiColors"
        language={languageId}
        value={value}
        onChange={onChange}
        editorWillMount={handleEditorWillMount}
        editorDidMount={handleEditorDidMount}
        width={width}
        height={height}
        options={options}
      />
    </div>
  );
};

// React.lazy requires default export
// eslint-disable-next-line import/no-default-export
export default CodeEditor;
