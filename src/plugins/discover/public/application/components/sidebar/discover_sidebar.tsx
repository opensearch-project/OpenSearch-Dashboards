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

import './discover_sidebar.scss';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiTitle,
  EuiDragDropContext,
  DropResult,
  EuiDroppable,
  EuiDraggable,
  EuiPanel,
  EuiSplitPanel,
} from '@elastic/eui';
import { FormattedMessage, I18nProvider } from '@osd/i18n/react';
import { DiscoverField } from './discover_field';
import { DiscoverFieldSearch } from './discover_field_search';
import { FIELDS_LIMIT_SETTING } from '../../../../common';
import { groupFields } from './lib/group_fields';
import { IndexPatternField, IndexPattern, UI_SETTINGS } from '../../../../../data/public';
import { getDetails } from './lib/get_details';
import { getDefaultFieldFilter, setFieldFilterProp } from './lib/field_filter';
import { getIndexPatternFieldList } from './lib/get_index_pattern_field_list';
import { getServices } from '../../../opensearch_dashboards_services';

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
   * Currently selected index pattern
   */
  selectedIndexPattern?: IndexPattern;
}

export function DiscoverSidebar({
  columns,
  fieldCounts,
  hits,
  onAddField,
  onAddFilter,
  onRemoveField,
  onReorderFields,
  selectedIndexPattern,
}: DiscoverSidebarProps) {
  const [fields, setFields] = useState<IndexPatternField[] | null>(null);
  const [fieldFilterState, setFieldFilterState] = useState(getDefaultFieldFilter());
  const services = useMemo(() => getServices(), []);

  useEffect(() => {
    const newFields = getIndexPatternFieldList(selectedIndexPattern, fieldCounts);
    setFields(newFields);
  }, [selectedIndexPattern, fieldCounts, hits, services]);

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
  const useShortDots = services.uiSettings.get(UI_SETTINGS.SHORT_DOTS_ENABLE);

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
        >
          <EuiSplitPanel.Inner grow={false} paddingSize="s">
            <DiscoverFieldSearch
              onChange={onChangeFieldSearch}
              value={fieldFilterState.name}
              types={fieldTypes}
            />
          </EuiSplitPanel.Inner>
          <EuiSplitPanel.Inner className="eui-yScroll" paddingSize="none">
            {fields.length > 0 && (
              <>
                <EuiTitle size="xxxs" id="selected_fields" className="dscSideBarFieldListHeader">
                  <h3>
                    <FormattedMessage
                      id="discover.fieldChooser.filter.selectedFieldsTitle"
                      defaultMessage="Selected fields"
                    />
                  </h3>
                </EuiTitle>
                <EuiDroppable
                  droppableId="SELECTED_FIELDS"
                  spacing="m"
                  data-test-subj={`fieldList-selected`}
                >
                  {selectedFields.map((field: IndexPatternField, index) => {
                    return (
                      <EuiDraggable
                        spacing="m"
                        key={`field${field.name}`}
                        draggableId={field.name}
                        index={index}
                      >
                        <EuiPanel
                          data-attr-field={field.name}
                          paddingSize="s"
                          className="dscSidebar__item"
                          data-test-subj={`fieldList-field`}
                        >
                          {/* The panel cannot exist in the DiscoverField component if the on focus highlight during keyboard navigation is needed */}
                          <DiscoverField
                            field={field}
                            selected
                            onAddField={onAddField}
                            onRemoveField={onRemoveField}
                            columns={columns}
                            indexPattern={selectedIndexPattern}
                            getDetails={getDetailsByField}
                            useShortDots={useShortDots}
                            onAddFilter={onAddFilter}
                          />
                        </EuiPanel>
                      </EuiDraggable>
                    );
                  })}
                </EuiDroppable>
                <EuiTitle size="xxxs" id="available_fields" className="dscSideBarFieldListHeader">
                  <h3>
                    <FormattedMessage
                      id="discover.fieldChooser.filter.availableFieldsTitle"
                      defaultMessage="Available fields"
                    />
                  </h3>
                </EuiTitle>

                {popularFields.length > 0 && (
                  <EuiPanel
                    hasBorder={false}
                    paddingSize="none"
                    hasShadow={false}
                    className={`dscFieldList dscFieldList--popular`}
                    aria-labelledby="available_fields available_fields_popular"
                    data-test-subj={`fieldList-popular`}
                    color="primary"
                  >
                    <EuiTitle size="xxxs" className="dscSideBarFieldListHeader">
                      <h4 style={{ fontWeight: 'normal' }} id="available_fields_popular">
                        <FormattedMessage
                          id="discover.fieldChooser.filter.popularTitle"
                          defaultMessage="Popular"
                        />
                      </h4>
                    </EuiTitle>
                    <EuiDroppable droppableId="POPULAR_FIELDS" spacing="m" cloneDraggables={true}>
                      {popularFields.map((field: IndexPatternField, index) => {
                        return (
                          <EuiDraggable
                            spacing="m"
                            key={`field${field.name}`}
                            draggableId={field.name}
                            index={index}
                          >
                            <EuiPanel
                              data-attr-field={field.name}
                              paddingSize="s"
                              className="dscSidebar__item"
                              data-test-subj={`fieldList-field`}
                            >
                              {/* The panel cannot exist in the DiscoverField component if the on focus highlight during keyboard navigation is needed */}
                              <DiscoverField
                                columns={columns}
                                field={field}
                                indexPattern={selectedIndexPattern}
                                onAddField={onAddField}
                                onRemoveField={onRemoveField}
                                onAddFilter={onAddFilter}
                                getDetails={getDetailsByField}
                                useShortDots={useShortDots}
                              />
                            </EuiPanel>
                          </EuiDraggable>
                        );
                      })}
                    </EuiDroppable>
                  </EuiPanel>
                )}
                <EuiDroppable
                  droppableId="UNPOPULAR_FIELDS"
                  spacing="m"
                  cloneDraggables={true}
                  className="dscFieldList dscFieldList--unpopular"
                  aria-labelledby="available_fields"
                  data-test-subj="fieldList-unpopular"
                >
                  {unpopularFields.map((field: IndexPatternField, index) => {
                    return (
                      <EuiDraggable
                        spacing="m"
                        key={`field${field.name}`}
                        draggableId={field.name}
                        index={index}
                      >
                        <EuiPanel
                          data-attr-field={field.name}
                          paddingSize="s"
                          className="dscSidebar__item"
                          data-test-subj={`fieldList-field`}
                        >
                          {/* The panel cannot exist in the DiscoverField component if the on focus highlight during keyboard navigation is needed */}
                          <DiscoverField
                            columns={columns}
                            field={field}
                            indexPattern={selectedIndexPattern}
                            onAddField={onAddField}
                            onRemoveField={onRemoveField}
                            onAddFilter={onAddFilter}
                            getDetails={getDetailsByField}
                            useShortDots={useShortDots}
                          />
                        </EuiPanel>
                      </EuiDraggable>
                    );
                  })}
                </EuiDroppable>
              </>
            )}
          </EuiSplitPanel.Inner>
        </EuiSplitPanel.Outer>
      </EuiDragDropContext>
    </I18nProvider>
  );
}
