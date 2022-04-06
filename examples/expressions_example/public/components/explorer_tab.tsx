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
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import React, { useMemo, useState } from 'react';
import { useOpenSearchDashboards } from '../../../../src/plugins/opensearch_dashboards_react/public';
import { ExpressionsExampleServices } from '../types';
import { ExplorerSection } from './explorer_section';

export function ExplorerTab() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const {
    services: { expressions },
  } = useOpenSearchDashboards<ExpressionsExampleServices>();

  const functions = expressions.getFunctions();

  const sections = useMemo(
    () =>
      Object.values(functions)
        .filter((fn) => fn.name.includes(search))
        .filter((fn) => (filter === 'all' ? true : fn.type === filter))
        .map((fn) => <ExplorerSection key={fn.name} fn={fn} />),
    [filter, functions, search]
  );

  const types = useMemo(() => {
    const allTypes = new Set(Object.values(functions).map((fn) => fn.type));

    // Catch all filter and remove
    allTypes.delete(undefined);
    allTypes.add('all');

    return [...allTypes].map((type) => ({ text: type }));
  }, [functions]);

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

      {sections}
    </>
  );
}
