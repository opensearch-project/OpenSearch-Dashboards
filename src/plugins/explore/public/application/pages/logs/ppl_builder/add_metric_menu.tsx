/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { i18n } from '@osd/i18n';
import { EuiButtonEmpty, EuiButtonIcon, EuiToolTip } from '@elastic/eui';
import { AggFn } from './types';
import { AGG_FUNCTIONS } from './operations';
import { SearchPopoverMenu, SearchMenuOption } from './search_popover_menu';

interface AddMetricMenuProps {
  onAdd: (fn: AggFn) => void;
  hasMetrics?: boolean;
  dataTestSubj?: string;
}

export const AddMetricMenu: React.FC<AddMetricMenuProps> = ({
  onAdd,
  hasMetrics,
  dataTestSubj,
}) => {
  const addMetricLabel = i18n.translate('explore.pplBuilder.addMetric', {
    defaultMessage: 'Aggregation',
  });

  const options = useMemo<SearchMenuOption[]>(
    () =>
      AGG_FUNCTIONS.map((agg) => ({
        key: agg.id,
        label: agg.label,
        description: agg.description,
        filterText: agg.label,
        onSelect: () => onAdd(agg.id),
        dataTestSubj: `pplBuilderAddAggregationOption-${agg.id}`,
      })),
    [onAdd]
  );

  return (
    <SearchPopoverMenu
      options={options}
      searchPlaceholder={i18n.translate('explore.pplBuilder.searchAggregations', {
        defaultMessage: 'Search aggregations…',
      })}
      emptyMessage={i18n.translate('explore.pplBuilder.noMatchingAggregation', {
        defaultMessage: 'No matching aggregation',
      })}
      searchDataTestSubj={dataTestSubj ? `${dataTestSubj}-search` : undefined}
      trigger={(toggle) => ({
        anchor: hasMetrics ? (
          <EuiToolTip content={addMetricLabel} position="top">
            <EuiButtonIcon
              className="plqIconBtn plqIconBtn--ghost"
              iconType="plus"
              color="text"
              size="s"
              aria-label={addMetricLabel}
              onClick={toggle}
              data-test-subj={dataTestSubj}
            />
          </EuiToolTip>
        ) : (
          <EuiButtonEmpty
            size="xs"
            iconType="plus"
            className="plqGhostAdd"
            onClick={toggle}
            data-test-subj={dataTestSubj}
          >
            {addMetricLabel}
          </EuiButtonEmpty>
        ),
      })}
    />
  );
};
