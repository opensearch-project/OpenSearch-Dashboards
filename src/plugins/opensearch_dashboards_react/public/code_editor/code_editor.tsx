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

import React from 'react';
import { Resizable } from 'react-resizable';
import ReactResizeDetector from 'react-resize-detector';
import MonacoEditor from 'react-monaco-editor';

import { monaco } from '@osd/monaco';

import { LIGHT_THEME, DARK_THEME } from './editor_theme';

import 'react-resizable/css/styles.css'; // Import resizable styles
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
   * Whether the editor should be manually resizable or not
   */
  resizable?: boolean;
}

export class CodeEditor extends React.Component<Props, { editorHeight: number }> {
  _editor: monaco.editor.IStandaloneCodeEditor | null = null;

  constructor(props: Props) {
    super(props);
    this.state = { editorHeight: (props.height as number) || 20 };
  }

  _editorWillMount = (__monaco: unknown) => {
    if (__monaco !== monaco) {
      throw new Error('react-monaco-editor is using a different version of monaco');
    }

    if (this.props.overrideEditorWillMount) {
      this.props.overrideEditorWillMount();
      return;
    }

    if (this.props.editorWillMount) {
      this.props.editorWillMount();
    }

    // Register the theme
    monaco.editor.defineTheme('euiColors', this.props.useDarkTheme ? DARK_THEME : LIGHT_THEME);
  };

  _editorDidMount = (editor: monaco.editor.IStandaloneCodeEditor, __monaco: unknown) => {
    if (__monaco !== monaco) {
      throw new Error('react-monaco-editor is using a different version of monaco');
    }

    this._editor = editor;

    if (this.props.editorDidMount) {
      this.props.editorDidMount(editor);
    }

    if (this.props.triggerSuggestOnFocus) {
      editor.onDidFocusEditorWidget(() => {
        editor.trigger('keyboard', 'editor.action.triggerSuggest', {});
      });
    }
  };

  // Handles user manual resizing
  onResize = (_event: React.SyntheticEvent, { size }: { size: { height: number } }) => {
    this.setState({ editorHeight: size.height }, () => {
      if (this._editor) this._editor.layout();
    });
  };

  // Handles auto-resizing when the parent container changes
  _updateDimensions = () => {
    if (this._editor) {
      this._editor.layout();
    }
  };

  render() {
    const { languageId, value, onChange, width, options, resizable = true } = this.props;
    const { editorHeight } = this.state;

    monaco.languages.onLanguage(languageId, () => {
      if (this.props.suggestionProvider) {
        monaco.languages.registerCompletionItemProvider(languageId, this.props.suggestionProvider);
      }

      if (this.props.signatureProvider) {
        monaco.languages.registerSignatureHelpProvider(languageId, this.props.signatureProvider);
      }

      if (this.props.hoverProvider) {
        monaco.languages.registerHoverProvider(languageId, this.props.hoverProvider);
      }

      if (this.props.languageConfiguration) {
        monaco.languages.setLanguageConfiguration(languageId, this.props.languageConfiguration);
      }
    });

    const editorComponent = (
      <MonacoEditor
        theme="euiColors"
        language={languageId}
        value={value}
        onChange={onChange}
        editorWillMount={this._editorWillMount}
        editorDidMount={this._editorDidMount}
        width="100%"
        height={editorHeight}
        options={options}
      />
    );

    if (resizable) {
      return (
        <React.Fragment>
          {/* Manual Resize */}
          <Resizable
            height={editorHeight}
            width={width as number}
            minConstraints={[100, 100]}
            maxConstraints={[Infinity, 600]}
            onResize={this.onResize}
          >
            <div style={{ width, height: editorHeight, overflow: 'hidden' }}>{editorComponent}</div>
          </Resizable>

          {/* Auto Resize */}
          <ReactResizeDetector handleWidth handleHeight onResize={this._updateDimensions} />
        </React.Fragment>
      );
    }

    return (
      <React.Fragment>
        <div style={{ width, height: editorHeight, overflow: 'hidden' }}>{editorComponent}</div>
        <ReactResizeDetector handleWidth handleHeight onResize={this._updateDimensions} />
      </React.Fragment>
    );
  }
}

// React.lazy requires default export
// eslint-disable-next-line import/no-default-export
export default CodeEditor;
