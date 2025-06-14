/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
}

// TODO: Move this dynamic comment once the actual query is loaded
const FIXED_COMMENT = '// AI Generated PPL at 00.03.33pm';

export const QueryEditor: React.FC<QueryEditorProps> = ({
  queryString,
  languageType,
  isEditorReadOnly,
  onChange,
  onQueryRun,
  onQueryEdit,
  onClearEditor,
}) => {
  const editorConfig = getEditorConfig(languageType);
  const [decorated, setDecorated] = useState(false);

  // Inject comment only once when content is loaded
  // TODO: UPDATE THIS WTH DYNAMIC DECODED STRING ONCE API INTEGRATED
  useEffect(() => {
    if (queryString?.startsWith && !queryString.startsWith(FIXED_COMMENT)) {
      onChange(`${FIXED_COMMENT}\n${queryString}`);
    }
  }, [queryString, onChange]);

  const onEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    // Decorate the first line with a comment style if not already decorated
    if (!decorated) {
      editor.createDecorationsCollection([
        {
          range: new monaco.Range(1, 1, 1, 1),
          options: {
            isWholeLine: true,
            className: 'comment-line',
          },
        },
      ]);
      setDecorated(true);
    }
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
    />
  );
};
