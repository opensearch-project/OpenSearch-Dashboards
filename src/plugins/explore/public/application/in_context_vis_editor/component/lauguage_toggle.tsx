/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { EuiBetaBadge, EuiContextMenuItem, EuiContextMenuPanel, EuiPopover } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import classNames from 'classnames';

import '../../../components/query_panel/query_panel_widgets/language_toggle/language_toggle.scss';
import { EditorMode } from '../../utils/state_management/types';
import { SupportLanguageType } from '../query_builder/query_builder';
import { useEditorOperations } from '../hooks/use_editor_operations';
import { useQueryBuilderState } from '../hooks/use_query_builder_state';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../types';

const promptOptionText = i18n.translate('explore.queryPanelFooter.languageToggle.promptOption', {
  defaultMessage: 'AI',
});

const promQLOptionText = i18n.translate('explore.queryPanelFooter.languageToggle.promQLOption', {
  defaultMessage: 'PromQL',
});

const pplOptionText = i18n.translate('explore.queryPanelFooter.languageToggle.pplOption', {
  defaultMessage: 'PPL',
});

const sqlOptionText = i18n.translate('explore.queryPanelFooter.languageToggle.sqlOption', {
  defaultMessage: 'OpenSearch SQL',
});

const getLanguageDisplayLabel = (languageType: SupportLanguageType): string => {
  switch (languageType) {
    case SupportLanguageType.promQL:
      return promQLOptionText;
    case SupportLanguageType.ppl:
      return pplOptionText;
    case SupportLanguageType.ai:
      return promptOptionText;
    case SupportLanguageType.sql:
      return sqlOptionText;
    default:
      return languageType;
  }
};

export const LanguageToggle = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const { focusEditor, switchEditorMode } = useEditorOperations();
  const { queryBuilder, queryEditorState } = useQueryBuilderState();

  const [languageLabel, setlanguageLabel] = useState<string>(
    getLanguageDisplayLabel(queryEditorState.languageType)
  );
  const { clearEditor } = useEditorOperations();

  const promptModeIsAvailable = queryEditorState.promptModeIsAvailable;
  const isPromptMode = queryEditorState.editorMode === EditorMode.Prompt;
  const language = queryEditorState.languageType;

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
        } else if (option === pplOptionText) {
          languageType = SupportLanguageType.ppl;
        } else {
          languageType = SupportLanguageType.sql;
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

    if (services.sqlSupportEnabled) {
      output.push(
        <EuiContextMenuItem
          key={sqlOptionText}
          onClick={() => onLanguageItemClick(sqlOptionText)}
          disabled={!isPromptMode && language === 'SQL'}
          data-test-subj={`queryPanelFooterLanguageToggle-${sqlOptionText}`}
        >
          {sqlOptionText}
        </EuiContextMenuItem>
      );
    }

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
  }, [
    onLanguageItemClick,
    isPromptMode,
    language,
    promptModeIsAvailable,
    services.sqlSupportEnabled,
  ]);

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
