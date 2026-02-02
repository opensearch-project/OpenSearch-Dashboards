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
import { useEditorFocus } from '../../../../application/hooks';
import { useLanguageSwitch } from '../../../../application/hooks/editor_hooks/use_switch_language';
import { getServices } from '../../../../services/services';
import './language_toggle.scss';

const promptOptionText = i18n.translate('explore.queryPanelFooter.languageToggle.promptOption', {
  defaultMessage: 'AI',
});

export const LanguageToggle = () => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const promptModeIsAvailable = useSelector(selectPromptModeIsAvailable);
  const isPromptMode = useSelector(selectIsPromptEditorMode);
  const language = useSelector(selectQueryLanguage);
  const focusOnEditor = useEditorFocus();

  const switchEditorMode = useLanguageSwitch();

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

  const languageTitle = useMemo(() => {
    const languageService = getServices().data.query.queryString.getLanguageService();
    return languageService.getLanguage(language)?.title ?? language;
  }, [language]);

  const badgeLabel = isPromptMode ? promptOptionText : languageTitle;

  const items = useMemo(() => {
    const output = [
      <EuiContextMenuItem
        key={languageTitle}
        onClick={() => onItemClick(EditorMode.Query)}
        disabled={!isPromptMode}
        data-test-subj={`queryPanelFooterLanguageToggle-${languageTitle}`}
      >
        {languageTitle}
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
  }, [isPromptMode, onItemClick, promptModeIsAvailable, languageTitle]);

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
