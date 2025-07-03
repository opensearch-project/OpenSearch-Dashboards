/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { monaco } from '@osd/monaco';

type CompletionItemProvider = monaco.languages.CompletionItemProvider;
type LanguageConfiguration = monaco.languages.LanguageConfiguration;
type IStandaloneCodeEditor = monaco.editor.IStandaloneCodeEditor;
type IEditorConstructionOptions = monaco.editor.IEditorConstructionOptions;

export interface UseSharedEditorProps {
  provideCompletionItems?: CompletionItemProvider['provideCompletionItems'];
  setEditorRef: (editor: IStandaloneCodeEditor) => void;
}

export interface UseSharedEditorReturnType {
  height: number;
  suggestionProvider: CompletionItemProvider;
  useLatestTheme: true;
  editorDidMount: (editor: IStandaloneCodeEditor) => () => IStandaloneCodeEditor;
  onChange: (text: string) => void;
  languageConfiguration: LanguageConfiguration;
}

export interface UseEditorReturnType extends UseSharedEditorReturnType {
  languageId: string;
  options: IEditorConstructionOptions;
  triggerSuggestOnFocus: boolean;
  defaultValue?: string;
}
