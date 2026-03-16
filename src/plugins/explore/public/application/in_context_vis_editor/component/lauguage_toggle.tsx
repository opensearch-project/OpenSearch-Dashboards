/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { EuiBetaBadge, EuiContextMenuItem, EuiContextMenuPanel, EuiPopover } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import classNames from 'classnames';

import '../../../components/query_panel/query_panel_widgets/language_toggle/language_toggle.scss';
import { EditorMode } from '../../utils/state_management/types';
import { SupportLanguageType } from '../query_builder/query_builder';
import { useEditorOperations } from '../hooks/use_editor_operations';
import { useQueryBuilderState } from '../hooks/use_query_builder_state';

const promptOptionText = i18n.translate('explore.queryPanelFooter.languageToggle.promptOption', {
  defaultMessage: 'AI',
});

const promQLOptionText = i18n.translate('explore.queryPanelFooter.languageToggle.promQLOption', {
  defaultMessage: 'PromQL',
});

const pplOptionText = i18n.translate('explore.queryPanelFooter.languageToggle.pplOption', {
  defaultMessage: 'PPL',
});

const getLanguageDisplayLabel = (languageType: SupportLanguageType): string => {
  switch (languageType) {
    case SupportLanguageType.promQL:
      return promQLOptionText;
    case SupportLanguageType.ppl:
      return pplOptionText;
    case SupportLanguageType.ai:
      return promptOptionText;
    default:
      return languageType;
  }
};

export const LanguageToggle = () => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const { focusEditor, switchEditorMode } = useEditorOperations();
  const { queryBuilder, queryState, queryEditorState } = useQueryBuilderState();

  const [languageLabel, setlanguageLabel] = useState<string>(
    getLanguageDisplayLabel(queryEditorState.languageType)
  );
  const { clearEditor } = useEditorOperations();

  const promptModeIsAvailable = queryEditorState.promptModeIsAvailable;
  const isPromptMode = queryEditorState.editorMode === EditorMode.Prompt;
  const language = queryState.language;

  const onButtonClick = () => setIsPopoverOpen(!isPopoverOpen);
  const closePopover = useCallback(() => setIsPopoverOpen(false), []);

  useEffect(() => {
    const switchLanguage =
      queryEditorState.editorMode === EditorMode.Prompt
        ? SupportLanguageType.ai
        : queryEditorState.languageType;

    setlanguageLabel(getLanguageDisplayLabel(switchLanguage));
  }, [queryEditorState.editorMode, queryEditorState.languageType]);

  const onLanguageItemClick = useCallback(
    async (option: string) => {
      closePopover();

      setlanguageLabel(option as SupportLanguageType);

      if (option === promptOptionText) {
        switchEditorMode(EditorMode.Prompt);
      } else {
        switchEditorMode(EditorMode.Query);

        let languageType: SupportLanguageType;

        if (option === promQLOptionText) {
          languageType = SupportLanguageType.promQL;
        } else {
          languageType = SupportLanguageType.ppl;
        }

        clearEditor();
        // Switching languages triggers a new query preparation in queryBuilder
        queryBuilder.updateQueryEditorState({
          languageType,
        });
      }

      setTimeout(() => focusEditor(true), 100);
    },
    [closePopover, focusEditor, switchEditorMode, clearEditor, queryBuilder]
  );

  const items = useMemo(() => {
    const output = [
      <EuiContextMenuItem
        key={pplOptionText}
        onClick={() => onLanguageItemClick(pplOptionText)}
        disabled={!isPromptMode && language === 'PPL'}
        data-test-subj={`queryPanelFooterLanguageToggle-${pplOptionText}`}
      >
        {pplOptionText}
      </EuiContextMenuItem>,
      <EuiContextMenuItem
        key={promQLOptionText}
        onClick={() => onLanguageItemClick(promQLOptionText)}
        disabled={!isPromptMode && language === 'PROMQL'}
        data-test-subj={`queryPanelFooterLanguageToggle-${promQLOptionText}`}
      >
        {promQLOptionText}
      </EuiContextMenuItem>,
    ];

    // whether to display AI needs to check dataset first
    if (promptModeIsAvailable) {
      output.push(
        <EuiContextMenuItem
          key={promptOptionText}
          onClick={() => onLanguageItemClick(promptOptionText)}
          disabled={isPromptMode}
          data-test-subj={`queryPanelFooterLanguageToggle-${promptOptionText}`}
        >
          {promptOptionText}
        </EuiContextMenuItem>
      );
    }

    return output;
  }, [onLanguageItemClick, isPromptMode, language, promptModeIsAvailable]);

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
            label={languageLabel}
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
