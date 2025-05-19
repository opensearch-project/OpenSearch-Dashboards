/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PromptEditor } from './prompt_editor';
import { QueryEditor } from './query_editor';
import { LanguageType } from './shared';
import { EditOrClear } from './edit_or_clear';
interface EditorStackProps {
  onPromptChange: (value: string) => void;
  onQueryChange: (value: string) => void;
  languageType: LanguageType;
  isDualEditor: Boolean;
  handleQueryRun: (queryString?: string) => void;
  handlePromptRun: (queryString?: string) => void;
  handleClearEditor: () => void;
  queryString: string;
  prompt: string;
}

const EditorStack: React.FC<EditorStackProps> = ({
  isDualEditor,
  onPromptChange,
  onQueryChange,
  languageType,
  handleQueryRun,
  handlePromptRun,
  handleClearEditor,
  queryString,
  prompt,
}) => {
  const [isPromptReadOnly, setIsPromptReadOnly] = useState(false);
  const [isEditorReadOnly, setIsEditorReadOnly] = useState(false);

  return (
    <div className="editor-stack">
      <PromptEditor
        onChange={onPromptChange}
        languageType={languageType}
        handlePromptRun={handlePromptRun}
        prompt={prompt}
        isPromptReadOnly={isPromptReadOnly}
        handlePromptEdit={() => {
          setIsEditorReadOnly(true);
          setIsPromptReadOnly(false);
        }}
        handleClearEditor={handleClearEditor}
      />
      {isDualEditor && (
        <QueryEditor
          onChange={onQueryChange}
          languageType="ppl"
          handleQueryRun={handleQueryRun}
          queryString={queryString}
          isEditorReadOnly={isEditorReadOnly}
          handleQueryEdit={() => setIsEditorReadOnly(false)}
          handleClearEditor={handleClearEditor}
        />
      )}
    </div>
  );
};

export { EditorStack };
