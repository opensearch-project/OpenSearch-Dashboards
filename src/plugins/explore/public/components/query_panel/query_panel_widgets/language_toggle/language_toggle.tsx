/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { EuiBetaBadge, EuiContextMenuItem, EuiContextMenuPanel, EuiPopover } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import classNames from 'classnames';
import {
  selectIsPromptEditorMode,
  selectPromptModeIsAvailable,
  selectQueryLanguage,
} from '../../../../application/utils/state_management/selectors';
import { EditorMode } from '../../../../application/utils/state_management/types';
import { useEditorFocus, useEditorRef } from '../../../../application/hooks';
import { useLanguageSwitch } from '../../../../application/hooks/editor_hooks/use_language_switch';
import './language_toggle.scss';

const promptOptionText = i18n.translate('explore.queryPanelFooter.languageToggle.promptOption', {
  defaultMessage: 'AI',
});

export const LanguageToggle = () => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const promptModeIsAvailable = useSelector(selectPromptModeIsAvailable);
  const isPromptMode = useSelector(selectIsPromptEditorMode);
  const language = useSelector(selectQueryLanguage);
  const editorRef = useEditorRef();
  const focusOnEditor = useEditorFocus();

  const { switchEditorMode } = useLanguageSwitch();

  const onButtonClick = () => setIsPopoverOpen(!isPopoverOpen);
  const closePopover = useCallback(() => setIsPopoverOpen(false), []);

  const onItemClick = useCallback(
    (editorMode: EditorMode) => {
      closePopover();
      setTimeout(focusOnEditor);
      switchEditorMode(editorMode);
    },
    [closePopover, focusOnEditor, switchEditorMode]
  );

  // TODO: expand this once other languages are supported
  const badgeLabel = isPromptMode ? promptOptionText : language;

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
    // This div is needed to allow for the gradient styling
    <div className="exploreLanguageToggle">
      <EuiPopover
        button={
          <EuiBetaBadge
            onClick={onButtonClick}
            data-test-subj="queryPanelFooterLanguageToggle"
            className={classNames('exploreLanguageToggle__button', {
              ['exploreLanguageToggle__button--aiMode']: isPromptMode,
            })}
            label={badgeLabel}
          />
        }
        isOpen={isPopoverOpen}
        closePopover={closePopover}
        anchorPosition="downCenter"
        panelPaddingSize="none"
      >
        <EuiContextMenuPanel size="s" items={items} />
      </EuiPopover>
    </div>
  );
};
