/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import {
  DropResult,
  EuiButtonEmpty,
  EuiDragDropContext,
  EuiDraggable,
  EuiDroppable,
  EuiPanel,
  EuiSplitPanel,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { I18nProvider } from '@osd/i18n/react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { IndexPattern, IndexPatternField, UI_SETTINGS } from '../../../../../data/public';
import { FIELDS_LIMIT_SETTING } from '../../../../common';
import { getServices } from '../../../opensearch_dashboards_services';
import { DiscoverField } from './discover_field';
import { DiscoverFieldDataFrame } from './discover_field_data_frame';
import { DiscoverFieldSearch } from './discover_field_search';
import './discover_sidebar.scss';
import { displayIndexPatternCreation } from './lib/display_index_pattern_creation';
import { getDefaultFieldFilter, setFieldFilterProp } from './lib/field_filter';
import { getDetails } from './lib/get_details';
import { getIndexPatternFieldList } from './lib/get_index_pattern_field_list';
import { groupFields } from './lib/group_fields';
import { FieldDetails } from './types';

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
  hits: Array<Record<string, unknown>>;
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
  onAddFilter: (field: IndexPatternField | string, value: string, type: '+' | '-') => void;
  /**
   * Callback function when removing a field
   * @param fieldName
   */
  onRemoveField: (fieldName: string) => void;
  /**
   * Callback function to create an index pattern
   */
  onCreateIndexPattern: () => void;
  /**
   * Callback function to normalize the index pattern
   */
  onNormalize: () => void;
  /**
   * Currently selected index pattern
   */
  selectedIndexPattern?: IndexPattern;
  isEnhancementsEnabledOverride: boolean;
}

export function DiscoverSidebar(props: DiscoverSidebarProps) {
  const {
    columns,
    fieldCounts,
    hits,
    onAddField,
    onReorderFields,
    onNormalize,
    onCreateIndexPattern,
    selectedIndexPattern,
    isEnhancementsEnabledOverride,
  } = props;
  const [fields, setFields] = useState<IndexPatternField[] | null>(null);
  const [fieldFilterState, setFieldFilterState] = useState(getDefaultFieldFilter());
  const services = useMemo(() => getServices(), []);

  useEffect(() => {
    const newFields = getIndexPatternFieldList(selectedIndexPattern, fieldCounts);
    setFields(newFields);
  }, [selectedIndexPattern, fieldCounts, hits, services]);

  const onNormalizeIndexPattern = useCallback(async () => {
    await onNormalize();
    const newFields = getIndexPatternFieldList(selectedIndexPattern, fieldCounts);
    setFields(newFields);
  }, [fieldCounts, onNormalize, selectedIndexPattern]);

  const onChangeFieldSearch = useCallback(
    (field: string, value: string | boolean | undefined) => {
      const newState = setFieldFilterProp(fieldFilterState, field, value);
      setFieldFilterState(newState);
    },
    [fieldFilterState]
  );

  const getDetailsByField = useCallback(
    (ipField: IndexPatternField) => getDetails(ipField, hits, selectedIndexPattern),
    [hits, selectedIndexPattern]
  );

  const popularLimit = services.uiSettings.get(FIELDS_LIMIT_SETTING);
  const shortDotsEnabled = services.uiSettings.get(UI_SETTINGS.SHORT_DOTS_ENABLE);

  const {
    selected: selectedFields,
    popular: popularFields,
    unpopular: unpopularFields,
  } = useMemo(() => groupFields(fields, columns, popularLimit, fieldCounts, fieldFilterState), [
    fields,
    columns,
    popularLimit,
    fieldCounts,
    fieldFilterState,
  ]);

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

  const onDragEnd = useCallback(
    ({ source, destination }: DropResult) => {
      if (!source || !destination || !fields) return;

      // Rearranging fields within the selected fields list
      if (
        source.droppableId === 'SELECTED_FIELDS' &&
        destination.droppableId === 'SELECTED_FIELDS'
      ) {
        onReorderFields(source.index, destination.index);
        return;
      }
      // Dropping fields into the selected fields list
      if (
        source.droppableId !== 'SELECTED_FIELDS' &&
        destination.droppableId === 'SELECTED_FIELDS'
      ) {
        const fieldListMap = {
          POPULAR_FIELDS: popularFields,
          UNPOPULAR_FIELDS: unpopularFields,
        };
        const fieldList = fieldListMap[source.droppableId as keyof typeof fieldListMap];
        const field = fieldList[source.index];
        onAddField(field.name, destination.index);
        return;
      }
    },
    [fields, onAddField, onReorderFields, popularFields, unpopularFields]
  );

  if (!selectedIndexPattern || !fields) {
    return null;
  }

  return (
    <I18nProvider>
      <EuiDragDropContext onDragEnd={onDragEnd}>
        <EuiSplitPanel.Outer
          className="sidebar-list eui-yScroll"
          aria-label={i18n.translate(
            'discover.fieldChooser.filter.indexAndFieldsSectionAriaLabel',
            {
              defaultMessage: 'Index and fields',
            }
          )}
          borderRadius="none"
          color="transparent"
          hasBorder={false}
        >
          <EuiSplitPanel.Inner grow={false} paddingSize="s" className="dscSideBar_searchContainer">
            <DiscoverFieldSearch
              onChange={onChangeFieldSearch}
              value={fieldFilterState.name}
              types={fieldTypes}
              isEnhancementsEnabledOverride={isEnhancementsEnabledOverride}
            />
          </EuiSplitPanel.Inner>
          {displayIndexPatternCreation(selectedIndexPattern) ? (
            <EuiSplitPanel.Inner grow={false} paddingSize="s">
              <DiscoverFieldDataFrame
                onCreateIndexPattern={onCreateIndexPattern}
                onNormalizeIndexPattern={onNormalizeIndexPattern}
              />
            </EuiSplitPanel.Inner>
          ) : null}

          <EuiSplitPanel.Inner
            className="eui-yScroll dscSideBar_fieldListContainer"
            paddingSize="none"
          >
            {(fields.length > 0 || selectedIndexPattern.fieldsLoading) && (
              <>
                <FieldList
                  category="selected"
                  fields={selectedFields}
                  getDetailsByField={getDetailsByField}
                  shortDotsEnabled={shortDotsEnabled}
                  title={i18n.translate('discover.fieldChooser.filter.selectedFieldsTitle', {
                    defaultMessage: 'Selected fields',
                  })}
                  {...props}
                />
                {popularFields.length > 0 && (
                  <FieldList
                    category="popular"
                    fields={popularFields}
                    getDetailsByField={getDetailsByField}
                    shortDotsEnabled={shortDotsEnabled}
                    title={i18n.translate('discover.fieldChooser.filter.popularTitle', {
                      defaultMessage: 'Popular fields',
                    })}
                    {...props}
                  />
                )}
                <FieldList
                  category="unpopular"
                  fields={unpopularFields}
                  getDetailsByField={getDetailsByField}
                  shortDotsEnabled={shortDotsEnabled}
                  title={i18n.translate('discover.fieldChooser.filter.availableFieldsTitle', {
                    defaultMessage: 'Available fields',
                  })}
                  {...props}
                />
              </>
            )}
          </EuiSplitPanel.Inner>
        </EuiSplitPanel.Outer>
      </EuiDragDropContext>
    </I18nProvider>
  );
}

interface FieldGroupProps extends DiscoverSidebarProps {
  category: 'selected' | 'popular' | 'unpopular';
  title: string;
  fields: IndexPatternField[];
  getDetailsByField: (field: IndexPatternField) => FieldDetails;
  shortDotsEnabled: boolean;
}

const FieldList = ({
  category,
  title,
  fields,
  columns,
  selectedIndexPattern,
  onAddField,
  onRemoveField,
  onAddFilter,
  getDetailsByField,
  shortDotsEnabled,
}: FieldGroupProps) => {
  const [expanded, setExpanded] = useState(true);

  if (!selectedIndexPattern) return null;

  return (
    <>
      <EuiButtonEmpty
        iconSide="left"
        color="text"
        iconType={expanded ? 'arrowDown' : 'arrowRight'}
        onClick={() => setExpanded(!expanded)}
        size="xs"
        className="dscSideBar_fieldGroup"
        data-test-subj="dscSideBarFieldGroupButton"
        aria-label={title}
        isLoading={!!selectedIndexPattern.fieldsLoading}
      >
        {title}
      </EuiButtonEmpty>
      {expanded && (
        <EuiDroppable
          droppableId={`${category.toUpperCase()}_FIELDS`}
          spacing="l"
          data-test-subj={`fieldList-${category}`}
          cloneDraggables={category !== 'selected'}
        >
          {fields.map((field: IndexPatternField, index) => {
            return (
              <EuiDraggable
                spacing="m"
                key={`field${field.name}`}
                draggableId={field.name}
                index={index}
              >
                <EuiPanel
                  data-attr-field={field.name}
                  paddingSize="none"
                  hasBorder={false}
                  hasShadow={false}
                  color="transparent"
                  className="dscSidebar__item"
                  data-test-subj={`fieldList-field`}
                >
                  {/* The panel cannot exist in the DiscoverField component if the on focus highlight during keyboard navigation is needed */}
                  <DiscoverField
                    selected={category === 'selected'}
                    field={field}
                    columns={columns}
                    indexPattern={selectedIndexPattern}
                    onAddField={onAddField}
                    onRemoveField={onRemoveField}
                    onAddFilter={onAddFilter}
                    getDetails={getDetailsByField}
                    useShortDots={shortDotsEnabled}
                  />
                </EuiPanel>
              </EuiDraggable>
            );
          })}
        </EuiDroppable>
      )}
    </>
  );
};
