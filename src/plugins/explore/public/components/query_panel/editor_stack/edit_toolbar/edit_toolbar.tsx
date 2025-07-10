/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiButtonEmpty, EuiFlexGroup, EuiFlexItem, EuiHorizontalRule } from '@elastic/eui';
import { useDispatch, useSelector } from 'react-redux';
import { i18n } from '@osd/i18n';
import { clearEditorActionCreator } from '../../../../application/utils/state_management/actions/query_editor';
import { useClearEditors, useToggleDualEditorMode } from '../../../../application/hooks';
import { selectEditorMode } from '../../../../application/utils/state_management/selectors';
import { EditorMode } from '../../../../application/utils/state_management/types';
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
  // TODO: FIX ME
  const className = 'queryEditor__editOverlay';

  const onEditClick = () => {
    toggleEditorMode();
  };

  const onClearEditor = () => {
    dispatch(clearEditorActionCreator(clearEditors));
  };

  const editText = editorMode === EditorMode.DualQuery ? editPromptText : editQueryText;

  return (
    <div className={className}>
      <EuiFlexGroup
        direction="row"
        gutterSize="s"
        justifyContent="spaceAround"
        className={`${className}__toolbar`}
      >
        <EuiFlexItem grow={false}>
          <EuiButtonEmpty
            size="xs"
            className={`${className}__button`}
            onClick={onEditClick}
            aria-label={editText}
            iconType="pencil"
          >
            <span className={`${className}__text`}>{editText}</span>
          </EuiButtonEmpty>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiHorizontalRule margin="xs" className={`${className}__separator`} />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButtonEmpty
            size="xs"
            className={`${className}__button`}
            onClick={onClearEditor}
            aria-label={clearText}
            iconType="crossInCircleEmpty"
          >
            <span className={`${className}__text`}>{clearText}</span>
          </EuiButtonEmpty>
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
};
