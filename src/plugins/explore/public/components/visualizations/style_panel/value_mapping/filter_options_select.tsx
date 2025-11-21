/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { EuiFormRow, EuiSelect } from '@elastic/eui';
import React from 'react';
import { FilterOption } from '../../types';

export const FilterOptionsSelect = ({
  filterOption,
  onFilterOptionChange,
  disableSelect = false,
}: {
  filterOption: FilterOption | undefined;
  onFilterOptionChange?: (option: FilterOption | undefined) => void;
  disableSelect?: boolean;
}) => {
  return (
    <EuiFormRow
      label={i18n.translate('explore.vis.valueMapping.filterOptions', {
        defaultMessage: 'Filter Options',
      })}
    >
      <EuiSelect
        compressed
        value={filterOption ? filterOption : 'filterAll'}
        onChange={(e) => onFilterOptionChange?.(e.target.value as FilterOption)}
        onMouseUp={(e) => e.stopPropagation()}
        disabled={disableSelect}
        options={[
          {
            value: 'filterAll',
            text: i18n.translate('explore.vis.valueMapping.filterAll', {
              defaultMessage: 'Use value mappings',
            }),
          },
          {
            value: 'filterButKeepOpposite',
            text: i18n.translate('explore.vis.valueMapping.filterButKeepOpposite', {
              defaultMessage: 'Highlight value mappings',
            }),
          },
          {
            value: 'none',
            text: i18n.translate('explore.vis.valueMapping.none', {
              defaultMessage: 'None',
            }),
          },
        ]}
      />
    </EuiFormRow>
  );
};
