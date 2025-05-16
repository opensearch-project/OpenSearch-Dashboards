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
}

const EditorStack: React.FC<EditorStackProps> = ({
  onPromptChange,
  onQueryChange,
  languageType,
}) => {
  return (
    <div className="editor-stack">
      <PromptEditor onChange={onPromptChange} languageType={languageType} />
      <QueryEditor onChange={onQueryChange} languageType="ppl" />
    </div>
  );
};

export { EditorStack };
