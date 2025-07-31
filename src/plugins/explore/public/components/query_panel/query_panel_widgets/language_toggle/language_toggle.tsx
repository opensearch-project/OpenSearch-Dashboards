/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  EuiButtonEmpty,
  EuiContextMenuItem,
  EuiContextMenuPanel,
  EuiIcon,
  EuiPopover,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import {
  selectIsPromptEditorMode,
  selectPromptModeIsAvailable,
} from '../../../../application/utils/state_management/selectors';
import { EditorMode } from '../../../../application/utils/state_management/types';
import { useEditorFocus, useEditorRef } from '../../../../application/hooks';
import { setEditorMode } from '../../../../application/utils/state_management/slices';

const promptOptionText = i18n.translate('explore.queryPanelFooter.languageToggle.promptOption', {
  defaultMessage: 'Ask AI',
});

export const LanguageToggle = () => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const promptModeIsAvailable = useSelector(selectPromptModeIsAvailable);
  const isPromptMode = useSelector(selectIsPromptEditorMode);
  const dispatch = useDispatch();
  const editorRef = useEditorRef();
  const focusOnEditor = useEditorFocus();

  const onButtonClick = () => setIsPopoverOpen(!isPopoverOpen);
  const closePopover = useCallback(() => setIsPopoverOpen(false), []);

  const onItemClick = useCallback(
    (editorMode: EditorMode) => {
      closePopover();
      dispatch(setEditorMode(editorMode));
      setTimeout(focusOnEditor);
      // select all
      const range = editorRef.current?.getModel()?.getFullModelRange();
      if (range) {
        setTimeout(() => editorRef.current?.setSelection(range));
      }
    },
    [closePopover, dispatch, editorRef, focusOnEditor]
  );

  const items = useMemo(() => {
    const output = [
      <EuiContextMenuItem
        key="PPL"
        onClick={() => onItemClick(EditorMode.Query)}
        disabled={!isPromptMode}
        data-test-subj="queryPanelFooterLanguageToggle-PPL"
      >
        PPL
      </EuiContextMenuItem>,
    ];

    if (promptModeIsAvailable) {
      output.push(
        <EuiContextMenuItem
          key="ai"
          onClick={() => onItemClick(EditorMode.Prompt)}
          disabled={isPromptMode}
          data-test-subj="queryPanelFooterLanguageToggle-AI"
        >
          {promptOptionText}
        </EuiContextMenuItem>
      );
    }

    return output;
  }, [isPromptMode, onItemClick, promptModeIsAvailable]);

  return (
    <EuiPopover
      button={
        <EuiButtonEmpty
          onClick={onButtonClick}
          data-test-subj="queryPanelFooterLanguageToggle"
          size="xs"
        >
          <EuiIcon type="controlsHorizontal" size="s" />
        </EuiButtonEmpty>
      }
      isOpen={isPopoverOpen}
      closePopover={closePopover}
      anchorPosition="downCenter"
      panelPaddingSize="none"
    >
      <EuiContextMenuPanel size="s" items={items} />
    </EuiPopover>
  );
};
