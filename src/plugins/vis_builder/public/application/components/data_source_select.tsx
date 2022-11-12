/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiIcon } from '@elastic/eui';
import { SearchableDropdown, SearchableDropdownOption } from './searchable_dropdown';
import { useIndexPatterns } from '../utils/use';
import { useTypedDispatch } from '../utils/state_management';
import { setIndexPattern } from '../utils/state_management/visualization_slice';
import { IndexPattern } from '../../../../data/public';

function indexPatternEquality(A?: SearchableDropdownOption, B?: SearchableDropdownOption): boolean {
  return !A || !B ? false : A.id === B.id;
}

function toSearchableDropdownOption(indexPattern: IndexPattern): SearchableDropdownOption {
  return {
    id: indexPattern.id || '',
    label: indexPattern.title,
    searchableLabel: indexPattern.title,
    prepend: <EuiIcon type="indexPatternApp" />,
  };
}

export const DataSourceSelect = () => {
  const { indexPatterns, loading, error, selected } = useIndexPatterns();
  const dispatch = useTypedDispatch();

  // TODO: Should be a standard EUI component
  return (
    <SearchableDropdown
      selected={selected !== undefined ? toSearchableDropdownOption(selected) : undefined}
      onChange={(option) => {
        const foundOption = indexPatterns.filter((s) => s.id === option.id)[0];
        if (foundOption !== undefined && typeof foundOption.id === 'string') {
          dispatch(setIndexPattern(foundOption.id));
        }
      }}
      prepend={i18n.translate('visBuilder.nav.dataSource.selector.title', {
        defaultMessage: 'Data Source',
      })}
      error={error}
      loading={loading}
      options={indexPatterns.map(toSearchableDropdownOption)}
      equality={indexPatternEquality}
    />
  );
};
