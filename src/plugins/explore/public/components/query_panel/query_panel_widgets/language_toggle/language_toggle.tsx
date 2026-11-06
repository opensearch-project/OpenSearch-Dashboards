/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { i18n } from '@osd/i18n';
import type { Query } from '../../../../../../data/common';
import {
  selectActiveTabId,
  selectDataset,
  selectIsPromptEditorMode,
  selectPromptModeIsAvailable,
  selectQueryLanguage,
} from '../../../../application/utils/state_management/selectors';
import { EditorMode } from '../../../../application/utils/state_management/types';
import { setQueryWithHistory } from '../../../../application/utils/state_management/slices';
import { useEditorFocus, useSwitchSourceType } from '../../../../application/hooks';
import {
  datasetRequiresExplicitRun,
  stageQueryForExplicitRun,
} from '../../../../application/utils/requires_explicit_run';
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
import {
  LanguagePicker,
  LanguagePickerLanguage,
  LanguagePickerSourceType,
} from './language_picker';
import './language_toggle.scss';

const queryLanguageSectionTitle = i18n.translate(
  'explore.queryPanelFooter.languageToggle.queryLanguageSectionTitle',
  {
    defaultMessage: 'Query language',
  }
);

const queryLanguageForSourceSectionTitle = (source: string) =>
  i18n.translate('explore.queryPanelFooter.languageToggle.queryLanguageForSourceSectionTitle', {
    defaultMessage: 'Query language for {source}',
    values: { source },
  });

interface LanguageToggleProps {
  hideAI?: boolean;
  /** The workspace allows only the visual builder: offer only sources that support it. */
  builderOnly?: boolean;
}

export const LanguageToggle = ({ hideAI = false, builderOnly = false }: LanguageToggleProps) => {
  const promptModeIsAvailable = useSelector(selectPromptModeIsAvailable);
  const isPromptMode = useSelector(selectIsPromptEditorMode);
  const language = useSelector(selectQueryLanguage);
  const activeTabId = useSelector(selectActiveTabId);
  const activeDataset = useSelector(selectDataset);
  const focusOnEditor = useEditorFocus();
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

  const onItemClick = useCallback(
    (editorMode: EditorMode) => {
      scheduleTimeout(focusOnEditor);
      switchEditorMode(editorMode);
    },
    [focusOnEditor, switchEditorMode, scheduleTimeout]
  );

  const onLanguageClick = useCallback(
    (newLanguage: string) => {
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

      // setQuery merges, so drop the previous language's options (e.g. PromQL's per-query legend and
      // step, and max data points): they don't apply to the new one. Query has no `queryOptions`
      // in its type; languages such as PromQL keep their options there.
      queryString.setQuery({
        query: newQueryString,
        language: newLanguage,
        dataset,
        queryOptions: undefined,
      } as Partial<Query>);
      languageSvc.setUserQueryLanguage(newLanguage);
      dispatch(setQueryWithHistory({ ...queryString.getQuery() }));
      scheduleTimeout(focusOnEditor);
      // Auto-execute query after language switch, unless the dataset waits for an explicit Run.
      // The same dataset keeps its previous results otherwise: clear them and stage the query.
      if (datasetRequiresExplicitRun(queryString, dataset)) {
        stageQueryForExplicitRun(dispatch);
        return;
      }
      scheduleTimeout(() => dispatch(onEditorRunActionCreator(services, newQueryString)));
    },
    [focusOnEditor, dispatch, scheduleTimeout]
  );

  const switchSourceType = useSwitchSourceType(flavorId);
  const onSourceTypeClick = useCallback(
    (sourceType: SourceTypeDefinition) => {
      return switchSourceType(sourceType);
    },
    [switchSourceType]
  );

  const languageService = getServices().data.query.queryString.getLanguageService();

  const languageTitle = useMemo(() => {
    return getSourceTypeRegistry().getLanguageLabel(language, activeDataset);
  }, [language, activeDataset]);

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

  // The dataset's data-source details (used for version gating) can arrive after the dataset is
  // in redux, through a query-string update; re-run the language list when one comes in.
  const [queryUpdates, setQueryUpdates] = useState(0);
  useEffect(() => {
    const subscription = getServices()
      .data.query.queryString.getUpdates$()
      .subscribe(() => setQueryUpdates((count) => count + 1));
    return () => subscription.unsubscribe();
  }, []);

  // Get supported languages for the active tab
  useEffect(() => {
    const services = getServices();
    const queryString = services.data.query.queryString;
    const languageSvc = queryString.getLanguageService();

    const updateSupportedLanguages = () => {
      const activeTab = activeTabId ? services.tabRegistry?.getTab(activeTabId) : undefined;
      // Redux's dataset decides which one is active; the query string's copy of the same dataset
      // can carry newer data-source details. A different id there is a stale mid-switch read.
      const latest = queryString.getQuery().dataset;
      const dataset = latest && latest.id === activeDataset?.id ? latest : activeDataset;

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
  }, [activeTabId, activeDataset, queryUpdates]);

  // A source that describes its languages (so e.g. OpenSearch SQL and another source's SQL read
  // differently) gets them as a list of rows, each with its name, tag and description, so they can
  // be compared before picking one. Otherwise they stay compact chips.
  const languageGuides = useMemo(
    () =>
      supportedLanguages.map((langId) => ({
        langId,
        guide: getSourceTypeRegistry().getLanguageGuide(langId, activeDataset),
      })),
    [supportedLanguages, activeDataset]
  );

  // A registered source's languages are introduced as that source's ("Query language for ...").
  const queryLanguageTitle = useMemo(() => {
    const registry = getSourceTypeRegistry();
    const activeSource = registry.getForDataset(activeDataset);
    return activeSource.id === OPENSEARCH_SOURCE_TYPE_ID
      ? queryLanguageSectionTitle
      : queryLanguageForSourceSectionTitle(registry.getLabel(activeSource, flavorId));
  }, [activeDataset, flavorId]);

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

  // `supportedLanguages` is already narrowed to the active dataset type's languages (see the
  // effect above), so each source shows only the languages it can run.
  const languages: LanguagePickerLanguage[] = useMemo(
    () =>
      supportedLanguages.map((langId) => ({
        id: langId,
        label: getSourceTypeRegistry().getLanguageLabel(langId, activeDataset),
        // The test subject keeps the registered title so it doesn't change with a source's label.
        testSubjSuffix: languageService.getLanguage(langId)?.title ?? langId,
        guide: languageGuides.find((g) => g.langId === langId)?.guide,
      })),
    [supportedLanguages, activeDataset, languageService, languageGuides]
  );

  const sourceTypesWithInfo: LanguagePickerSourceType[] = useMemo(
    () =>
      sourceTypes.map((sourceType) => ({
        id: sourceType.id,
        label: getSourceTypeRegistry().getLabel(sourceType, flavorId),
        testSubjSuffix: sourceType.label,
      })),
    [sourceTypes, flavorId]
  );

  return (
    <LanguagePicker
      triggerIcon={triggerIcon}
      languageLabel={languageTitle}
      isPromptMode={isPromptMode}
      sourceTypes={sourceTypesWithInfo}
      activeSourceTypeId={activeSourceTypeId}
      onSelectSourceType={(sourceTypeId) => {
        const sourceType = sourceTypes.find(({ id }) => id === sourceTypeId);
        if (sourceType) onSourceTypeClick(sourceType);
      }}
      queryLanguageTitle={queryLanguageTitle}
      languages={languages}
      selectedLanguage={language}
      onSelectLanguage={onLanguageClick}
      onSelectQueryMode={() => onItemClick(EditorMode.Query)}
      showAI={promptModeIsAvailable && !hideAI}
      onSelectPromptMode={() => onItemClick(EditorMode.Prompt)}
      footer={<LearnMoreLink />}
    />
  );
};
