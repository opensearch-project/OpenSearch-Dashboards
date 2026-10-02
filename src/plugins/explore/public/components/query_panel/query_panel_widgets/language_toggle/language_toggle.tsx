/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { EuiIcon, EuiPopover, htmlIdGenerator } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import classNames from 'classnames';
import { Dataset, EMPTY_QUERY } from '../../../../../../data/common';
import {
  selectActiveTabId,
  selectDataset,
  selectIsPromptEditorMode,
  selectPromptModeIsAvailable,
  selectQueryLanguage,
} from '../../../../application/utils/state_management/selectors';
import { EditorMode } from '../../../../application/utils/state_management/types';
import { setQueryWithHistory } from '../../../../application/utils/state_management/slices';
import { useClearEditors, useEditorFocus } from '../../../../application/hooks';
import { useLanguageSwitch } from '../../../../application/hooks/editor_hooks/use_switch_language';
import { onEditorRunActionCreator } from '../../../../application/utils/state_management/actions/query_editor/on_editor_run/on_editor_run';
import { getServices } from '../../../../services/services';
import {
  getSourceTypeRegistry,
  OPENSEARCH_SOURCE_TYPE_ID,
  SourceTypeDefinition,
} from '../../../../services/source_type_registry';
import { useFlavorId } from '../../../../helpers/use_flavor_id';
import { LearnMoreLink } from '../learn_more_link';
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

interface LanguageToggleProps {
  hideAI?: boolean;
  /** The workspace allows only the visual builder: offer only sources that support it. */
  builderOnly?: boolean;
}

export const LanguageToggle = ({ hideAI = false, builderOnly = false }: LanguageToggleProps) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const promptModeIsAvailable = useSelector(selectPromptModeIsAvailable);
  const isPromptMode = useSelector(selectIsPromptEditorMode);
  const language = useSelector(selectQueryLanguage);
  const activeTabId = useSelector(selectActiveTabId);
  const activeDataset = useSelector(selectDataset);
  const focusOnEditor = useEditorFocus();
  const clearEditors = useClearEditors();
  const dispatch = useDispatch();
  const flavorId = useFlavorId();

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

  // Switch the active source by selecting a dataset. Mirrors DatasetSelectWidget's
  // handleDatasetSelect (cache the dataView, set the initial query for the dataset, push to
  // history) and then auto-runs, matching the language-switch behavior above.
  const switchToDataset = useCallback(
    async (dataset: Dataset) => {
      const services = getServices();
      const queryString = services.data.query.queryString;
      // The dataset picker caches the dataView inside its own component; here we bypass the
      // picker, so cache it ourselves or query execution can't resolve the dataView.
      try {
        const { storage, ...datasetServices } = services;
        await queryString.getDatasetService().cacheDataset(dataset, datasetServices);
      } catch {
        // Non-fatal: execution will surface a clearer error if the dataView truly can't load.
      }
      // getInitialQueryByDataset derives the language from dataset.language, which each source
      // type's resolveDefaultDataset sets so a language left over from the previous source isn't
      // coerced to the index-pattern type's kuery default.
      const initialQuery = queryString.getInitialQueryByDataset(dataset);
      // Start from an empty editor, like a dataset pick: the previous text is in another language.
      queryString.setQuery({ ...initialQuery, query: EMPTY_QUERY.QUERY, dataset });
      queryString.getLanguageService().setUserQueryLanguage(initialQuery.language);
      dispatch(setQueryWithHistory({ ...queryString.getQuery() }));
      clearEditors();
      scheduleTimeout(focusOnEditor);
      scheduleTimeout(() =>
        dispatch(onEditorRunActionCreator(services, queryString.getQuery().query as string))
      );
    },
    [dispatch, focusOnEditor, scheduleTimeout, clearEditors]
  );

  const onSourceTypeClick = useCallback(
    async (sourceType: SourceTypeDefinition) => {
      closePopover();
      const services = getServices();
      try {
        const target = await sourceType.resolveDefaultDataset({
          data: services.data,
          flavor: flavorId,
        });
        if (!target) {
          services.notifications?.toasts.addWarning({
            title: i18n.translate('explore.queryPanelFooter.sourceType.noDataset', {
              defaultMessage: 'No {sourceType} dataset found to query',
              values: { sourceType: sourceType.label },
            }),
          });
          return;
        }
        await switchToDataset(target);
      } catch (error) {
        services.notifications?.toasts.addError(error, {
          title: i18n.translate('explore.queryPanelFooter.sourceType.switchError', {
            defaultMessage: 'Could not switch source type',
          }),
        });
      }
    },
    [closePopover, switchToDataset, flavorId]
  );

  const languageService = getServices().data.query.queryString.getLanguageService();

  const languageTitle = useMemo(() => {
    return languageService.getLanguage(language)?.title ?? language;
  }, [language, languageService]);

  // Source types offered for this flavor (OpenSearch always is). Builder-only workspaces get only
  // sources whose languages the visual builder supports.
  const sourceTypes = useMemo(() => {
    const registry = getSourceTypeRegistry();
    return registry
      .getAll(flavorId)
      .filter((sourceType) => !builderOnly || registry.hasVisualBuilder(sourceType));
  }, [flavorId, builderOnly]);

  const activeSourceTypeId = getSourceTypeRegistry().getForDataset(activeDataset).id;

  // State for supported languages (async lookup required)
  const [supportedLanguages, setSupportedLanguages] = useState<string[]>(['PPL']);

  // Get supported languages for the active tab
  useEffect(() => {
    const services = getServices();
    const queryString = services.data.query.queryString;
    const languageSvc = queryString.getLanguageService();

    const updateSupportedLanguages = () => {
      const activeTab = activeTabId ? services.tabRegistry?.getTab(activeTabId) : undefined;
      const dataset = activeDataset;

      // What the active dataset's type can run, so one source's language never shows on another.
      const datasetTypeLanguages = dataset
        ? queryString.getDatasetService().getType(dataset.type)?.supportedLanguages(dataset)
        : undefined;

      let tabSupportedLanguages: string[];
      if (activeTab?.supportedLanguages?.length) {
        tabSupportedLanguages = activeTab.supportedLanguages;
      } else if (datasetTypeLanguages?.length) {
        // No active tab right after a dataset switch: use every tab's languages, narrowed below to
        // the new dataset's, rather than keep the previous source's list.
        const exploreLanguages = new Set<string>();
        services.tabRegistry?.getAllTabs().forEach((tab) => {
          tab.supportedLanguages?.forEach((langId) => exploreLanguages.add(langId));
        });
        tabSupportedLanguages = exploreLanguages.size ? Array.from(exploreLanguages) : ['PPL'];
      } else {
        tabSupportedLanguages = ['PPL'];
      }

      // Filter out SQL if feature flag is disabled
      if (tabSupportedLanguages.includes('SQL') && !services.sqlSupportEnabled) {
        tabSupportedLanguages = tabSupportedLanguages.filter((lang) => lang !== 'SQL');
      }

      // Narrow the tab's superset to what the dataset type can actually run.
      if (datasetTypeLanguages) {
        tabSupportedLanguages = tabSupportedLanguages.filter((langId) =>
          datasetTypeLanguages.includes(langId)
        );
      }

      // Apply per-dataset engine/version gating (e.g. hide SQL/PPL for legacy Elasticsearch
      // data sources below the language's minimum version).
      tabSupportedLanguages = tabSupportedLanguages.filter((langId) => {
        const langConfig = languageSvc.getLanguage(langId);
        return !langConfig || languageSvc.isLanguageSupportedForDataset(langConfig, dataset);
      });

      setSupportedLanguages(tabSupportedLanguages);
    };

    updateSupportedLanguages();
    // Redux only: query-string updates fire mid-switch with a stale dataset.
  }, [activeTabId, activeDataset]);

  const badgeLabel = isPromptMode ? promptOptionText : languageTitle;

  // The active source's icon, else the one its dataset type declares for the dataset picker.
  const triggerIcon = useMemo(() => {
    const registry = getSourceTypeRegistry();
    const sourceType = registry.get(activeSourceTypeId);
    if (sourceType?.icon) return sourceType.icon;
    const typeConfig = activeDataset
      ? getServices().data.query.queryString.getDatasetService().getType(activeDataset.type)
      : undefined;
    return (
      typeConfig?.meta?.icon?.type ?? registry.get(OPENSEARCH_SOURCE_TYPE_ID)?.icon ?? 'database'
    );
  }, [activeSourceTypeId, activeDataset]);

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
    // `supportedLanguages` is already narrowed to the active dataset type's languages (see the
    // effect above), so each source shows only the languages it can run.
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
            <EuiIcon type={triggerIcon} size="m" data-test-subj="queryPanelFooterSourceTypeIcon" />
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
            {sourceTypes.length > 1 ? (
              sourceTypes.map((sourceType) => {
                const isSelected = sourceType.id === activeSourceTypeId;
                return (
                  <button
                    type="button"
                    key={sourceType.id}
                    onClick={() => {
                      if (isSelected) return;
                      onSourceTypeClick(sourceType);
                    }}
                    aria-current={isSelected ? 'true' : undefined}
                    className={classNames('exploreLanguagePicker__sourceType', {
                      ['exploreLanguagePicker__sourceType--selected']: isSelected,
                    })}
                    data-test-subj={`queryPanelFooterSourceType-${sourceType.label}`}
                  >
                    {sourceType.label}
                  </button>
                );
              })
            ) : (
              // Only OpenSearch is available: render it as the selected, non-interactive entry
              // rather than a list with one choice.
              <div
                className="exploreLanguagePicker__sourceType exploreLanguagePicker__sourceType--selected"
                aria-current="true"
                data-test-subj={`queryPanelFooterSourceType-${sourceTypes[0]?.label}`}
              >
                {sourceTypes[0]?.label}
              </div>
            )}
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
            <LearnMoreLink />
          </div>
        </div>
      </EuiPopover>
    </div>
  );
};
