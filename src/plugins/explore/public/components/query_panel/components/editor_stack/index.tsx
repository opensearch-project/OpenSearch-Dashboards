/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PromptEditor } from './prompt_editor';
import { QueryEditor } from './query_editor';
import { LanguageType } from './shared';
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
    <div className="editorStack" data-test-subj="editor-stack">
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
          onChange={onQueryChange}
          languageType="ppl"
          queryString={queryString}
          isEditorReadOnly={isEditorReadOnly}
          onQueryRun={onQueryRun}
          onQueryEdit={onQueryEdit}
          onClearEditor={onClearEditor}
        />
      )}
    </div>
  );
};

export { EditorStack };
