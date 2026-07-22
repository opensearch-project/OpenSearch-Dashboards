/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { i18n } from '@osd/i18n';
import { EuiIcon } from '@elastic/eui';
import { SearchPopoverMenu, SearchMenuOption } from './search_popover_menu';

interface SpanIntervalMenuProps {
  interval: string;
  onChange: (interval: string) => void;
  isInvalid?: boolean;
  dataTestSubj?: string;
}

const COMMON_INTERVALS = ['1m', '5m', '30m', '1h', '12h', '1d'];

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
