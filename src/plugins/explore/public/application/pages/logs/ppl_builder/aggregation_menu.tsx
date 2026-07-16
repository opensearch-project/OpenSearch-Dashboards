/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { i18n } from '@osd/i18n';
import { EuiIcon } from '@elastic/eui';
import { AggFn } from './types';
import { AGG_FUNCTIONS } from './operations';
import { SearchPopoverMenu, SearchMenuOption } from './search_popover_menu';

interface AggregationMenuProps {
  /** Currently selected aggregation. */
  value: AggFn;
  /** Called with the chosen aggregation when the user picks one. */
  onChange: (fn: AggFn) => void;
  dataTestSubj?: string;
}

/**
 * The aggregation ("Show") selector for a metric row, rendered as a search-first
 * popover (the shared {@link SearchPopoverMenu}) rather than a plain dropdown.
 * The trigger shows the selected aggregation label with a caret; opening it
 * reveals a filterable flat list of aggregations. The list is flat (no
 * categories) since the aggregation catalog is short and uncategorized.
 */
export const AggregationMenu: React.FC<AggregationMenuProps> = ({
  value,
  onChange,
  dataTestSubj,
}) => {
  const selected = AGG_FUNCTIONS.find((f) => f.id === value);
  const ariaLabel = i18n.translate('explore.pplBuilder.aggregation', {
    defaultMessage: 'Aggregation',
  });

  const options = useMemo<SearchMenuOption[]>(
    () =>
      AGG_FUNCTIONS.map((item) => ({
        key: item.id,
        label: item.label,
        filterText: item.label,
        onSelect: () => onChange(item.id),
        dataTestSubj: `pplBuilderAggOption-${item.id}`,
      })),
    [onChange]
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
        anchor: (
          <button
            type="button"
            className="plqAggTrigger"
            onClick={toggle}
            aria-label={ariaLabel}
            data-test-subj={dataTestSubj}
          >
            <span className="plqAggTrigger__label">{selected?.label}</span>
            <EuiIcon type="arrowDown" size="s" className="plqAggTrigger__caret" />
          </button>
        ),
      })}
    />
  );
};
