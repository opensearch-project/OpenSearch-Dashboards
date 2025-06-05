/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiIcon } from '@elastic/eui';
import { getEditorConfig } from './shared';
import { ReusableEditor } from './resuable_editor';
import { EditorType, LanguageType } from './types';

export interface PromptEditorProps {
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

  const editorType = languageType !== LanguageType.Natural ? EditorType.Query : EditorType.Prompt;
  return (
    <ReusableEditor
      value={prompt}
      onChange={onChange}
      onRun={onPromptRun}
      isReadOnly={isPromptReadOnly}
      onEdit={onPromptEdit}
      onClear={onClearEditor}
      editorConfig={editorConfig}
      // TODO: Placeholder text will be updated with new icons and dynamic lang name once query object integrated
      placeholder={
        <>
          Ask a question or search using <EuiIcon type="editorCodeBlock" /> PPL
        </>
      }
      editText="Edit Prompt"
      clearText="Clear Editor"
      height={editorConfig.height}
      editorType={editorType}
    />
  );
};
