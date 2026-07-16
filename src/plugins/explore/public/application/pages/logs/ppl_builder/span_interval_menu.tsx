/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { i18n } from '@osd/i18n';
import { EuiIcon } from '@elastic/eui';
import { SearchPopoverMenu, SearchMenuOption } from './search_popover_menu';

interface SpanIntervalMenuProps {
  /** Current interval token, e.g. `1h`, `30s`. */
  interval: string;
  /** Called with the chosen (or typed) interval. */
  onChange: (interval: string) => void;
  /** Marks the trigger as invalid (unparseable interval). */
  isInvalid?: boolean;
  dataTestSubj?: string;
}

const COMMON_INTERVALS = ['1m', '5m', '30m', '1h', '12h', '1d'];

/**
 * The time-bucket interval control inside the "every" chip: a search-first
 * popover (the shared {@link SearchPopoverMenu}) offering common intervals while
 * still accepting a custom value. The trigger shows the current interval in
 * monospace so the chip reads `every 1h`; opening it reveals the preset list.
 * Typing filters the presets and, on Enter, applies the typed value verbatim so
 * any valid `span(...)` interval round-trips.
 */
export const SpanIntervalMenu: React.FC<SpanIntervalMenuProps> = ({
  interval,
  onChange,
  isInvalid,
  dataTestSubj,
}) => {
  const options = useMemo<SearchMenuOption[]>(
    () =>
      COMMON_INTERVALS.map((it) => ({
        key: it,
        label: it,
        selected: it === interval.trim(),
        onSelect: () => onChange(it),
        dataTestSubj: `pplBuilderSpanIntervalOption-${it}`,
      })),
    [interval, onChange]
  );

  return (
    <SearchPopoverMenu
      options={options}
      checkable
      allowCreate={{ onCreate: onChange, dataTestSubj: 'pplBuilderSpanIntervalCustom' }}
      searchPlaceholder={i18n.translate('explore.pplBuilder.spanIntervalPlaceholder', {
        defaultMessage: 'e.g. 1h, 30s…',
      })}
      emptyMessage=""
      searchDataTestSubj={dataTestSubj ? `${dataTestSubj}-search` : undefined}
      trigger={(toggle) => ({
        anchor: (
          <button
            type="button"
            className={`plqChip__param plqChip__mono${isInvalid ? ' plqChip__param--invalid' : ''}`}
            onClick={toggle}
            aria-label={i18n.translate('explore.pplBuilder.spanInterval', {
              defaultMessage: 'Time span interval',
            })}
            data-test-subj={dataTestSubj}
          >
            {interval}
            <EuiIcon type="arrowDown" size="s" className="plqChip__caret" />
          </button>
        ),
      })}
    />
  );
};
