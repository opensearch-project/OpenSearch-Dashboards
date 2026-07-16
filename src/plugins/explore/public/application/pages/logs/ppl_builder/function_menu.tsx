/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { i18n } from '@osd/i18n';
import { EuiToolTip } from '@elastic/eui';
import { ScalarCall } from './types';
import { SCALAR_FN_CATEGORIES } from './operations';
import { SearchPopoverMenu, SearchMenuOption } from './search_popover_menu';

interface FunctionMenuProps {
  /** Called with a fresh ScalarCall when the user picks a scalar function. */
  onAddFunction: (fn: ScalarCall) => void;
  dataTestSubj?: string;
}

/**
 * The `ƒx` "wrap in function" affordance for an aggregation row: a compact italic
 * glyph that opens the shared {@link SearchPopoverMenu} anchored under it. The
 * popover is a single flat, filterable list grouped under Math / String / Date &
 * time headers — no submenus and no second click level. The aggregation itself is
 * chosen when the metric is created and edited via the row's "Show" dropdown, so
 * it is NOT offered here.
 */
export const FunctionMenu: React.FC<FunctionMenuProps> = ({ onAddFunction, dataTestSubj }) => {
  const label = i18n.translate('explore.pplBuilder.addFunction', {
    defaultMessage: 'Wrap in function',
  });

  const options = useMemo<SearchMenuOption[]>(
    () =>
      SCALAR_FN_CATEGORIES.flatMap((cat) =>
        cat.items.map((item) => ({
          key: item.id,
          label: `${item.name}()`,
          filterText: item.name,
          group: cat.name,
          onSelect: () => onAddFunction({ id: item.id, name: item.name, params: [...item.params] }),
          dataTestSubj: `pplBuilderFnOption-${item.id}`,
        }))
      ),
    [onAddFunction]
  );

  return (
    <SearchPopoverMenu
      options={options}
      searchPlaceholder={i18n.translate('explore.pplBuilder.searchFunctions', {
        defaultMessage: 'Search functions…',
      })}
      emptyMessage={i18n.translate('explore.pplBuilder.noMatchingFunction', {
        defaultMessage: 'No matching function',
      })}
      searchDataTestSubj={dataTestSubj ? `${dataTestSubj}-search` : undefined}
      trigger={(toggle) => ({
        anchor: (
          <EuiToolTip content={label} position="top">
            <button
              type="button"
              className="plqFxBtn euiButtonIcon"
              onClick={toggle}
              aria-label={label}
              data-test-subj={dataTestSubj}
            >
              <span className="plqFxBtn__label">ƒx</span>
            </button>
          </EuiToolTip>
        ),
      })}
    />
  );
};
