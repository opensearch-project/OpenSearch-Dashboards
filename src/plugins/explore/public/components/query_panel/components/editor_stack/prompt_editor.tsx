/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiIcon } from '@elastic/eui';
import { i18n } from '@osd/i18n';
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

  const placeholderText = i18n.translate('explore.queryPanel.promptEditor.placeholder', {
    defaultMessage: 'Ask a question or search using PPL',
  });

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
          {placeholderText} <EuiIcon type="editorCodeBlock" />
        </>
      }
      editText={i18n.translate('explore.queryPanel.promptEditor.editPrompt', {
        defaultMessage: 'Edit Prompt',
      })}
      clearText={i18n.translate('explore.queryPanel.promptEditor.clearEditor', {
        defaultMessage: 'Clear Editor',
      })}
      height={editorConfig.height}
      editorType={editorType}
    />
  );
};
