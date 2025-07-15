/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { monaco } from '@osd/monaco';

type LanguageConfiguration = monaco.languages.LanguageConfiguration;
type IStandaloneCodeEditor = monaco.editor.IStandaloneCodeEditor;
type IEditorConstructionOptions = monaco.editor.IEditorConstructionOptions;

export interface UseSharedEditorProps {
  setEditorRef: (editor: IStandaloneCodeEditor) => void;
  editorPosition: 'top' | 'bottom';
}

export interface UseSharedEditorReturnType {
  isFocused: boolean;
  useLatestTheme: true;
  editorDidMount: (editor: IStandaloneCodeEditor) => () => IStandaloneCodeEditor;
  onChange: (text: string) => void;
  onWrapperClick(): void;
  languageConfiguration: LanguageConfiguration;
}

export interface UseEditorReturnType extends UseSharedEditorReturnType {
  languageId: string;
  options: IEditorConstructionOptions;
  triggerSuggestOnFocus: boolean;
  value: string;
}
