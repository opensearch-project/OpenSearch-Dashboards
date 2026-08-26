/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiPopover,
  EuiSelectable,
  EuiSelectableOption,
} from '@elastic/eui';
import { SpanFilter } from '../../../trace_view';

export interface SpanStatusFilterProps {
  spanFilters: SpanFilter[];
  setSpanFiltersWithStorage: (filters: SpanFilter[]) => void;
  /**
   * 'button' renders the persistent entry control (always shown). 'pill' renders
   * the applied-filter chip (only when a status filter is active). Both open the
   * same status editor.
   */
  variant?: 'button' | 'pill';
}

export const SpanStatusFilter: React.FC<SpanStatusFilterProps> = ({
  spanFilters,
  setSpanFiltersWithStorage,
  variant = 'button',
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

  const selectedLabels = useMemo(
    () => options.filter((option) => option.checked === 'on').map((option) => option.label),
    [options]
  );
  const selectedCount = selectedLabels.length;

  // Drop just the status-related filters (leaving other filters untouched) so
  // the user can reset status without "Clear all".
  const clearStatus = useCallback(() => {
    setSpanFiltersWithStorage(
      spanFilters.filter(
        (filter) =>
          !(filter.field === 'status.code' && [0, 1, 2].includes(filter.value as number)) &&
          !(filter.field === 'isError' && filter.value === true)
      )
    );
  }, [spanFilters, setSpanFiltersWithStorage]);

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

  const togglePopover = useCallback(() => setIsPopoverOpen((open) => !open), []);

  // Applied-filter pill: the field (status) is fixed, so only the value segment
  // is an editable dropdown — the key carries no caret.
  const pill = useMemo(
    () => (
      <span className="plqWhereChip" data-test-subj="span-status-filter-chip">
        <span className="plqWhereChip__field plqWhereChip__field--static">
          {i18n.translate('explore.traceView.status.chipField', { defaultMessage: 'status' })}
        </span>
        <span className="plqWhereChip__op">=</span>
        <button type="button" className="plqWhereChip__val" onClick={togglePopover}>
          <span className="plqWhereChip__valText">{selectedLabels.join(', ')}</span>
          <span className="plqWhereChip__caret">▾</span>
        </button>
        <EuiButtonIcon
          className="plqPillX"
          iconType="cross"
          color="text"
          size="s"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            clearStatus();
          }}
          aria-label={i18n.translate('explore.traceView.status.clearAriaLabel', {
            defaultMessage: 'Clear status filter',
          })}
          data-test-subj="span-status-filter-reset"
        />
      </span>
    ),
    [selectedLabels, clearStatus, togglePopover]
  );

  // Persistent entry button (always shown).
  const triggerButton = useMemo(
    () => (
      <EuiButtonEmpty
        size="xs"
        color="text"
        iconType="filter"
        onClick={togglePopover}
        data-test-subj="span-status-filter-button"
        isSelected={isPopoverOpen}
      >
        {i18n.translate('explore.traceView.button.filterByStatus', {
          defaultMessage: 'Status',
        })}
      </EuiButtonEmpty>
    ),
    [isPopoverOpen, togglePopover]
  );

  // In pill mode, render nothing until a status filter is actually applied.
  if (variant === 'pill' && selectedCount === 0) return null;
  const button = variant === 'pill' ? pill : triggerButton;

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
