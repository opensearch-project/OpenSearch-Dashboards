/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { i18n } from '@osd/i18n';
import { EuiIcon } from '@elastic/eui';
import { AggFn } from './types';
import { AGG_FN_MAP } from './operations';
import { aggregationsFor, useVisualBuilder } from './visual_builder_language';
import { SearchPopoverMenu, SearchMenuOption } from './search_popover_menu';

interface AggregationMenuProps {
  value: AggFn;
  onChange: (fn: AggFn) => void;
  dataTestSubj?: string;
}

export const AggregationMenu: React.FC<AggregationMenuProps> = ({
  value,
  onChange,
  dataTestSubj,
}) => {
  const language = useVisualBuilder();
  // Looked up in the full catalog so a parsed aggregation keeps its label.
  const selected = AGG_FN_MAP[value];
  const ariaLabel = i18n.translate('explore.pplBuilder.aggregation', {
    defaultMessage: 'Aggregation',
  });

  const options = useMemo<SearchMenuOption[]>(
    () =>
      aggregationsFor(language).map((item) => ({
        key: item.id,
        label: item.label,
        filterText: item.label,
        onSelect: () => onChange(item.id),
        dataTestSubj: `pplBuilderAggOption-${item.id}`,
      })),
    [onChange, language]
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
