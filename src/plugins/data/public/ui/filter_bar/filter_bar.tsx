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

import { i18n } from '@osd/i18n';
import {
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPopover,
  EuiResizeObserver,
  EuiText,
} from '@elastic/eui';
import { FormattedMessage, InjectedIntl, injectI18n } from '@osd/i18n/react';
import classNames from 'classnames';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { stringify } from '@osd/std';

import { FilterEditor } from './filter_editor';
import { FilterItem } from './filter_item';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { IIndexPattern } from '../..';
import { buildEmptyFilter, Filter, UI_SETTINGS } from '../../../common';
import { FilterOptions } from './filter_options';

interface Props {
  filters: Filter[];
  onFiltersUpdated?: (filters: Filter[]) => void;
  className: string;
  indexPatterns: IIndexPattern[];
  intl: InjectedIntl;
  isFilterBarPortable?: boolean;
}

const maxFilterWidth = 600;

function FilterBarUI(props: Props) {
  const [isAddFilterPopoverOpen, setIsAddFilterPopoverOpen] = useState(false);
  const opensearchDashboards = useOpenSearchDashboards();
  const [filterWidth, setFilterWidth] = useState(maxFilterWidth);

  const uiSettings = opensearchDashboards.services.uiSettings;
  const useNewHeader = Boolean(uiSettings!.get(UI_SETTINGS.NEW_HOME_PAGE));
  if (!uiSettings) return null;

  function onFiltersUpdated(filters: Filter[]) {
    if (props.onFiltersUpdated) {
      props.onFiltersUpdated(filters);
    }
  }

  function renderItems() {
    return props.filters.map((filter, i) => (
      <EuiFlexItem
        key={i}
        grow={false}
        className="globalFilterBar__flexItem"
        data-test-subj="globalFilterBar"
      >
        <FilterItem
          id={`${i}`}
          intl={props.intl}
          filter={filter}
          onUpdate={(newFilter) => onUpdate(i, newFilter)}
          onRemove={() => onRemove(i)}
          indexPatterns={props.indexPatterns}
          uiSettings={uiSettings!}
        />
      </EuiFlexItem>
    ));
  }

  function onResize(dimensions: { height: number; width: number }) {
    setFilterWidth(dimensions.width);
  }

  function renderAddFilter() {
    const isPinned = uiSettings!.get(UI_SETTINGS.FILTERS_PINNED_BY_DEFAULT);
    const [indexPattern] = props.indexPatterns;
    const index = indexPattern && indexPattern.id;
    const newFilter = buildEmptyFilter(isPinned, index);

    const button = (
      <EuiButtonEmpty
        size="s"
        onClick={() => setIsAddFilterPopoverOpen(true)}
        data-test-subj="addFilter"
        aria-label={i18n.translate('data.filter.filterBar.addFilterButtonLabel', {
          defaultMessage: 'Add filter',
        })}
        className="globalFilterBar__addButton"
        iconType="plusInCircle"
      >
        <FormattedMessage
          id="data.filter.filterBar.addFilterButtonLabel"
          defaultMessage="Add filter"
        />
      </EuiButtonEmpty>
    );

    return (
      <EuiFlexItem grow={false}>
        <EuiPopover
          id="addFilterPopover"
          button={button}
          isOpen={isAddFilterPopoverOpen}
          closePopover={() => setIsAddFilterPopoverOpen(false)}
          anchorPosition="downLeft"
          panelPaddingSize="none"
          ownFocus={true}
          initialFocus=".globalFilterEditor__fieldInput input"
          repositionOnScroll
        >
          <EuiResizeObserver onResize={onResize}>
            {(resizeRef) => (
              <div style={{ width: maxFilterWidth, maxWidth: '100%' }} ref={resizeRef}>
                <EuiFlexItem style={{ width: filterWidth }} grow={false}>
                  <FilterEditor
                    filter={newFilter}
                    indexPatterns={props.indexPatterns}
                    onSubmit={onAdd}
                    onCancel={() => setIsAddFilterPopoverOpen(false)}
                    key={stringify(newFilter)}
                  />
                </EuiFlexItem>
              </div>
            )}
          </EuiResizeObserver>
        </EuiPopover>
      </EuiFlexItem>
    );
  }

  function onAdd(filter: Filter) {
    setIsAddFilterPopoverOpen(false);
    const filters = [...props.filters, filter];
    onFiltersUpdated(filters);
  }

  function onRemove(i: number) {
    const filters = [...props.filters];
    filters.splice(i, 1);
    onFiltersUpdated(filters);
  }

  function onUpdate(i: number, filter: Filter) {
    const filters = [...props.filters];
    filters[i] = filter;
    onFiltersUpdated(filters);
  }

  const classes = classNames('globalFilterBar', props.className);
  const filterBarPrefixText = i18n.translate('data.search.filterBar.filterBarPrefixText', {
    defaultMessage: 'Filters',
  });
  const filterGroupClassName = classNames('globalFilterGroup', {
    'globalFilterGroup--compressed': useNewHeader && props.isFilterBarPortable,
  });

  const filterBar = (
    <EuiFlexGroup
      className={filterGroupClassName}
      gutterSize="none"
      alignItems="flexStart"
      responsive={false}
      data-test-subj="globalFilterGroup"
    >
      <EuiFlexItem className="globalFilterGroup__branch" grow={false}>
        {useNewHeader ? (
          <EuiText
            size="s"
            className="globalFilterGroup__filterPrefix"
            data-test-subj="globalFilterGroupFilterPrefix"
          >
            {filterBarPrefixText}:
          </EuiText>
        ) : (
          <FilterOptions
            filters={props.filters!}
            onFiltersUpdated={props.onFiltersUpdated}
            intl={props.intl}
            indexPatterns={props.indexPatterns}
          />
        )}
      </EuiFlexItem>
      <EuiFlexItem
        className="globalFilterGroup__filterFlexItem"
        data-test-subj="globalFilterGroupFilterFlexItem"
      >
        <EuiFlexGroup
          className={classes}
          wrap={true}
          responsive={false}
          gutterSize="xs"
          alignItems="center"
        >
          {renderItems()}
          {renderAddFilter()}
        </EuiFlexGroup>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
  return useNewHeader && props.isFilterBarPortable
    ? createPortal(filterBar, document.getElementById('applicationHeaderFilterBar')!)
    : filterBar;
}

export const FilterBar = injectI18n(FilterBarUI);
