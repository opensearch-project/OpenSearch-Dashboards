/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EuiContextMenuItem, EuiContextMenuPanel, EuiFilterButton, EuiPopover } from '@elastic/eui';
import { i18n } from '@osd/i18n';

export const RecentWorkFilter = ({ filteredTypes, setFilteredTypes, savedObjectTypes }) => {
  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <EuiPopover
      id="recentWorkSectionFilterPopover"
      panelPaddingSize="none"
      isOpen={filterOpen}
      closePopover={() => setFilterOpen(false)}
      button={
        <EuiFilterButton
          onClick={() => setFilterOpen(!filterOpen)}
          iconType="arrowDown"
          data-test-subj="recentWorkSectionFilterButton"
          isSelected={filterOpen}
          numFilters={savedObjectTypes.length}
          hasActiveFilters={filteredTypes.length > 0}
          numActiveFilters={filteredTypes.length}
        >
          {i18n.translate('recentWorks.filterButtonLabel', {
            defaultMessage: 'Types',
          })}
        </EuiFilterButton>
      }
    >
      <EuiContextMenuPanel
        watchedItemProps={['icon', 'disabled']}
        items={savedObjectTypes.map((type) => (
          <EuiContextMenuItem
            key={type}
            icon={filteredTypes.includes(type) ? 'check' : 'empty'}
            data-test-subj={`recentWorkFilter-${type}`}
            onClick={() => {
              setFilteredTypes(
                filteredTypes.includes(type)
                  ? filteredTypes.filter((t) => t !== type)
                  : [...filteredTypes, type]
              );
            }}
          >
            {type}
          </EuiContextMenuItem>
        ))}
      />
    </EuiPopover>
  );
};
