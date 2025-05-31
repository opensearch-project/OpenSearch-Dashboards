/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiIcon } from '@elastic/eui';
import { getEditorConfig, LanguageType } from './shared';
import { ReusableEditor } from './resuable_editor';

interface PromptEditorProps {
  languageType: LanguageType;
  prompt: string;
  onChange: (value: string) => void;
  handlePromptRun: (queryString?: string) => void;
  isPromptReadOnly: boolean;
  handlePromptEdit: () => void;
  handleClearEditor: () => void;
}

export const PromptEditor: React.FC<PromptEditorProps> = ({
  languageType,
  onChange,
  handlePromptRun,
  prompt,
  isPromptReadOnly,
  handlePromptEdit,
  handleClearEditor,
}) => {
  const editorConfig = getEditorConfig(languageType);
  const langText = languageType !== 'nl' ? 'query' : 'prompt';
  return (
    <ReusableEditor
      value={prompt}
      onChange={onChange}
      onRun={handlePromptRun}
      isReadOnly={isPromptReadOnly}
      onEdit={handlePromptEdit}
      onClear={handleClearEditor}
      editorConfig={editorConfig}
      placeholder={
        <>
          Ask a question or search using <EuiIcon type="editorCodeBlock" /> PPL
        </>
      }
      editText="Edit Prompt"
      clearText="Clear Editor"
      height={32}
      editorType={langText} // This is used for styling and identification
    />
  );
};
