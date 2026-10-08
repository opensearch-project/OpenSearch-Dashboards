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
  onAddFunction: (fn: ScalarCall) => void;
  dataTestSubj?: string;
}

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
