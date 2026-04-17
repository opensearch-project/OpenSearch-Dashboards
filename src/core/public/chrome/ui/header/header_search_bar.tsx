/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiButtonIcon, EuiFieldSearch, EuiToolTip } from '@elastic/eui';
import { useState } from 'react';
import { i18n } from '@osd/i18n';
import { GlobalSearchCommand } from '../../global_search';
import { SearchModal } from './search_modal';

interface Props {
  globalSearchCommands: GlobalSearchCommand[];
  panel?: boolean;
  onSearchResultClick?: () => void;
}

export const HeaderSearchBarIcon = ({ globalSearchCommands }: Props) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <>
      <EuiToolTip
        content={i18n.translate('core.globalSearch.icon.toolTip', {
          defaultMessage: 'Search',
        })}
      >
        <EuiButtonIcon
          aria-label="search"
          iconType="search"
          color="text"
          data-test-subj="globalSearch-leftNav-icon"
          onClick={() => setIsModalOpen(true)}
        />
      </EuiToolTip>
      {isModalOpen && (
        <SearchModal
          globalSearchCommands={globalSearchCommands}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
};

export const HeaderSearchBar = ({ globalSearchCommands }: Props) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <EuiFieldSearch
        compressed
        readOnly
        fullWidth
        placeholder={
          globalSearchCommands.find((item) => item.inputPlaceholder)?.inputPlaceholder ??
          i18n.translate('core.globalSearch.input.placeholder', {
            defaultMessage: 'Search menu or assets',
          })
        }
        aria-label="Search the menus"
        data-test-subj="global-search-input"
        className="searchInput"
        onClick={() => setIsModalOpen(true)}
        onFocus={() => setIsModalOpen(true)}
        style={{ cursor: 'pointer' }}
      />
      {isModalOpen && (
        <SearchModal
          globalSearchCommands={globalSearchCommands}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
};
