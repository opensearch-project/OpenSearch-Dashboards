/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { i18n } from '@osd/i18n';
import { monaco } from '@osd/monaco';
import { getEditorConfig } from './shared';
import { LanguageType, EditorType } from './types';
import { ReusableEditor } from './resuable_editor';

export interface QueryEditorProps {
  languageType: LanguageType;
  queryString: string;
  isEditorReadOnly: boolean;
  onChange: (value: string) => void;
  onQueryRun: (queryString?: string) => void;
  onQueryEdit: () => void;
  onClearEditor: () => void;
  provideCompletionItems?: monaco.languages.CompletionItemProvider['provideCompletionItems'];
}

export const QueryEditor: React.FC<QueryEditorProps> = ({
  queryString,
  languageType,
  isEditorReadOnly,
  onChange,
  onQueryRun,
  onQueryEdit,
  onClearEditor,
  provideCompletionItems,
}) => {
  const editorConfig = getEditorConfig(languageType);

  const onEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    // Optionally, you can add more editor setup logic here
    editor.focus();
  };

  return (
    <ReusableEditor
      value={queryString}
      isReadOnly={isEditorReadOnly}
      editorConfig={editorConfig}
      editText={i18n.translate('explore.queryPanel.queryEditor.editQuery', {
        defaultMessage: 'Edit Query',
      })}
      clearText={i18n.translate('explore.queryPanel.queryEditor.clearEditor', {
        defaultMessage: 'Clear Editor',
      })}
      height={editorConfig.height}
      editorType={EditorType.Query} // This is used for styling and identification
      onChange={onChange}
      onRun={onQueryRun}
      onEdit={onQueryEdit}
      onClear={onClearEditor}
      onEditorDidMount={onEditorDidMount}
      provideCompletionItems={provideCompletionItems}
    />
  );
};
