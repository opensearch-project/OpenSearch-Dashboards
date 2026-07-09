/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiButtonEmpty,
  EuiPopover,
  EuiSelectable,
  EuiBadge,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSelectableOption,
} from '@elastic/eui';
import { SpanFilter } from '../../../trace_view';

export interface SpanStatusFilterProps {
  spanFilters: SpanFilter[];
  setSpanFiltersWithStorage: (filters: SpanFilter[]) => void;
}

export const SpanStatusFilter: React.FC<SpanStatusFilterProps> = ({
  spanFilters,
  setSpanFiltersWithStorage,
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const [options, setOptions] = useState<EuiSelectableOption[]>([
    {
      label: i18n.translate('explore.traceView.filter.error', {
        defaultMessage: 'Error',
      }),
      key: 'error',
    },
    {
      label: i18n.translate('explore.traceView.filter.ok', {
        defaultMessage: 'OK',
      }),
      key: 'ok',
    },
    {
      label: i18n.translate('explore.traceView.filter.unset', {
        defaultMessage: 'Unset',
      }),
      key: 'unset',
    },
  ]);

  // Sync options with external spanFilters changes
  useEffect(() => {
    const isErrorActive = spanFilters.some(
      (filter) =>
        (filter.field === 'status.code' && filter.value === 2) ||
        (filter.field === 'isError' && filter.value === true)
    );
    const isOkActive = spanFilters.some(
      (filter) => filter.field === 'status.code' && filter.value === 1
    );
    const isUnsetActive = spanFilters.some(
      (filter) => filter.field === 'status.code' && filter.value === 0
    );

    const newOptions: EuiSelectableOption[] = [
      {
        label: i18n.translate('explore.traceView.filter.error', {
          defaultMessage: 'Error',
        }),
        key: 'error',
        ...(isErrorActive && { checked: 'on' }),
      },
      {
        label: i18n.translate('explore.traceView.filter.ok', {
          defaultMessage: 'OK',
        }),
        key: 'ok',
        ...(isOkActive && { checked: 'on' }),
      },
      {
        label: i18n.translate('explore.traceView.filter.unset', {
          defaultMessage: 'Unset',
        }),
        key: 'unset',
        ...(isUnsetActive && { checked: 'on' }),
      },
    ];

    setOptions(newOptions);
  }, [spanFilters]);

  const selectedCount = useMemo(() => options.filter((option) => option.checked === 'on').length, [
    options,
  ]);

  const handleChange = useCallback(
    (newOptions: EuiSelectableOption[]) => {
      setOptions(newOptions);

      let newFilters = [...spanFilters];

      // Remove all status filters first
      newFilters = newFilters.filter(
        (filter) =>
          !(filter.field === 'status.code' && [0, 1, 2].includes(filter.value as number)) &&
          !(filter.field === 'isError' && filter.value === true)
      );

      // Add selected filters
      newOptions.forEach((option) => {
        if (option.checked === 'on') {
          switch (option.key) {
            case 'error':
              newFilters.push({ field: 'isError', value: true });
              break;
            case 'ok':
              newFilters.push({ field: 'status.code', value: 1 });
              break;
            case 'unset':
              newFilters.push({ field: 'status.code', value: 0 });
              break;
          }
        }
      });

      setSpanFiltersWithStorage(newFilters);
    },
    [spanFilters, setSpanFiltersWithStorage]
  );

  const button = useMemo(
    () => (
      <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiButtonEmpty
            size="xs"
            iconType="filter"
            onClick={() => setIsPopoverOpen(!isPopoverOpen)}
            data-test-subj="span-status-filter-button"
            isSelected={isPopoverOpen}
          >
            {i18n.translate('explore.traceView.button.filterByStatus', {
              defaultMessage: 'Filter by status',
            })}
          </EuiButtonEmpty>
        </EuiFlexItem>
        {selectedCount > 0 && (
          <EuiFlexItem grow={false}>
            <EuiBadge color="primary">{selectedCount}</EuiBadge>
          </EuiFlexItem>
        )}
      </EuiFlexGroup>
    ),
    [isPopoverOpen, selectedCount]
  );

  return (
    <EuiPopover
      button={button}
      isOpen={isPopoverOpen}
      closePopover={() => setIsPopoverOpen(false)}
      panelPaddingSize="s"
      data-test-subj="span-status-filter-popover"
    >
      <EuiSelectable
        options={options}
        onChange={handleChange}
        allowExclusions={false}
        singleSelection={true}
        listProps={{
          onFocusBadge: false,
        }}
        data-test-subj="status-filter-selectable"
      >
        {(list) => list}
      </EuiSelectable>
    </EuiPopover>
  );
};
