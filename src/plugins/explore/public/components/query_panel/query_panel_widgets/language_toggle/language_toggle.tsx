/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { EuiIcon, EuiPopover, htmlIdGenerator } from '@elastic/eui';
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

const sourceTypeSectionTitle = i18n.translate(
  'explore.queryPanelFooter.languageToggle.sourceTypeSectionTitle',
  {
    defaultMessage: 'Source type',
  }
);

const queryLanguageSectionTitle = i18n.translate(
  'explore.queryPanelFooter.languageToggle.queryLanguageSectionTitle',
  {
    defaultMessage: 'Query language',
  }
);

const openPickerAriaLabel = i18n.translate('explore.queryPanelFooter.languageToggle.ariaLabel', {
  defaultMessage: 'Select source type and query language',
});

// OpenSearch is the only source type the query panel can talk to today, so it is
// rendered as the selected, non-interactive entry rather than a real list.
const OPENSEARCH_SOURCE_TYPE = 'OpenSearch';

interface LanguageToggleProps {
  hideAI?: boolean;
}

export const LanguageToggle = ({ hideAI = false }: LanguageToggleProps) => {
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
        newLanguage === 'PPL' ? '' : (langConfig?.getQueryString?.(currentQuery) ?? '');

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
    const services = getServices();
    const queryString = services.data.query.queryString;
    const languageSvc = queryString.getLanguageService();

    const updateSupportedLanguages = () => {
      if (!activeTabId) {
        // Don't update if active tab isn't set yet
        return;
      }

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

      // Apply per-dataset engine/version gating (e.g. hide SQL/PPL for legacy Elasticsearch
      // data sources below the language's minimum version).
      const dataset = queryString.getQuery().dataset;
      tabSupportedLanguages = tabSupportedLanguages.filter((langId) => {
        const langConfig = languageSvc.getLanguage(langId);
        return !langConfig || languageSvc.isLanguageSupportedForDataset(langConfig, dataset);
      });

      setSupportedLanguages(tabSupportedLanguages);
    };

    updateSupportedLanguages();

    // Re-run when the dataset (or other query state) changes, since gating depends on the
    // selected dataset's data source.
    const subscription = queryString.getUpdates$().subscribe(() => {
      updateSupportedLanguages();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [activeTabId]);

  const badgeLabel = isPromptMode ? promptOptionText : languageTitle;

  // The two columns are labelled groups, so the section headings are announced
  // as the group name rather than as loose text before the controls.
  const sourceTypeTitleId = useMemo(() => htmlIdGenerator('exploreLanguagePickerSourceType')(), []);
  const queryLanguageTitleId = useMemo(
    () => htmlIdGenerator('exploreLanguagePickerQueryLanguage')(),
    []
  );

  const languageChips = useMemo(() => {
    // A chip is selected exactly when it is the mode the editor is already in.
    // Selection is announced with `aria-current` rather than by disabling the
    // chip: a disabled button is announced as unavailable rather than as the
    // current choice, and drops out of the tab order. Clicking the selected chip
    // remains a no-op, as it was when the chip was disabled.
    return supportedLanguages.map((langId) => {
      const langConfig = languageService.getLanguage(langId);
      const title = langConfig?.title ?? langId;
      const isSelected = !isPromptMode && langId === language;
      return (
        <button
          type="button"
          key={langId}
          onClick={() => {
            if (isSelected) return;
            // Same language, but the editor is in prompt mode: go back to query mode.
            if (langId === language) {
              onItemClick(EditorMode.Query);
            } else {
              onLanguageClick(langId);
            }
          }}
          aria-current={isSelected ? 'true' : undefined}
          className={classNames('exploreLanguagePicker__chip', {
            ['exploreLanguagePicker__chip--selected']: isSelected,
          })}
          data-test-subj={`queryPanelFooterLanguageToggle-${title}`}
        >
          {title}
        </button>
      );
    });
  }, [supportedLanguages, languageService, isPromptMode, language, onItemClick, onLanguageClick]);

  const aiChip = useMemo(() => {
    if (!promptModeIsAvailable || hideAI) {
      return null;
    }

    return (
      <button
        type="button"
        onClick={() => {
          if (isPromptMode) return;
          onItemClick(EditorMode.Prompt);
        }}
        aria-current={isPromptMode ? 'true' : undefined}
        className={classNames('exploreLanguagePicker__chip', 'exploreLanguagePicker__chip--ai', {
          ['exploreLanguagePicker__chip--selected']: isPromptMode,
        })}
        data-test-subj="queryPanelFooterLanguageToggle-AI"
      >
        {promptOptionText}
      </button>
    );
  }, [promptModeIsAvailable, hideAI, isPromptMode, onItemClick]);

  return (
    // This div is needed to allow for the gradient styling
    <div className="exploreLanguagePicker">
      <EuiPopover
        button={
          <button
            type="button"
            onClick={onButtonClick}
            // A disclosure button: `aria-expanded` alone. `aria-haspopup` is
            // deliberately absent — its `true` value means "menu", and the panel
            // is a labelled group of buttons, not a menu with roving focus.
            aria-expanded={isPopoverOpen}
            aria-label={openPickerAriaLabel}
            data-test-subj="queryPanelFooterLanguageToggle"
            className={classNames('exploreLanguagePicker__trigger', {
              ['exploreLanguagePicker__trigger--aiMode']: isPromptMode,
              // Keep the hover outline while the popover is open, so moving the
              // pointer off the button and into the panel does not drop it.
              ['exploreLanguagePicker__trigger--open']: isPopoverOpen,
            })}
          >
            <EuiIcon type="logoOpenSearch" size="m" />
            <span className="exploreLanguagePicker__triggerLabel">{badgeLabel}</span>
            <EuiIcon type="arrowDown" size="s" className="exploreLanguagePicker__triggerCaret" />
          </button>
        }
        isOpen={isPopoverOpen}
        closePopover={closePopover}
        anchorPosition="downLeft"
        panelPaddingSize="none"
        hasArrow={false}
        // Without an arrow OuiPopover drops to an 8px gap, most of which the
        // open trigger's 3px halo eats, so the panel reads as touching the
        // pill. The extra 4px lands its top edge at the query editor below.
        offset={4}
        // Focus stays on the trigger. With the default focus trap the popover
        // focuses the first focusable child on open, so a chip the user did not
        // pick came up looking pre-highlighted. This branch of OuiPopover still
        // closes on Escape and on an outside click.
        ownFocus={false}
      >
        <div className="exploreLanguagePicker__panel">
          <div
            className="exploreLanguagePicker__section exploreLanguagePicker__section--sourceType"
            role="group"
            aria-labelledby={sourceTypeTitleId}
          >
            <div className="exploreLanguagePicker__sectionTitle" id={sourceTypeTitleId}>
              {sourceTypeSectionTitle}
            </div>
            <div
              className="exploreLanguagePicker__sourceType exploreLanguagePicker__sourceType--selected"
              aria-current="true"
              data-test-subj={`queryPanelFooterSourceType-${OPENSEARCH_SOURCE_TYPE}`}
            >
              {OPENSEARCH_SOURCE_TYPE}
            </div>
          </div>
          <div
            className="exploreLanguagePicker__section"
            role="group"
            aria-labelledby={queryLanguageTitleId}
          >
            <div
              className="exploreLanguagePicker__sectionTitle exploreLanguagePicker__sectionTitle--flush"
              id={queryLanguageTitleId}
            >
              {queryLanguageSectionTitle}
            </div>
            {/* One wrapping row: the AI chip flows with the languages rather
                than being pinned to its own line. */}
            <div className="exploreLanguagePicker__chips">
              {languageChips}
              {aiChip}
            </div>
          </div>
        </div>
      </EuiPopover>
    </div>
  );
};
