/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiButtonEmpty, EuiIcon, EuiText } from '@elastic/eui';
import { useDispatch, useSelector } from 'react-redux';
import { i18n } from '@osd/i18n';
import { clearEditorActionCreator } from '../../../../../application/utils/state_management/actions/query_editor';
import { useClearEditors, useToggleDualEditorMode } from '../../../../../application/hooks';
import { selectEditorMode } from '../../../../../application/utils/state_management/selectors';
import { EditorMode } from '../../../../../application/utils/state_management/types';
import './edit_toolbar.scss';

const editQueryText = i18n.translate('explore.queryPanel.queryEditor.editQuery', {
  defaultMessage: 'Edit Query',
});
const editPromptText = i18n.translate('explore.queryPanel.queryEditor.editPrompt', {
  defaultMessage: 'Edit Prompt',
});
const clearText = i18n.translate('explore.queryPanel.queryEditor.clearEditor', {
  defaultMessage: 'Clear Editor',
});

export const EditToolbar = () => {
  const dispatch = useDispatch();
  const editorMode = useSelector(selectEditorMode);
  const clearEditors = useClearEditors();
  const toggleEditorMode = useToggleDualEditorMode();

  const onEditClick = () => {
    toggleEditorMode();
  };

  const onClearEditor = () => {
    dispatch(clearEditorActionCreator(clearEditors));
  };

  const editText = editorMode === EditorMode.DualQuery ? editPromptText : editQueryText;

  return (
    <div className="exploreEditToolbar">
      <EuiButtonEmpty
        size="xs"
        className="exploreEditToolbar__button"
        onClick={onEditClick}
        aria-label={editText}
      >
        <div className="exploreEditToolbar__buttonTextWrapper">
          <EuiIcon type="pencil" size="s" />
          <EuiText size="xs">{editText}</EuiText>
        </div>
      </EuiButtonEmpty>
      <div className="exploreEditToolbar__verticalSeparator" />
      <EuiButtonEmpty
        size="xs"
        className="exploreEditToolbar__button"
        onClick={onClearEditor}
        aria-label={clearText}
      >
        <div className="exploreEditToolbar__buttonTextWrapper">
          <EuiIcon type="crossInCircleEmpty" size="s" />
          <EuiText size="xs">{clearText}</EuiText>
        </div>
      </EuiButtonEmpty>
    </div>
  );
};
