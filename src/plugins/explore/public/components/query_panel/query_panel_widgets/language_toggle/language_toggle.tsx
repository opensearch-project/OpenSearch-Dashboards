/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { EuiBetaBadge, EuiContextMenuItem, EuiContextMenuPanel, EuiPopover } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import classNames from 'classnames';
import {
  selectActiveTabId,
  selectIsPromptEditorMode,
  selectPromptModeIsAvailable,
  selectQueryLanguage,
} from '../../../../application/utils/state_management/selectors';
import { EditorMode } from '../../../../application/utils/state_management/types';
import { setQueryWithHistory } from '../../../../application/utils/state_management/slices';
import { useEditorFocus } from '../../../../application/hooks';
import { useLanguageSwitch } from '../../../../application/hooks/editor_hooks/use_switch_language';
import { onEditorRunActionCreator } from '../../../../application/utils/state_management/actions/query_editor/on_editor_run/on_editor_run';
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
  const activeTabId = useSelector(selectActiveTabId);
  const focusOnEditor = useEditorFocus();
  const dispatch = useDispatch();

  const switchEditorMode = useLanguageSwitch();

  // Track pending timeouts so they can be cancelled if the component unmounts
  // before they fire, avoiding dispatches against a stale store.
  const pendingTimeouts = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  useEffect(() => {
    const timeouts = pendingTimeouts.current;
    return () => {
      timeouts.forEach(clearTimeout);
      timeouts.clear();
    };
  }, []);
  const scheduleTimeout = useCallback((cb: () => void) => {
    const id = setTimeout(() => {
      pendingTimeouts.current.delete(id);
      cb();
    });
    pendingTimeouts.current.add(id);
  }, []);

  const onButtonClick = () => setIsPopoverOpen(!isPopoverOpen);
  const closePopover = useCallback(() => setIsPopoverOpen(false), []);

  const onItemClick = useCallback(
    (editorMode: EditorMode) => {
      closePopover();
      scheduleTimeout(focusOnEditor);
      switchEditorMode(editorMode);
    },
    [closePopover, focusOnEditor, switchEditorMode, scheduleTimeout]
  );

  const onLanguageClick = useCallback(
    (newLanguage: string) => {
      closePopover();
      const services = getServices();
      const queryString = services.data.query.queryString;
      const currentQuery = queryString.getQuery();
      const languageSvc = queryString.getLanguageService();
      const langConfig = languageSvc.getLanguage(newLanguage);
      const dataset = currentQuery.dataset;

      // Get the default query string for the new language
      // SQL needs a base query (SELECT * FROM ...) to be valid; PPL works with empty
      const newQueryString =
        newLanguage === 'PPL' ? '' : langConfig?.getQueryString?.(currentQuery) ?? '';

      queryString.setQuery({ query: newQueryString, language: newLanguage, dataset });
      languageSvc.setUserQueryLanguage(newLanguage);
      dispatch(setQueryWithHistory({ ...queryString.getQuery() }));
      scheduleTimeout(focusOnEditor);
      // Auto-execute query after language switch
      scheduleTimeout(() => dispatch(onEditorRunActionCreator(services, newQueryString)));
    },
    [closePopover, focusOnEditor, dispatch, scheduleTimeout]
  );

  const languageService = getServices().data.query.queryString.getLanguageService();

  const languageTitle = useMemo(() => {
    return languageService.getLanguage(language)?.title ?? language;
  }, [language, languageService]);

  // State for supported languages (async lookup required)
  const [supportedLanguages, setSupportedLanguages] = useState<string[]>(['PPL']);

  // Get supported languages for the active tab
  useEffect(() => {
    const updateSupportedLanguages = () => {
      if (!activeTabId) {
        // Don't update if active tab isn't set yet
        return;
      }

      const services = getServices();
      const activeTab = services.tabRegistry?.getTab(activeTabId);

      let tabSupportedLanguages: string[];
      if (activeTab?.supportedLanguages?.length) {
        tabSupportedLanguages = activeTab.supportedLanguages;
      } else {
        tabSupportedLanguages = ['PPL'];
      }

      // Filter out SQL if feature flag is disabled
      if (tabSupportedLanguages.includes('SQL') && !services.sqlSupportEnabled) {
        tabSupportedLanguages = tabSupportedLanguages.filter((lang) => lang !== 'SQL');
      }

      setSupportedLanguages(tabSupportedLanguages);
    };

    updateSupportedLanguages();
  }, [activeTabId]);

  const badgeLabel = isPromptMode ? promptOptionText : languageTitle;

  const items = useMemo(() => {
    const output: React.ReactElement[] = [];

    // Add all supported languages for the active tab
    for (const langId of supportedLanguages) {
      const langConfig = languageService.getLanguage(langId);
      const title = langConfig?.title ?? langId;
      output.push(
        <EuiContextMenuItem
          key={langId}
          onClick={() =>
            langId === language ? onItemClick(EditorMode.Query) : onLanguageClick(langId)
          }
          disabled={!isPromptMode && langId === language}
          data-test-subj={`queryPanelFooterLanguageToggle-${title}`}
        >
          {title}
        </EuiContextMenuItem>
      );
    }

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
  }, [
    isPromptMode,
    onItemClick,
    onLanguageClick,
    promptModeIsAvailable,
    supportedLanguages,
    language,
    languageService,
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
