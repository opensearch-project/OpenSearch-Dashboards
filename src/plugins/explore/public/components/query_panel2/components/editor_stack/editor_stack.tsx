/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useSelector } from 'react-redux';
import { monaco } from '@osd/monaco';
import { EuiProgress } from '@elastic/eui';
import { PromptEditor } from './prompt_editor';
import { QueryEditor } from './query_editor';
import { LanguageType } from './types';
import {
  selectIsDualEditorMode,
  selectIsLoading,
} from '../../../../application/utils/state_management/selectors';
import '../../editor_stack/editor_stack.scss';

interface EditorStackProps {
  languageType: LanguageType;
  prompt: string;
  provideCompletionItems: monaco.languages.CompletionItemProvider['provideCompletionItems'];
}

const EditorStack: React.FC<EditorStackProps> = ({
  languageType,
  prompt,
  provideCompletionItems,
}) => {
  const isLoading = useSelector(selectIsLoading);
  const isDualEditor = useSelector(selectIsDualEditorMode);

  return (
    <div className="queryPanel__editorStack" data-test-subj="queryPanelEditorStack">
      <PromptEditor
        languageType={languageType}
        prompt={prompt}
        queryString={queryString}
        provideCompletionItems={provideCompletionItems}
      />
      {isDualEditor && (
        <QueryEditor
          languageType={LanguageType.PPL}
          queryString={queryString}
          provideCompletionItems={provideCompletionItems}
        />
      )}
      <div className="queryPanel__editorStack__progress" data-test-subj="queryPanelEditorProgress">
        {isLoading && <EuiProgress size="xs" color="accent" position="absolute" />}
      </div>
    </div>
  );
};

export { EditorStack, EditorStackProps };
