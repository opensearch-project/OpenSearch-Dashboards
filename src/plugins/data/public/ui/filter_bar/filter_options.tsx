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
  EuiContextMenu,
  EuiPopover,
  EuiToolTip,
  EuiFlexItem,
  EuiSmallButtonEmpty,
  EuiIcon,
  EuiResizeObserver,
  EuiContextMenuPanelItemDescriptor,
  EuiContextMenuPanel,
  EuiContextMenuPanelDescriptor,
} from '@elastic/eui';
import { stringify } from '@osd/std';
import { InjectedIntl, injectI18n } from '@osd/i18n/react';
import { i18n } from '@osd/i18n';
import React from 'react';
import {
  buildEmptyFilter,
  Filter,
  enableFilter,
  disableFilter,
  pinFilter,
  toggleFilterDisabled,
  toggleFilterNegated,
  unpinFilter,
  UI_SETTINGS,
  IIndexPattern,
} from '../../../common';
import { FilterEditor } from './filter_editor';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { SavedQueryManagementComponent } from '../saved_query_management';
import { SavedQuery, SavedQueryService } from '../../query';
import { SavedQueryMeta } from '../saved_query_form';
import { getUseNewSavedQueriesUI } from '../../services';

interface Props {
  intl: InjectedIntl;
  filters: Filter[];
  indexPatterns: IIndexPattern[];
  savedQueryService: SavedQueryService;
  // Show when user has privileges to save
  showSaveQuery?: boolean;
  onInitiateSave: () => void;
  onInitiateSaveAsNew: () => void;
  onLoad: (savedQuery: SavedQuery) => void;
  onClearSavedQuery: () => void;
  onFiltersUpdated?: (filters: Filter[]) => void;
  loadedSavedQuery?: SavedQuery;
  useSaveQueryMenu: boolean;
  isQueryEditorControl: boolean;
  saveQuery: (savedQueryMeta: SavedQueryMeta, saveAsNew?: boolean) => Promise<void>;
}
const maxFilterWidth = 600;

const FilterOptionsUI = (props: Props) => {
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
  const [renderedComponent, setRenderedComponent] = React.useState('menu');
  const [filterWidth, setFilterWidth] = React.useState(maxFilterWidth);
  const opensearchDashboards = useOpenSearchDashboards();
  const uiSettings = opensearchDashboards.services.uiSettings;
  const isPinned = uiSettings!.get(UI_SETTINGS.FILTERS_PINNED_BY_DEFAULT);
  const useNewHeader = Boolean(uiSettings!.get(UI_SETTINGS.NEW_HOME_PAGE));
  const index = Array.isArray(props.indexPatterns) ? props.indexPatterns[0]?.id : undefined;
  const newFilter = buildEmptyFilter(isPinned, index);

  const togglePopover = () => {
    setRenderedComponent('menu');
    setIsPopoverOpen((prevState) => !prevState);
  };

  const closePopover = () => {
    setIsPopoverOpen(false);
  };

  function onFiltersUpdated(filters: Filter[]) {
    if (props.onFiltersUpdated) {
      props.onFiltersUpdated(filters);
    }
  }

  function onEnableAll() {
    const filters = props.filters.map(enableFilter);
    onFiltersUpdated(filters);
  }

  function onDisableAll() {
    const filters = props.filters.map(disableFilter);
    onFiltersUpdated(filters);
  }

  function onPinAll() {
    const filters = props.filters.map(pinFilter);
    onFiltersUpdated(filters);
  }

  function onUnpinAll() {
    const filters = props.filters.map(unpinFilter);
    onFiltersUpdated(filters);
  }

  function onToggleAllNegated() {
    const filters = props.filters.map(toggleFilterNegated);
    onFiltersUpdated(filters);
  }

  function onToggleAllDisabled() {
    const filters = props.filters.map(toggleFilterDisabled);
    onFiltersUpdated(filters);
  }

  function onRemoveAll() {
    onFiltersUpdated([]);
  }

  function onAdd(filter: Filter) {
    setIsPopoverOpen(false);
    const filters = [...props.filters, filter];
    onFiltersUpdated(filters);
  }

  function onResize(dimensions: { height: number; width: number }) {
    setFilterWidth(dimensions.width);
  }

  const addFilterPanelItem: EuiContextMenuPanelItemDescriptor = {
    name: props.intl.formatMessage({
      id: 'data.filter.options.addFiltersButtonLabel',
      defaultMessage: 'Add filters',
    }),
    icon: 'plusInCircle',
    onClick: () => {
      setRenderedComponent('addFilter');
    },
    'data-test-subj': 'addFilters',
    disabled: false,
  };

  const savedQueriesPanelItem: EuiContextMenuPanelItemDescriptor = {
    name: props.intl.formatMessage({
      id: 'data.filter.options.savedQueriesButtonLabel',
      defaultMessage: 'Saved queries',
    }),
    icon: 'folderOpen',
    onClick: () => {
      setRenderedComponent('saveQuery');
    },
    'data-test-subj': 'savedQueries',
    disabled: false,
  };

  const menuOptionsSeparator: EuiContextMenuPanelItemDescriptor = {
    isSeparator: true,
    key: 'sep',
  };

  const disableMenuOption = props.filters.length === 0 && useNewHeader;

  const panelTree: EuiContextMenuPanelDescriptor[] = [
    {
      id: 0,
      title: 'Filters',
      items: [
        {
          name: props.intl.formatMessage({
            id: 'data.filter.options.enableAllFiltersButtonLabel',
            defaultMessage: 'Enable all',
          }),
          icon: 'eye',
          onClick: () => {
            closePopover();
            onEnableAll();
          },
          'data-test-subj': 'enableAllFilters',
          disabled: disableMenuOption,
        },
        {
          name: props.intl.formatMessage({
            id: 'data.filter.options.disableAllFiltersButtonLabel',
            defaultMessage: 'Disable all',
          }),
          icon: 'eyeClosed',
          onClick: () => {
            closePopover();
            onDisableAll();
          },
          'data-test-subj': 'disableAllFilters',
          disabled: disableMenuOption,
        },
        {
          name: props.intl.formatMessage({
            id: 'data.filter.options.pinAllFiltersButtonLabel',
            defaultMessage: 'Pin all',
          }),
          icon: 'pin',
          onClick: () => {
            closePopover();
            onPinAll();
          },
          'data-test-subj': 'pinAllFilters',
          disabled: disableMenuOption,
        },
        {
          name: props.intl.formatMessage({
            id: 'data.filter.options.unpinAllFiltersButtonLabel',
            defaultMessage: 'Unpin all',
          }),
          icon: 'pin',
          onClick: () => {
            closePopover();
            onUnpinAll();
          },
          'data-test-subj': 'unpinAllFilters',
          disabled: disableMenuOption,
        },
        {
          name: props.intl.formatMessage({
            id: 'data.filter.options.invertNegatedFiltersButtonLabel',
            defaultMessage: 'Invert inclusion',
          }),
          icon: 'invert',
          onClick: () => {
            closePopover();
            onToggleAllNegated();
          },
          'data-test-subj': 'invertInclusionAllFilters',
          disabled: disableMenuOption,
        },
        {
          name: props.intl.formatMessage({
            id: 'data.filter.options.invertDisabledFiltersButtonLabel',
            defaultMessage: 'Invert enabled/disabled',
          }),
          icon: 'eye',
          onClick: () => {
            closePopover();
            onToggleAllDisabled();
          },
          'data-test-subj': 'invertEnableDisableAllFilters',
          disabled: disableMenuOption,
        },
        {
          name: props.intl.formatMessage({
            id: 'data.filter.options.deleteAllFiltersButtonLabel',
            defaultMessage: 'Remove all',
          }),
          icon: 'trash',
          onClick: () => {
            closePopover();
            onRemoveAll();
          },
          'data-test-subj': 'removeAllFilters',
          disabled: disableMenuOption,
          className: useNewHeader ? 'globalFilterGroup__removeAllFilters' : '',
        },
      ],
    },
  ];

  const handleSave = () => {
    if (props.onInitiateSave) {
      props.onInitiateSave();
    }
    setIsPopoverOpen(false);
  };

  const saveQueryPanel = (
    <EuiContextMenuPanel
      items={[
        <SavedQueryManagementComponent
          showSaveQuery={props.showSaveQuery}
          loadedSavedQuery={props.loadedSavedQuery}
          onInitiateSave={handleSave}
          onInitiateSaveAsNew={props.onInitiateSaveAsNew!}
          onLoad={props.onLoad!}
          savedQueryService={props.savedQueryService!}
          onClearSavedQuery={props.onClearSavedQuery!}
          closeMenuPopover={() => {
            setIsPopoverOpen(false);
          }}
          key={'savedQueryManagement'}
          useNewSavedQueryUI={getUseNewSavedQueriesUI()}
          saveQuery={props.saveQuery}
        />,
      ]}
      data-test-subj="save-query-panel"
    />
  );

  const menuPanel = (
    <EuiContextMenu
      initialPanelId={0}
      panels={panelTree}
      size="s"
      data-test-subj="filter-options-menu-panel"
    />
  );
  const addFilterPanel = (
    <EuiContextMenuPanel
      items={[
        <EuiResizeObserver onResize={onResize} key={'filter-option-resize'}>
          {(resizeRef) => (
            <div style={{ width: maxFilterWidth, maxWidth: '100%' }} ref={resizeRef}>
              <EuiFlexItem style={{ width: filterWidth }} grow={false}>
                <FilterEditor
                  filter={newFilter}
                  indexPatterns={props.indexPatterns}
                  onSubmit={onAdd}
                  onCancel={() => setIsPopoverOpen(false)}
                  key={stringify(newFilter)}
                />
              </EuiFlexItem>
            </div>
          )}
        </EuiResizeObserver>,
      ]}
      data-test-subj="add-filter-panel"
    />
  );
  const renderComponent = () => {
    switch (renderedComponent) {
      case 'menu':
        return menuPanel;
      case 'addFilter':
        return addFilterPanel;
      case 'saveQuery':
        return saveQueryPanel;
    }
  };

  if (useNewHeader) {
    panelTree[0].items?.unshift(addFilterPanelItem);
    panelTree[0].items?.push(menuOptionsSeparator);
    panelTree[0].items?.push(savedQueriesPanelItem);
    panelTree[0].title = '';
  }

  const label = i18n.translate('data.search.searchBar.savedQueryPopoverButtonText', {
    defaultMessage: 'See saved queries',
  });

  const iconForQueryEditorControlPopoverBtn = getUseNewSavedQueriesUI()
    ? 'boxesHorizontal'
    : 'folderOpen';

  const savedQueryPopoverButton = (
    <EuiSmallButtonEmpty
      onClick={togglePopover}
      aria-label={label}
      data-test-subj="saved-query-management-popover-button"
      className="osdSavedQueryManagement__popoverButton"
      title={label}
    >
      <EuiIcon
        type={props.isQueryEditorControl ? iconForQueryEditorControlPopoverBtn : 'save'}
        className="euiQuickSelectPopover__buttonText"
      />
    </EuiSmallButtonEmpty>
  );

  const filterPopoverButton = (
    <EuiToolTip
      content={props.intl.formatMessage({
        id: 'data.filter.options.changeAllFiltersButtonLabel',
        defaultMessage: 'Change all filters',
      })}
      delay="long"
      position="bottom"
    >
      <EuiSmallButtonEmpty
        onClick={togglePopover}
        aria-label={props.intl.formatMessage({
          id: 'data.filter.options.changeAllFiltersButtonLabel',
          defaultMessage: 'Change all filters',
        })}
        data-test-subj="showFilterActions"
      >
        <EuiIcon type="filter" className="euiQuickSelectPopover__buttonText" />
        {useNewHeader && <EuiIcon type="arrowDown" />}
      </EuiSmallButtonEmpty>
    </EuiToolTip>
  );

  if (props.isQueryEditorControl) {
    return (
      <EuiPopover
        id="popoverForAllFilters"
        isOpen={isPopoverOpen}
        closePopover={closePopover}
        button={savedQueryPopoverButton}
        anchorPosition="downLeft"
        panelPaddingSize="none"
        ownFocus
        buffer={-8}
        repositionOnScroll
      >
        {saveQueryPanel}
      </EuiPopover>
    );
  }

  return (
    <EuiPopover
      id="popoverForAllFilters"
      className={useNewHeader ? 'globalFilterGroup__allFiltersPopover' : undefined}
      isOpen={isPopoverOpen}
      closePopover={closePopover}
      button={props.useSaveQueryMenu ? savedQueryPopoverButton : filterPopoverButton}
      anchorPosition="downLeft"
      panelPaddingSize="none"
      ownFocus
      buffer={-8}
      repositionOnScroll
    >
      {useNewHeader ? renderComponent() : props.useSaveQueryMenu ? saveQueryPanel : menuPanel}
    </EuiPopover>
  );
};

export const FilterOptions = injectI18n(FilterOptionsUI);
