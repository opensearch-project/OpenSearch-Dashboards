/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiDataGridColumnCellActionProps } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { IndexPatternField } from '../../../../../data/common';
import { useDataGridContext } from './data_grid_table_context';

export function getCellActions(field: IndexPatternField) {
  const cellActions = field.filterable
    ? [
        ({ rowIndex, columnId, Component }: EuiDataGridColumnCellActionProps) => {
          const { indexPattern, rows, onFilter } = useDataGridContext();

          const filterForValueText = i18n.translate('discover.filterForValue', {
            defaultMessage: 'Filter for value',
          });
          const filterForValueLabel = i18n.translate('discover.filterForValueLabel', {
            defaultMessage: 'Filter for value: {value}',
            values: { value: columnId },
          });

          return (
            <Component
              onClick={() => {
                const row = rows[rowIndex];
                const flattened = indexPattern.flattenHit(row);

                if (flattened) {
                  onFilter(columnId, flattened[columnId], '+');
                }
              }}
              iconType="plusInCircle"
              aria-label={filterForValueLabel}
              data-test-subj="filterForValue"
            >
              {filterForValueText}
            </Component>
          );
        },
        ({ rowIndex, columnId, Component }: EuiDataGridColumnCellActionProps) => {
          const { indexPattern, rows, onFilter } = useDataGridContext();

          const filterOutValueText = i18n.translate('discover.filterOutValue', {
            defaultMessage: 'Filter out value',
          });
          const filterOutValueLabel = i18n.translate('discover.filterOutValueLabel', {
            defaultMessage: 'Filter out value: {value}',
            values: { value: columnId },
          });

          return (
            <Component
              onClick={() => {
                const row = rows[rowIndex];
                const flattened = indexPattern.flattenHit(row);

                if (flattened) {
                  onFilter(columnId, flattened[columnId], '-');
                }
              }}
              iconType="minusInCircle"
              aria-label={filterOutValueLabel}
              data-test-subj="filterOutValue"
            >
              {filterOutValueText}
            </Component>
          );
        },
      ]
    : undefined;
  return cellActions;
}
