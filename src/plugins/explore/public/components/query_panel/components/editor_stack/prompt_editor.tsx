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
  isPromptReadOnly: boolean;
  onChange: (value: string) => void;
  onPromptRun: (queryString?: string) => void;
  onPromptEdit: () => void;
  onClearEditor: () => void;
}

export const PromptEditor: React.FC<PromptEditorProps> = ({
  languageType,
  prompt,
  isPromptReadOnly,
  onChange,
  onPromptRun,
  onPromptEdit,
  onClearEditor,
}) => {
  const editorConfig = getEditorConfig(languageType);
  const langText = languageType !== 'nl' ? 'query' : 'prompt';
  return (
    <ReusableEditor
      value={prompt}
      onChange={onChange}
      onRun={onPromptRun}
      isReadOnly={isPromptReadOnly}
      onEdit={onPromptEdit}
      onClear={onClearEditor}
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
