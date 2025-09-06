/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiSplitPanel } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { I18nProvider } from '@osd/i18n/react';
import React, { useCallback, useMemo, useState } from 'react';
import { OpenSearchSearchHit } from '../../types/doc_views_types';
import { DataView, DataViewField, UI_SETTINGS } from '../../../../data/public';
import { getServices } from '../../application/legacy/discover/opensearch_dashboards_services';
import { DiscoverFieldSearch } from './discover_field_search';
import './discover_sidebar.scss';
import { getDefaultFieldFilter, setFieldFilterProp } from './lib/field_filter';
import { getDetails } from './lib/get_details';
import { getIndexPatternFieldList } from './lib/get_index_pattern_field_list';
import { groupFields } from './lib/group_fields';
import { DiscoverFieldHeader } from './discover_field_header';
import { FieldList } from './field_list';
import { FacetList } from './facet_list';

export interface DiscoverSidebarProps {
  /**
   * the selected columns displayed in the doc table in discover
   */
  columns: string[];
  /**
   * a statistics of the distribution of fields in the given hits
   */
  fieldCounts: Record<string, number>;
  /**
   * hits fetched from OpenSearch, displayed in the doc table
   */
  hits: Array<OpenSearchSearchHit<Record<string, any>>>;
  /**
   * Callback function when selecting a field
   */
  onAddField: (fieldName: string, index?: number) => void;
  /**
   * Callback function when rearranging fields
   */
  onReorderFields: (sourceIdx: number, destinationIdx: number) => void;
  /**
   * Callback function when adding a filter from sidebar
   */
  onAddFilter: (field: DataViewField | string, value: string, type: '+' | '-') => void;
  /**
   * Callback function when removing a field
   * @param fieldName
   */
  onRemoveField: (fieldName: string) => void;
  /**
   * Callback function when sidebar Collapse
   */
  onCollapse?: () => void;
  /**
   * Currently selected data set
   */
  selectedDataSet?: DataView;
  isEnhancementsEnabledOverride: boolean;
}

export function DiscoverSidebar(props: DiscoverSidebarProps) {
  const {
    columns,
    fieldCounts,
    hits,
    selectedDataSet,
    isEnhancementsEnabledOverride,
    onCollapse,
  } = props;
  const [fieldFilterState, setFieldFilterState] = useState(getDefaultFieldFilter());
  const shortDotsEnabled = useMemo(() => {
    const services = getServices();
    return services.uiSettings.get(UI_SETTINGS.SHORT_DOTS_ENABLE);
  }, []);

  const fields = useMemo(() => {
    return getIndexPatternFieldList(selectedDataSet, fieldCounts);
  }, [selectedDataSet, fieldCounts]);

  const onChangeFieldSearch = useCallback(
    (field: string, value: string | boolean | undefined) => {
      const newState = setFieldFilterProp(fieldFilterState, field, value);
      setFieldFilterState(newState);
    },
    [fieldFilterState]
  );

  const getDetailsByField = useCallback(
    (ipField: DataViewField) => getDetails(ipField, hits, selectedDataSet),
    [hits, selectedDataSet]
  );

  const { facetedFields, selectedFields, queryFields, discoveredFields } = useMemo(
    () => groupFields(fields as DataViewField[], columns, fieldCounts, fieldFilterState),
    [fields, columns, fieldCounts, fieldFilterState]
  );

  const fieldTypes = useMemo(() => {
    const result = ['any'];
    if (Array.isArray(fields)) {
      for (const field of fields) {
        if (result.indexOf(field.type) === -1) {
          result.push(field.type);
        }
      }
    }
    return result;
  }, [fields]);

  if (!selectedDataSet || !fields) {
    return null;
  }

  return (
    <I18nProvider>
      <EuiSplitPanel.Outer
        className="explore_fieldSelector_list eui-yScroll"
        aria-label={i18n.translate(
          'explore.discover.fieldChooser.filter.indexAndFieldsSectionAriaLabel',
          {
            defaultMessage: 'Index and fields',
          }
        )}
        borderRadius="none"
        color="transparent"
        hasBorder={false}
      >
        <EuiSplitPanel.Inner
          grow={false}
          paddingSize="none"
          className="exploreSideBar_headerContainer"
        >
          <DiscoverFieldHeader onCollapse={onCollapse} />
        </EuiSplitPanel.Inner>
        <EuiSplitPanel.Inner
          grow={false}
          paddingSize="none"
          className="exploreSideBar_searchContainer"
        >
          <DiscoverFieldSearch
            onChange={onChangeFieldSearch}
            value={fieldFilterState.name}
            types={fieldTypes}
            isEnhancementsEnabledOverride={isEnhancementsEnabledOverride}
          />
        </EuiSplitPanel.Inner>

        <EuiSplitPanel.Inner
          className="eui-yScroll exploreSideBar_fieldListContainer"
          paddingSize="none"
        >
          {(fields.length > 0 || selectedDataSet.fieldsLoading) && (
            <>
              {facetedFields.length > 0 && (
                <FacetList
                  fields={facetedFields}
                  getDetailsByField={getDetailsByField}
                  shortDotsEnabled={shortDotsEnabled}
                  title={i18n.translate('explore.discover.fieldChooser.filter.facetedFieldsTitle', {
                    defaultMessage: 'Faceted fields',
                  })}
                  {...props}
                />
              )}
              <FieldList
                category="selected"
                fields={selectedFields}
                getDetailsByField={getDetailsByField}
                shortDotsEnabled={shortDotsEnabled}
                title={i18n.translate('explore.discover.fieldChooser.filter.selectedFieldsTitle', {
                  defaultMessage: 'Selected',
                })}
                {...props}
              />
              {queryFields.length > 0 && (
                <FieldList
                  category="query"
                  fields={queryFields}
                  getDetailsByField={getDetailsByField}
                  shortDotsEnabled={shortDotsEnabled}
                  title={i18n.translate('explore.discover.fieldChooser.filter.queryFieldsTitle', {
                    defaultMessage: 'Query',
                  })}
                  {...props}
                />
              )}
              <FieldList
                category="discovered"
                fields={discoveredFields}
                getDetailsByField={getDetailsByField}
                shortDotsEnabled={shortDotsEnabled}
                title={i18n.translate(
                  'explore.discover.fieldChooser.filter.discoveredFieldsTitle',
                  {
                    defaultMessage: 'Discovered',
                  }
                )}
                {...props}
              />
            </>
          )}
        </EuiSplitPanel.Inner>
      </EuiSplitPanel.Outer>
    </I18nProvider>
  );
}
