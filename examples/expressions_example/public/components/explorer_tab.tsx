/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiCallOut,
  EuiFieldSearch,
  EuiFlexGroup,
  EuiFlexItem,
  EuiForm,
  EuiFormRow,
  EuiSelect,
  EuiSpacer,
  EuiBasicTable,
  EuiButtonIcon,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import React, { useMemo, useState } from 'react';
import { RIGHT_ALIGNMENT } from '@elastic/eui/lib/services';
import { useOpenSearchDashboards } from '../../../../src/plugins/opensearch_dashboards_react/public';
import { ExpressionsExampleServices } from '../types';
import { ExplorerSection } from './explorer_section';

interface ExpressionFunctionItem {
  name: string;
  type: string;
  help: string;
}

export function ExplorerTab() {
  const {
    services: { expressions },
  } = useOpenSearchDashboards<ExpressionsExampleServices>();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [itemIdToExpandedRowMap, setItemIdToExpandedRowMap] = useState({});

  const functions = expressions.getFunctions();

  const types = useMemo(() => {
    const allTypes = new Set(Object.values(functions).map((fn) => fn.type));

    // Catch all filter and remove
    allTypes.add('all');

    return [...allTypes].map((type) => ({ text: type }));
  }, [functions]);

  const items = useMemo<ExpressionFunctionItem[]>(
    () =>
      Object.values(functions)
        .filter((fn) => fn.name.includes(search))
        .filter((fn) => (filter === 'all' ? true : fn.type === filter))
        .map((fn) => ({
          name: fn.name,
          type: fn.type,
          help: fn.help,
        })),
    [filter, functions, search]
  );

  const toggleDetails = (item: ExpressionFunctionItem) => {
    const { name: id } = item;
    const itemIdToExpandedRowMapValues = { ...itemIdToExpandedRowMap };
    if (itemIdToExpandedRowMapValues[id]) {
      delete itemIdToExpandedRowMapValues[id];
    } else {
      itemIdToExpandedRowMapValues[id] = <ExplorerSection fn={functions[id]} />;
    }
    setItemIdToExpandedRowMap(itemIdToExpandedRowMapValues);
  };

  return (
    <>
      <EuiSpacer />
      <EuiCallOut
        title={i18n.translate('expressionsExample.tab.explorer.title', {
          defaultMessage: 'Expression Explorer',
        })}
        iconType="gear"
      >
        <FormattedMessage
          id="expressionsExample.tab.explorer.description"
          defaultMessage="Finding the registered expressions and their properties can be tedious sometimes. Use this explorer to find out the regitered expressions and their properties"
        />
      </EuiCallOut>
      <EuiSpacer />

      <EuiForm>
        <EuiFlexGroup>
          <EuiFlexItem grow={false}>
            <EuiFormRow
              label={i18n.translate('expressionsExample.tab.explorer.searchLabel', {
                defaultMessage: 'Search',
              })}
            >
              <EuiFieldSearch
                value={search}
                isClearable
                onChange={(e) => setSearch(e.target.value)}
              />
            </EuiFormRow>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiFormRow
              label={i18n.translate('expressionsExample.tab.explorer.filter', {
                defaultMessage: 'Filter',
              })}
            >
              <EuiSelect
                options={types}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </EuiFormRow>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiForm>
      <EuiSpacer />

      <EuiBasicTable
        itemId="name"
        itemIdToExpandedRowMap={itemIdToExpandedRowMap}
        isExpandable={true}
        columns={[
          {
            field: 'name',
            name: 'Name',
            sortable: true,
          },
          {
            field: 'type',
            name: 'Type',
            sortable: true,
          },
          {
            field: 'help',
            name: 'Help',
            truncateText: true,
          },
          {
            align: RIGHT_ALIGNMENT,
            width: '40px',
            isExpander: true,
            render: (item) => (
              <EuiButtonIcon
                onClick={() => toggleDetails(item)}
                aria-label={itemIdToExpandedRowMap[item.name] ? 'Collapse' : 'Expand'}
                iconType={itemIdToExpandedRowMap[item.name] ? 'arrowUp' : 'arrowDown'}
              />
            ),
          },
        ]}
        items={items}
      />

      {/* {sections} */}
    </>
  );
}
