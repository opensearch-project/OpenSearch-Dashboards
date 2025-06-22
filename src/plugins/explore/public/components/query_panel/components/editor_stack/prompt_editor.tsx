/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { monaco } from '@osd/monaco';
import { EuiIcon } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { getEditorConfig } from './shared';
import { ReusableEditor } from './resuable_editor';
import { EditorType, LanguageType } from './types';

export interface PromptEditorProps {
  languageType: LanguageType;
  prompt: string;
  queryString?: string; // Optional for prompt editor
  isPromptLoading: boolean;
  isPromptReadOnly: boolean;
  onChange: (value: string) => void;
  onPromptRun: (queryString?: string) => void;
  onPromptEdit: () => void;
  onClearEditor: () => void;
  provideCompletionItems?: monaco.languages.CompletionItemProvider['provideCompletionItems'];
}

export const PromptEditor: React.FC<PromptEditorProps> = ({
  languageType,
  prompt,
  queryString,
  isPromptReadOnly,
  isPromptLoading,
  onChange,
  onPromptRun,
  onPromptEdit,
  onClearEditor,
  provideCompletionItems,
}) => {
  const editorConfig = getEditorConfig(languageType);

  const editorType = languageType !== LanguageType.Natural ? EditorType.Query : EditorType.Prompt;

  const value = editorType === EditorType.Prompt ? prompt : queryString;

  const placeholderText = i18n.translate('explore.queryPanel.promptEditor.placeholder', {
    defaultMessage: 'Ask a question or search using PPL',
  });

  return (
    <ReusableEditor
      value={value || ''}
      onChange={onChange}
      onRun={onPromptRun}
      isReadOnly={isPromptReadOnly}
      isLoading={isPromptLoading}
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
      provideCompletionItems={editorType === EditorType.Prompt ? undefined : provideCompletionItems}
    />
  );
};
