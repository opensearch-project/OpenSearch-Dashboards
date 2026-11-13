/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useMemo } from 'react';
import { i18n } from '@osd/i18n';

import { EditorMode } from '../../utils/state_management/types';

import { getDatasetLanguages, getInitialQueryString } from '../query_builder/utils';
import { useEditorOperations } from '../hooks/use_editor_operations';
import { useQueryBuilderState } from '../hooks/use_query_builder_state';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../types';
import { ExploreFlavor } from '../../../../common';
import {
  getSourceTypeRegistry,
  OPENSEARCH_SOURCE_TYPE_ID,
} from '../../../services/source_type_registry';
import {
  LanguagePicker,
  LanguagePickerLanguage,
  LanguagePickerSourceType,
} from '../../../components/query_panel/query_panel_widgets/language_toggle/language_picker';
import { LearnMoreButton } from '../../../components/query_panel/query_panel_widgets/learn_more_link';

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

export const LanguageToggle = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const languageService = services.data.query.queryString.getLanguageService();

  const { focusEditor, switchEditorMode, clearEditor } = useEditorOperations();
  const { queryBuilder, queryEditorState, queryState, container } = useQueryBuilderState();

  const isPromptMode = queryEditorState.editorMode === EditorMode.Prompt;
  const currentLanguage = queryState.language;

  const dataset = queryState.dataset;

  const languageTitle = useMemo(() => {
    return getSourceTypeRegistry().getLanguageLabel(currentLanguage, dataset);
  }, [currentLanguage, dataset]);

  const registry = getSourceTypeRegistry();

  // The active dataset's source type decides source types.
  const source = registry.getForDataset(dataset);
  const isRegisteredSource = !!dataset && source.id !== OPENSEARCH_SOURCE_TYPE_ID;

  const flavor = dataset?.type === 'PROMETHEUS' ? ExploreFlavor.Metrics : ExploreFlavor.Logs;

  // The built-in languages plus the dataset's source's own, narrowed to what the dataset type can
  // run, then to what the dataset's engine version supports.
  // Without a dataset, only the current language.
  const supportedLanguages = useMemo(() => {
    if (!dataset) return [currentLanguage];
    return getDatasetLanguages(services, dataset).filter((languageId) => {
      const langConfig = languageService.getLanguage(languageId);
      // Apply per-dataset engine/version gating (e.g. hide SQL/PPL for legacy Elasticsearch
      // data sources below the language's minimum version).
      return !langConfig || languageService.isLanguageSupportedForDataset(langConfig, dataset);
    });
  }, [dataset, currentLanguage, services, languageService]);

  const languages: LanguagePickerLanguage[] = useMemo(
    () =>
      supportedLanguages.map((languageId) => {
        return {
          id: languageId,
          label: registry.getLanguageLabel(languageId, dataset),
          testSubjSuffix: languageService.getLanguage(languageId)?.title ?? languageId,
          guide: registry.getLanguageGuide(languageId, dataset),
        };
      }),
    [supportedLanguages, languageService, registry, dataset]
  );

  const sourceTypes: LanguagePickerSourceType[] = dataset
    ? [{ id: source.id, label: registry.getLabel(source, flavor), testSubjSuffix: source.label }]
    : [];

  const queryLanguageTitle = isRegisteredSource
    ? queryLanguageForSourceSectionTitle(registry.getLabel(source, flavor))
    : queryLanguageSectionTitle;

  // The source's icon, else the one its dataset type declares for the dataset picker.
  const triggerIcon = useMemo(() => {
    if (source.icon) return source.icon;

    const typeConfig = dataset
      ? services.data.query.queryString.getDatasetService().getType(dataset.type)
      : undefined;

    return (
      typeConfig?.meta?.icon?.type ?? registry.get(OPENSEARCH_SOURCE_TYPE_ID)?.icon ?? 'database'
    );
  }, [source, dataset, registry, services]);

  const onSelectLanguage = useCallback(
    (languageId: string) => {
      switchEditorMode(EditorMode.Query);
      clearEditor();
      const currentDataset = queryBuilder.queryState$.getValue().dataset;
      // SQL needs its base query on the current dataset; the others start empty.
      const query = getInitialQueryString(
        services.data.query.queryString,
        currentDataset,
        languageId
      );
      // The previous language's options (e.g. PromQL's per-query step) don't apply to this one.
      queryBuilder.updateQueryState({ language: languageId, query, queryOptions: undefined });
      container.markStale();
      setTimeout(() => focusEditor(true), 100);
    },
    [switchEditorMode, clearEditor, queryBuilder, container, services, focusEditor]
  );

  const onSelectQueryMode = useCallback(() => {
    switchEditorMode(EditorMode.Query);
    setTimeout(() => focusEditor(true), 100);
  }, [switchEditorMode, focusEditor]);

  const onSelectPrompt = useCallback(() => {
    switchEditorMode(EditorMode.Prompt);
    setTimeout(() => focusEditor(true), 100);
  }, [switchEditorMode, focusEditor]);

  return (
    <LanguagePicker
      triggerIcon={triggerIcon}
      languageLabel={languageTitle}
      isPromptMode={isPromptMode}
      sourceTypes={sourceTypes}
      activeSourceTypeId={source.id}
      queryLanguageTitle={queryLanguageTitle}
      languages={languages}
      selectedLanguage={currentLanguage}
      onSelectLanguage={onSelectLanguage}
      onSelectQueryMode={onSelectQueryMode}
      showAI={queryEditorState.promptModeIsAvailable}
      onSelectPromptMode={onSelectPrompt}
      footer={
        <LearnMoreButton
          services={services}
          queryLanguage={currentLanguage}
          dataset={dataset}
          isPromptMode={isPromptMode}
        />
      }
      anchorPosition="downCenter"
    />
  );
};
