/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useCallback, useEffect, Fragment, useMemo } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiTabbedContent,
  EuiTabbedContentTab,
  EuiSpacer,
  EuiCompressedFieldSearch,
  EuiCompressedSelect,
  EuiSelectOption,
  EuiPageContent,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { fieldWildcardMatcher } from '../../../../../opensearch_dashboards_utils/public';
import {
  DataView,
  IndexPatternField,
  UI_SETTINGS,
  DataPublicPluginStart,
} from '../../../../../../plugins/data/public';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { DatasetManagmentContext } from '../../../types';
import { createEditDatasetPageStateContainer } from '../edit_dataset_state_container';
import {
  TAB_INDEXED_FIELDS,
  TAB_SCRIPTED_FIELDS,
  TAB_SOURCE_FILTERS,
  TAB_CORRELATED_DATASETS,
  TAB_CORRELATED_TRACES,
} from '../constants';
import { SourceFiltersTable } from '../source_filters_table';
import { IndexedFieldsTable } from '../indexed_fields_table';
import { ScriptedFieldsTable } from '../scripted_fields_table';
import { getTabs, getPath, convertToEuiSelectOption } from './utils';
import { CorrelatedDatasetsTab } from './correlated_datasets_tab';
import { CorrelatedTracesTab } from './correlated_traces_tab';
import { useCorrelationCount } from '../../../hooks/use_correlations';

interface TabsProps extends Pick<RouteComponentProps, 'history' | 'location'> {
  dataset: DataView;
  fields: IndexPatternField[];
  saveDataset: DataPublicPluginStart['indexPatterns']['updateSavedObject'];
}

const searchAriaLabel = i18n.translate('datasetManagement.editDataset.fields.searchAria', {
  defaultMessage: 'Search fields',
});

const filterAriaLabel = i18n.translate('datasetManagement.editDataset.fields.filterAria', {
  defaultMessage: 'Filter field types',
});

const filterPlaceholder = i18n.translate('datasetManagement.editDataset.fields.filterPlaceholder', {
  defaultMessage: 'Search',
});

export function Tabs({ dataset, saveDataset, fields, history, location }: TabsProps) {
  const { uiSettings, datasetManagementStart, docLinks, savedObjects } = useOpenSearchDashboards<
    DatasetManagmentContext
  >().services;
  const [fieldFilter, setFieldFilter] = useState<string>('');
  const [indexedFieldTypeFilter, setIndexedFieldTypeFilter] = useState<string>('');
  const [scriptedFieldLanguageFilter, setScriptedFieldLanguageFilter] = useState<string>('');
  const [indexedFieldTypes, setIndexedFieldType] = useState<EuiSelectOption[]>([]);
  const [scriptedFieldLanguages, setScriptedFieldLanguages] = useState<EuiSelectOption[]>([]);
  const [syncingStateFunc, setSyncingStateFunc] = useState<any>({
    getCurrentTab: () => TAB_INDEXED_FIELDS,
  });

  // Fetch correlation count for this dataset
  const { count: correlationCount, refetch: refetchCorrelationCount } = useCorrelationCount(
    savedObjects.client,
    dataset.id
  );

  const refreshFilters = useCallback(() => {
    const tempIndexedFieldTypes: string[] = [];
    const tempScriptedFieldLanguages: string[] = [];
    dataset.fields.getAll().forEach((field) => {
      if (field.scripted) {
        if (field.lang) {
          tempScriptedFieldLanguages.push(field.lang);
        }
      } else {
        tempIndexedFieldTypes.push(field.type);
      }
    });

    setIndexedFieldType(convertToEuiSelectOption(tempIndexedFieldTypes, 'indexedFiledTypes'));
    setScriptedFieldLanguages(
      convertToEuiSelectOption(tempScriptedFieldLanguages, 'scriptedFieldLanguages')
    );
  }, [dataset]);

  useEffect(() => {
    refreshFilters();
  }, [dataset, dataset.fields, refreshFilters]);

  const fieldWildcardMatcherDecorated = useCallback(
    (filters: string[]) => fieldWildcardMatcher(filters, uiSettings.get(UI_SETTINGS.META_FIELDS)),
    [uiSettings]
  );

  const useUpdatedUX = uiSettings.get('home:useNewHomePage');

  const getFilterSection = useCallback(
    (type: string) => {
      return (
        <EuiFlexGroup>
          <EuiFlexItem grow={true}>
            <EuiCompressedFieldSearch
              fullWidth
              placeholder={filterPlaceholder}
              value={fieldFilter}
              onChange={(e) => setFieldFilter(e.target.value)}
              data-test-subj="indexPatternFieldFilter"
              aria-label={searchAriaLabel}
            />
          </EuiFlexItem>
          {type === TAB_INDEXED_FIELDS && indexedFieldTypes.length > 0 && (
            <EuiFlexItem grow={false}>
              <EuiCompressedSelect
                options={indexedFieldTypes}
                value={indexedFieldTypeFilter}
                onChange={(e) => setIndexedFieldTypeFilter(e.target.value)}
                data-test-subj="indexedFieldTypeFilterDropdown"
                aria-label={filterAriaLabel}
              />
            </EuiFlexItem>
          )}
          {type === TAB_SCRIPTED_FIELDS && scriptedFieldLanguages.length > 0 && (
            <EuiFlexItem grow={false}>
              <EuiCompressedSelect
                options={scriptedFieldLanguages}
                value={scriptedFieldLanguageFilter}
                onChange={(e) => setScriptedFieldLanguageFilter(e.target.value)}
                data-test-subj="scriptedFieldLanguageFilterDropdown"
              />
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
      );
    },
    [
      fieldFilter,
      indexedFieldTypeFilter,
      indexedFieldTypes,
      scriptedFieldLanguageFilter,
      scriptedFieldLanguages,
    ]
  );

  const getContent = useCallback(
    (type: string) => {
      const Wrapper = useUpdatedUX ? EuiPageContent : Fragment;
      switch (type) {
        case TAB_INDEXED_FIELDS:
          return (
            <>
              {useUpdatedUX && <EuiSpacer size="m" />}
              <Wrapper {...(useUpdatedUX ? { paddingSize: 'm' } : {})}>
                <EuiSpacer size="m" />
                {getFilterSection(type)}
                <EuiSpacer size="m" />
                <IndexedFieldsTable
                  fields={fields}
                  dataset={dataset}
                  fieldFilter={fieldFilter}
                  fieldWildcardMatcher={fieldWildcardMatcherDecorated}
                  indexedFieldTypeFilter={indexedFieldTypeFilter}
                  helpers={{
                    redirectToRoute: (field: IndexPatternField) => {
                      history.push(getPath(field, dataset));
                    },
                    getFieldInfo: datasetManagementStart.list.getFieldInfo,
                  }}
                />
              </Wrapper>
            </>
          );
        case TAB_SCRIPTED_FIELDS:
          return (
            <>
              {useUpdatedUX && <EuiSpacer size="m" />}
              <Wrapper {...(useUpdatedUX ? { paddingSize: 'm' } : {})}>
                <EuiSpacer size="m" />
                {getFilterSection(type)}
                <EuiSpacer size="m" />
                <ScriptedFieldsTable
                  dataset={dataset}
                  saveDataset={saveDataset}
                  fieldFilter={fieldFilter}
                  scriptedFieldLanguageFilter={scriptedFieldLanguageFilter}
                  helpers={{
                    redirectToRoute: (field: IndexPatternField) => {
                      history.push(getPath(field, dataset));
                    },
                  }}
                  onRemoveField={refreshFilters}
                  painlessDocLink={docLinks.links.noDocumentation.scriptedFields.painless}
                  useUpdatedUX={useUpdatedUX}
                />
              </Wrapper>
            </>
          );
        case TAB_SOURCE_FILTERS:
          return (
            <>
              {useUpdatedUX && <EuiSpacer size="m" />}
              <Wrapper {...(useUpdatedUX ? { paddingSize: 'm' } : {})}>
                <EuiSpacer size="m" />
                {getFilterSection(type)}
                <EuiSpacer size="m" />
                <SourceFiltersTable
                  useUpdatedUX={useUpdatedUX}
                  saveDataset={saveDataset}
                  dataset={dataset}
                  filterFilter={fieldFilter}
                  fieldWildcardMatcher={fieldWildcardMatcherDecorated}
                  onAddOrRemoveFilter={refreshFilters}
                />
              </Wrapper>
            </>
          );
        case TAB_CORRELATED_DATASETS:
          return (
            <>
              {useUpdatedUX && <EuiSpacer size="m" />}
              <Wrapper {...(useUpdatedUX ? { paddingSize: 'm' } : {})}>
                <EuiSpacer size="m" />
                <CorrelatedDatasetsTab dataset={dataset} onCountChange={refetchCorrelationCount} />
              </Wrapper>
            </>
          );
        case TAB_CORRELATED_TRACES:
          return (
            <>
              {useUpdatedUX && <EuiSpacer size="m" />}
              <Wrapper {...(useUpdatedUX ? { paddingSize: 'm' } : {})}>
                <EuiSpacer size="m" />
                <CorrelatedTracesTab dataset={dataset} />
              </Wrapper>
            </>
          );
      }
    },
    [
      docLinks.links.noDocumentation.scriptedFields.painless,
      fieldFilter,
      fieldWildcardMatcherDecorated,
      fields,
      getFilterSection,
      history,
      dataset,
      datasetManagementStart.list.getFieldInfo,
      indexedFieldTypeFilter,
      refreshFilters,
      scriptedFieldLanguageFilter,
      saveDataset,
      useUpdatedUX,
      refetchCorrelationCount,
    ]
  );

  const euiTabs: EuiTabbedContentTab[] = useMemo(
    () =>
      getTabs(dataset, fieldFilter, datasetManagementStart.list, correlationCount).map(
        (tab: Pick<EuiTabbedContentTab, 'name' | 'id'>) => {
          return {
            ...tab,
            content: getContent(tab.id),
          };
        }
      ),
    [fieldFilter, getContent, dataset, datasetManagementStart.list, correlationCount]
  );

  const [selectedTabId, setSelectedTabId] = useState(euiTabs[0].id);

  useEffect(() => {
    const {
      startSyncingState,
      stopSyncingState,
      setCurrentTab,
      getCurrentTab,
    } = createEditDatasetPageStateContainer({
      useHashedUrl: uiSettings.get('state:storeInSessionStorage'),
      defaultTab: TAB_INDEXED_FIELDS,
    });

    startSyncingState();
    setSyncingStateFunc({
      setCurrentTab,
      getCurrentTab,
    });

    setSelectedTabId(getCurrentTab());

    return () => {
      stopSyncingState();
    };
  }, [uiSettings, dataset.id]);

  // Find the selected tab, or default to the first tab if not found
  const selectedTab = euiTabs.find((tab) => tab.id === selectedTabId) || euiTabs[0];

  return (
    <EuiTabbedContent
      tabs={euiTabs}
      selectedTab={selectedTab}
      onTabClick={(tab) => {
        setSelectedTabId(tab.id);
        syncingStateFunc.setCurrentTab(tab.id);
      }}
      size="s"
    />
  );
}
