/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  EuiSelectable,
  EuiSelectableOption,
  EuiIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFieldText,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { DataStructure, DATA_STRUCTURE_META_TYPES } from '../../../../../../common';
import { appendIcon } from './index_data_structure_creator_utils';
import './index_selector.scss';

interface IndexSelectorProps {
  children: DataStructure[] | undefined;
  selectedIndexIds: string[];
  onMultiSelectionChange: (selectedIds: string[]) => void;
}

export const IndexSelector: React.FC<IndexSelectorProps> = ({
  children,
  selectedIndexIds,
  onMultiSelectionChange,
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // All options - maintain all selections even when filtered
  const allOptions: EuiSelectableOption[] = (children || []).map((child) => ({
    label: child.parent ? `${child.parent.title}::${child.title}` : child.title,
    key: child.id,
    checked: selectedIndexIds.includes(child.id) ? 'on' : undefined,
  }));

  // Filter options for display but keep all selections
  const filteredOptions = allOptions.filter((option) =>
    option.label.toLowerCase().includes(searchValue.toLowerCase())
  );

  const onChange = (newOptions: EuiSelectableOption[]) => {
    // Only update selections from the visible options, but preserve existing selections
    const visibleSelectedIds = newOptions
      .filter((option) => option.checked === 'on')
      .map((option) => option.key!)
      .filter(Boolean);

    // Keep existing selections that aren't in the current filtered view
    const existingHiddenSelections = selectedIndexIds.filter(
      (id) => !filteredOptions.some((option) => option.key === id)
    );

    const finalSelectedIds = [...existingHiddenSelections, ...visibleSelectedIds];
    onMultiSelectionChange(finalSelectedIds);
  };

  const renderOption = (option: EuiSelectableOption) => {
    const child = (children || []).find((c) => c.id === option.key);
    if (!child) return <span>{option.label}</span>;

    const prependIcon = child.meta?.type === DATA_STRUCTURE_META_TYPES.TYPE && child.meta?.icon && (
      <EuiIcon {...child.meta.icon} />
    );
    const appendIconElement = appendIcon(child);

    return (
      <EuiFlexGroup
        className="indexSelectorOption"
        gutterSize="s"
        alignItems="center"
        responsive={false}
      >
        {prependIcon && <EuiFlexItem grow={false}>{prependIcon}</EuiFlexItem>}
        <EuiFlexItem grow={true}>
          <span>{option.label}</span>
        </EuiFlexItem>
        {appendIconElement && <EuiFlexItem grow={false}>{appendIconElement}</EuiFlexItem>}
      </EuiFlexGroup>
    );
  };

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsPopoverOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div ref={containerRef} className="indexSelector">
      {/* Always visible search field */}
      <EuiFieldText
        placeholder={i18n.translate('data.datasetService.indexSelector.searchPlaceholder', {
          defaultMessage: 'Search indices',
        })}
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        onFocus={() => setIsPopoverOpen(true)}
        fullWidth
      />

      {/* Popover that appears over content */}
      {isPopoverOpen && (
        <div className="indexSelector__popover">
          <EuiSelectable
            data-test-subj="dataset-index-selector"
            options={filteredOptions}
            onChange={onChange}
            renderOption={renderOption}
            searchable={false} // We handle search ourselves
            height={Math.min(300, filteredOptions.length * 32 + 16)}
            listProps={{
              bordered: false,
              style: { maxHeight: '300px' },
            }}
          >
            {(list) => list}
          </EuiSelectable>
        </div>
      )}
    </div>
  );
};
