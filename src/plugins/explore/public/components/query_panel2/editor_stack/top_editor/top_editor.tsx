/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { useDispatch, useSelector } from 'react-redux';
import { useEffectOnce } from 'react-use';
import { useTopEditor } from '../../utils';
import {
  selectEditorMode,
  selectQueryString,
} from '../../../../application/utils/state_management/selectors';
import { EditorMode } from '../../../../application/utils/state_management/types';
import { CodeEditor } from '../../../../../../opensearch_dashboards_react/public';
import { setEditorText } from '../../../../application/utils/state_management/slices';

const placeholderText = i18n.translate('explore.queryPanel.promptEditor.placeholder', {
  defaultMessage: 'Ask a question or search using {symbol} PPL',
  values: {
    symbol: '</>',
  },
});

export const TopEditor = () => {
  const dispatch = useDispatch();
  const editorMode = useSelector(selectEditorMode);
  const editorProps = useTopEditor();
  // TODO: so ugly
  const editorClassPrefix = [EditorMode.DualPrompt, EditorMode.SinglePrompt].includes(editorMode)
    ? 'promptEditor'
    : 'queryEditor';
  const isReadOnly = editorMode === EditorMode.DualQuery;

  // TODO: this useEffect and queryString is needed because monaco-editor's defaultValue does not work
  // https://github.com/react-monaco-editor/react-monaco-editor/issues/674
  const queryString = useSelector(selectQueryString);
  console.log({ queryString });
  useEffectOnce(() => {
    dispatch(setEditorText(queryString));
  });

  return (
    <div className={`${editorClassPrefix}Wrapper`}>
      <div
        className={`${editorClassPrefix} ${isReadOnly ? `${editorClassPrefix}--readonly` : ''}`}
        data-test-subj="exploreReusableEditor"
      >
        <CodeEditor {...editorProps} />
      </div>
    </div>
  );
};
