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
  handleQueryRun: (queryString?: string) => void;
  handlePromptRun: (queryString?: string) => void;
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
      />
      {isDualEditor && (
        <QueryEditor
          onChange={onQueryChange}
          languageType="ppl"
          handleQueryRun={handleQueryRun}
          queryString={queryString}
        />
      )}
    </div>
  );
};

export { EditorStack };
