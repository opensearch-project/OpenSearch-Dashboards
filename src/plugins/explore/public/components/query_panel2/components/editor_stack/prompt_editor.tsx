/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { monaco } from '@osd/monaco';
import { EuiIcon } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { useSelector } from 'react-redux';
import { getEditorConfig } from './shared';
import { ReusableEditor } from './resuable_editor';
import { EditorType, LanguageType } from './types';
import { selectEditorMode } from '../../../../application/utils/state_management/selectors';
import { EditorMode } from '../../../../application/utils/state_management/types';

export interface PromptEditorProps {
  provideCompletionItems?: monaco.languages.CompletionItemProvider['provideCompletionItems'];
}

export const PromptEditor: React.FC<PromptEditorProps> = ({ provideCompletionItems }) => {
  const editorMode = useSelector(selectEditorMode);
  const languageType = [EditorMode.SinglePrompt, EditorMode.DualPrompt].includes(editorMode)
    ? LanguageType.Natural
    : LanguageType.PPL;
  const editorConfig = useMemo(() => getEditorConfig(languageType), [languageType]);

  const placeholderText = i18n.translate('explore.queryPanel.promptEditor.placeholder', {
    defaultMessage: 'Ask a question or search using PPL',
  });

  return (
    <ReusableEditor
      isReadOnly={editorMode === EditorMode.DualQuery}
      editorConfig={editorConfig}
      placeholder={
        <>
          {placeholderText} <EuiIcon type="editorCodeBlock" />
        </>
      }
      editText={i18n.translate('explore.queryPanel.promptEditor.editPrompt', {
        defaultMessage: 'Edit Prompt',
      })}
      height={editorConfig.height}
      editorType={editorType}
      provideCompletionItems={editorType === EditorType.Prompt ? undefined : provideCompletionItems}
    />
  );
};
