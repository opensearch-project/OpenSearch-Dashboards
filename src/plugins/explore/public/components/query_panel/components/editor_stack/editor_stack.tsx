/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PromptEditor } from './prompt_editor';
import { QueryEditor } from './query_editor';
import { LanguageType } from './types';
import './index.scss';

interface EditorStackProps {
  onPromptChange: (value: string) => void;
  onQueryChange: (value: string) => void;
  languageType: LanguageType;
  isDualEditor: boolean;
  isPromptReadOnly: boolean;
  isEditorReadOnly: boolean;
  onQueryEdit: () => void;
  onPromptEdit: () => void;
  onQueryRun: (query?: string) => void;
  onPromptRun: (prompt?: string) => void;
  onClearEditor: () => void;
  queryString: string;
  prompt: string;
}

const EditorStack: React.FC<EditorStackProps> = ({
  isDualEditor,
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
}) => {
  return (
    <div className="queryPanel__editorStack" data-test-subj="queryPanelEditorStack">
      <PromptEditor
        onChange={onPromptChange}
        languageType={languageType}
        prompt={prompt}
        isPromptReadOnly={isPromptReadOnly}
        onPromptRun={onPromptRun}
        onPromptEdit={onPromptEdit}
        onClearEditor={onClearEditor}
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
        />
      )}
    </div>
  );
};

export { EditorStack, EditorStackProps };
