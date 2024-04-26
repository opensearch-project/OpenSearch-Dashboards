/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiFieldSearch, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { setSearchField } from '../../utils/state_management/visualization_slice';
import { useTypedDispatch } from '../../utils/state_management';

export interface Props {
  /**
   * the input value of the user
   */
  value?: string;
}

/**
 * Component is VisBuilder's side bar to  search of available fields
 * Additionally there's a button displayed that allows the user to show/hide more filter fields
 */
export function FieldSearch({ value }: Props) {
  const searchPlaceholder = i18n.translate('visBuilder.fieldChooser.searchPlaceHolder', {
    defaultMessage: 'Search field names',
  });

  const dispatch = useTypedDispatch();

  return (
    <React.Fragment>
      <EuiFlexGroup responsive={false} gutterSize={'s'}>
        <EuiFlexItem>
          <EuiFieldSearch
            aria-label={searchPlaceholder}
            data-test-subj="fieldFilterSearchInput"
            compressed
            fullWidth
            onChange={(event) => dispatch(setSearchField(event.currentTarget.value))}
            placeholder={searchPlaceholder}
            value={value}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    </React.Fragment>
  );
}
