/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PromptEditor } from './prompt_editor';
import { QueryEditor } from './query_editor';
import { LanguageType } from './shared';

interface EditorStackProps {
  onPromptChange: (value: string) => void;
  onQueryChange: (value: string) => void;
  languageType: LanguageType;
  isDualEditor: Boolean;
  isPromptReadOnly: boolean;
  isEditorReadOnly: boolean;
  handleQueryEdit: () => void;
  handlePromptEdit: () => void;
  handleQueryRun: (query?: string) => void;
  handlePromptRun: (prompt?: string) => void;
  handleClearEditor: () => void;
  queryString: string | { [key: string]: any };
  prompt: string;
}

const EditorStack: React.FC<EditorStackProps> = ({
  isDualEditor,
  isPromptReadOnly,
  isEditorReadOnly,
  onPromptChange,
  onQueryChange,
  languageType,
  handleQueryEdit,
  handlePromptEdit,
  handleQueryRun,
  handlePromptRun,
  handleClearEditor,
  queryString,
  prompt,
}) => {
  return (
    <div className="editor-stack">
      <PromptEditor
        onChange={onPromptChange}
        languageType={languageType}
        handlePromptRun={handlePromptRun}
        prompt={prompt}
        isPromptReadOnly={isPromptReadOnly}
        handlePromptEdit={handlePromptEdit}
        handleClearEditor={handleClearEditor}
      />
      {isDualEditor && (
        <QueryEditor
          onChange={onQueryChange}
          languageType="ppl"
          handleQueryRun={handleQueryRun}
          queryString={queryString}
          isEditorReadOnly={isEditorReadOnly}
          handleQueryEdit={handleQueryEdit}
          handleClearEditor={handleClearEditor}
        />
      )}
    </div>
  );
};

export { EditorStack };
