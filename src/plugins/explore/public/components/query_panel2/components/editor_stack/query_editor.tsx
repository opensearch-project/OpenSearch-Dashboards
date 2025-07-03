/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { i18n } from '@osd/i18n';
import { monaco } from '@osd/monaco';
import { useSelector } from 'react-redux';
import { getEditorConfig } from './shared';
import { EditorType, LanguageType } from './types';
import { ReusableEditor } from './resuable_editor';
import { selectEditorMode } from '../../../../application/utils/state_management/selectors';
import { EditorMode } from '../../../../application/utils/state_management/types';

export interface QueryEditorProps {
  provideCompletionItems?: monaco.languages.CompletionItemProvider['provideCompletionItems'];
}

export const QueryEditor: React.FC<QueryEditorProps> = ({ provideCompletionItems }) => {
  const editorMode = useSelector(selectEditorMode);
  const languageType = [EditorMode.SinglePrompt, EditorMode.DualPrompt].includes(editorMode)
    ? LanguageType.Natural
    : LanguageType.PPL;
  const editorConfig = useMemo(() => getEditorConfig(languageType), [languageType]);

  const onEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    // Optionally, you can add more editor setup logic here
    editor.focus();
  };

  return (
    <ReusableEditor
      isReadOnly={editorMode !== EditorMode.DualQuery}
      editorConfig={editorConfig}
      editText={i18n.translate('explore.queryPanel.queryEditor.editQuery', {
        defaultMessage: 'Edit Query',
      })}
      height={editorConfig.height}
      editorType={EditorType.Query} // This is used for styling and identification
      onEditorDidMount={onEditorDidMount}
      provideCompletionItems={provideCompletionItems}
    />
  );
};
