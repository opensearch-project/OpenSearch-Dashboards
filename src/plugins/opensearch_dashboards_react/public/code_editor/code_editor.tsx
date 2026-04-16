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
import ReactResizeDetector from 'react-resize-detector';
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

export class CodeEditor extends React.Component<Props, {}> {
  _editor: monaco.editor.IStandaloneCodeEditor | null = null;
  _providerDisposables: monaco.IDisposable[] = [];
  _onLanguageDisposable: monaco.IDisposable | undefined;
  _providerLanguageId: string | undefined;

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
    monaco.editor.defineTheme(
      'euiColors',
      this.props.useLatestTheme
        ? this.props.useDarkTheme
          ? DARK_THEME
          : LIGHT_THEME
        : this.props.useDarkTheme
        ? DEFAULT_DARK_THEME
        : DEAFULT_LIGHT_THEME
    );
  };

  _ensureFontsLoaded = () => {
    // Fix for Monaco Editor cursor misalignment when using custom fonts
    // Based on: https://github.com/microsoft/monaco-editor/issues/4644
    document.fonts.ready
      .then(() => {
        monaco.editor.remeasureFonts();
      })
      .catch(() => {
        // Silently handle any font loading errors
        // This ensures the editor still works even if font loading fails
      });
  };

  _editorDidMount = (editor: monaco.editor.IStandaloneCodeEditor, __monaco: unknown) => {
    if (__monaco !== monaco) {
      throw new Error('react-monaco-editor is using a different version of monaco');
    }

    this._editor = editor;

    // Ensure providers exist when the editor mounts. This handles the SPA
    // navigation case where onLanguage won't fire because the language
    // was already encountered in a previous mount cycle.
    this._ensureProvidersRegistered(this.props.languageId);
    this._setLanguageConfiguration(this.props.languageId, true);

    // Fix cursor misalignment issue by remeasuring fonts after they're loaded
    this._ensureFontsLoaded();

    if (this.props.editorDidMount) {
      this.props.editorDidMount(editor);
    }

    if (this.props.triggerSuggestOnFocus) {
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
  };

  _registerProviders(languageId: string) {
    this._providerDisposables.forEach((d) => d.dispose());
    this._providerDisposables = [];
    this._providerLanguageId = languageId;

    if (this.props.suggestionProvider) {
      this._providerDisposables.push(
        monaco.languages.registerCompletionItemProvider(languageId, this.props.suggestionProvider)
      );
    }

    if (this.props.signatureProvider) {
      this._providerDisposables.push(
        monaco.languages.registerSignatureHelpProvider(languageId, this.props.signatureProvider)
      );
    }

    if (this.props.hoverProvider) {
      this._providerDisposables.push(
        monaco.languages.registerHoverProvider(languageId, this.props.hoverProvider)
      );
    }
  }

  _ensureProvidersRegistered(languageId: string) {
    if (this._providerLanguageId === languageId && this._providerDisposables.length > 0) {
      return;
    }
    this._registerProviders(languageId);
  }

  _setLanguageConfiguration(languageId: string, swallowUnknownLanguage = false) {
    if (!this.props.languageConfiguration) {
      return;
    }
    if (swallowUnknownLanguage) {
      try {
        monaco.languages.setLanguageConfiguration(languageId, this.props.languageConfiguration);
      } catch {
        // Language not yet registered — onLanguage will handle this.
      }
      return;
    }
    monaco.languages.setLanguageConfiguration(languageId, this.props.languageConfiguration);
  }

  render() {
    const { languageId, value, onChange, width, height, options } = this.props;

    // Cancel any pending onLanguage listener from a previous render to prevent
    // listener accumulation.
    this._onLanguageDisposable?.dispose();

    // Listen for the language's first encounter so providers are registered
    // when a model for this language is created for the very first time.
    // For SPA remounts (language already encountered), _editorDidMount handles
    // registration directly since onLanguage won't fire again.
    this._onLanguageDisposable = monaco.languages.onLanguage(languageId, () => {
      this._ensureProvidersRegistered(languageId);
      this._setLanguageConfiguration(languageId);
    });

    return (
      <React.Fragment>
        <MonacoEditor
          theme="euiColors"
          language={languageId}
          value={value}
          onChange={onChange}
          editorWillMount={this._editorWillMount}
          editorDidMount={this._editorDidMount}
          width={width}
          height={height}
          options={options}
        />
        <ReactResizeDetector handleWidth handleHeight onResize={this._updateDimensions} />
      </React.Fragment>
    );
  }

  componentDidUpdate(prevProps: Props) {
    // Re-register providers when the language changes on an already-mounted
    // editor. react-monaco-editor handles language switches via
    // setModelLanguage without re-calling editorDidMount, so neither
    // editorDidMount nor onLanguage (one-shot) would fire in that case.
    // Note: we intentionally do NOT compare provider prop identity here
    // because callers pass fresh object literals on every render, which
    // would cause dispose/re-register churn on every keystroke.
    if (prevProps.languageId !== this.props.languageId) {
      this._registerProviders(this.props.languageId);
      this._setLanguageConfiguration(this.props.languageId, true);
    }
  }

  componentWillUnmount() {
    this._onLanguageDisposable?.dispose();
    this._providerDisposables.forEach((d) => d.dispose());
    this._providerDisposables = [];
    this._providerLanguageId = undefined;
  }

  _updateDimensions = () => {
    if (this._editor) {
      this._editor.layout();
    }
  };
}

// React.lazy requires default export
// eslint-disable-next-line import/no-default-export
export default CodeEditor;
