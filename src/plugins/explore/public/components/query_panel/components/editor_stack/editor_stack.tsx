/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { monaco } from '@osd/monaco';
import { EuiProgress } from '@elastic/eui';
import { PromptEditor } from './prompt_editor';
import { QueryEditor } from './query_editor';
import { LanguageType } from './types';
import './index.scss';

interface EditorStackProps {
  onPromptChange: (value: string) => void;
  onQueryChange: (value: string) => void;
  languageType: LanguageType;
  isDualEditor: boolean;
  isPromptLoading: boolean;
  isQueryLoading: boolean;
  isPromptReadOnly: boolean;
  isEditorReadOnly: boolean;
  onQueryEdit: () => void;
  onPromptEdit: () => void;
  onQueryRun: (query?: string) => void;
  onPromptRun: (prompt?: string) => void;
  onClearEditor: () => void;
  queryString: string;
  prompt: string;
  provideCompletionItems: monaco.languages.CompletionItemProvider['provideCompletionItems'];
}

const EditorStack: React.FC<EditorStackProps> = ({
  isDualEditor,
  isPromptLoading,
  isQueryLoading,
  isPromptReadOnly,
  isEditorReadOnly,
  languageType,
  queryString,
  prompt,
  onPromptChange,
  onQueryChange,
  onQueryEdit,
  onPromptEdit,
  onQueryRun,
  onPromptRun,
  onClearEditor,
  provideCompletionItems,
}) => {
  return (
    <div className="queryPanel__editorStack" data-test-subj="queryPanelEditorStack">
      <PromptEditor
        isPromptLoading={isPromptLoading}
        languageType={languageType}
        prompt={prompt}
        queryString={queryString}
        isPromptReadOnly={isPromptReadOnly}
        onChange={onPromptChange}
        onPromptRun={onPromptRun}
        onPromptEdit={onPromptEdit}
        onClearEditor={onClearEditor}
        provideCompletionItems={provideCompletionItems}
      />
      {isDualEditor && (
        <QueryEditor
          languageType={LanguageType.PPL}
          queryString={queryString}
          isEditorReadOnly={isEditorReadOnly}
          onChange={onQueryChange}
          onQueryRun={onQueryRun}
          onQueryEdit={onQueryEdit}
          onClearEditor={onClearEditor}
          provideCompletionItems={provideCompletionItems}
        />
      )}
      <div className="queryPanel__editorStack__progress" data-test-subj="queryPanelEditorProgress">
        {isQueryLoading && <EuiProgress size="xs" color="accent" position="absolute" />}
      </div>
    </div>
  );
};

export { EditorStack, EditorStackProps };
