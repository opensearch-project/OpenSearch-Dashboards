/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Dispatch, SetStateAction, useMemo, useState } from 'react';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiCheckbox,
  EuiFieldText,
  EuiIcon,
  EuiPanel,
  EuiPopover,
  EuiSelect,
  EuiSelectOption,
  EuiSpacer,
  EuiTitle,
} from '@elastic/eui';
import { VisColumn } from '../types';

interface FilterConfig {
  values: any[];
  operator: string;
  search?: string;
}

interface TableColumnHeaderProps {
  col: VisColumn;
  showColumnFilter?: boolean;
  popoverOpen: boolean;
  setPopoverOpen: (open: boolean) => void;
  filters: Record<string, FilterConfig>;
  setFilters: Dispatch<SetStateAction<Record<string, FilterConfig>>>;
  uniques: any[];
}

export const TableColumnHeader = ({
  col,
  showColumnFilter,
  popoverOpen,
  setPopoverOpen,
  filters,
  setFilters,
  uniques,
}: TableColumnHeaderProps) => {
  if (!showColumnFilter) {
    return (
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {col.name}
      </span>
    );
  }

  const currentFilter = filters[col.column] || { values: [], operator: 'contains' };
  const isFilterActive = currentFilter.values.length > 0 || !!currentFilter.search;

  return (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
      <span
        style={{ flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
      >
        {col.name}
      </span>
      <EuiPopover
        button={
          <EuiIcon
            type="filter"
            color={isFilterActive ? 'primary' : 'text'}
            onClick={(e) => {
              e.stopPropagation();
              setPopoverOpen(!popoverOpen);
            }}
            style={{ cursor: 'pointer', marginLeft: '4px', marginRight: '4px' }}
            data-test-subj={`visTableFilterIcon-${col.column}`}
          />
        }
        isOpen={popoverOpen}
        closePopover={() => setPopoverOpen(false)}
        panelPaddingSize="s"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          style={{ width: '300px' }}
        >
          <ColumnFilterContent
            col={col}
            currentFilter={currentFilter}
            onApply={(newConfig) => {
              setFilters((prev) => ({ ...prev, [col.column]: newConfig }));
              setPopoverOpen(false);
            }}
            onClear={() => {
              setFilters((prev) => {
                const newFilters = { ...prev };
                delete newFilters[col.column];
                return newFilters;
              });
              setPopoverOpen(false);
            }}
            onCancel={() => setPopoverOpen(false)}
            uniques={uniques}
          />
        </div>
      </EuiPopover>
    </div>
  );
};

interface ColumnFilterContentProps {
  col: VisColumn;
  currentFilter: FilterConfig;
  onApply: (config: FilterConfig) => void;
  onClear: () => void;
  onCancel: () => void;
  uniques: any[];
}

const ColumnFilterContent: React.FC<ColumnFilterContentProps> = ({
  col,
  currentFilter,
  onApply,
  onClear,
  onCancel,
  uniques,
}) => {
  const [localOperator, setLocalOperator] = useState<string>(currentFilter.operator || 'contains');
  const [localSearch, setLocalSearch] = useState<string>(currentFilter.search || '');
  const [localSelected, setLocalSelected] = useState<Set<any>>(new Set(currentFilter.values));

  const operatorOptions: EuiSelectOption[] = [
    { value: 'contains', text: 'contains' },
    { value: '=', text: '=' },
    { value: '!=', text: '!=' },
    { value: '>', text: '>' },
    { value: '>=', text: '>=' },
    { value: '<', text: '<' },
    { value: '<=', text: '<=' },
    { value: 'expression', text: 'expression' },
  ];

  const filteredUniques = useMemo(() => {
    const search = localSearch.trim();
    if (!search && localOperator !== 'expression') return uniques;
    return uniques.filter((u) => {
      const us = String(u).toLowerCase();
      const ss = search.toLowerCase();
      switch (localOperator) {
        case 'contains':
          return us.includes(ss);
        case '=':
          return u === search;
        case '!=':
          return u !== search;
        case '>':
          return Number.isFinite(Number(u)) && Number(u) > Number(search);
        case '>=':
          return Number.isFinite(Number(u)) && Number(u) >= Number(search);
        case '<':
          return Number.isFinite(Number(u)) && Number(u) < Number(search);
        case '<=':
          return Number.isFinite(Number(u)) && Number(u) <= Number(search);
        case 'expression':
          try {
            const expr = search.replace(/\$/g, 'u');
            const func = new Function('u', `return ${expr};`);
            return func(u);
          } catch {
            return false;
          }
        default:
          return false;
      }
    });
  }, [uniques, localOperator, localSearch]);

  const handleToggleValue = (value: any, checked: boolean) => {
    setLocalSelected((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(value);
      } else {
        newSet.delete(value);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    setLocalSelected((prev) => {
      const newSet = new Set(prev);
      filteredUniques.forEach((u) => {
        if (checked) {
          newSet.add(u);
        } else {
          newSet.delete(u);
        }
      });
      return newSet;
    });
  };

  const isSelectAllChecked = filteredUniques.every((u) => localSelected.has(u));

  const handleApply = () => {
    onApply({
      values: Array.from(localSelected),
      operator: localOperator,
      search: localSearch,
    });
  };

  return (
    <div style={{ padding: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
        <EuiTitle size="xxs">
          <span>{col.name}</span>
        </EuiTitle>
        <EuiSelect
          compressed
          options={operatorOptions}
          value={localOperator}
          onChange={(e) => setLocalOperator(e.target.value)}
        />
      </div>
      <EuiFieldText
        compressed
        placeholder="Filter unique values"
        value={localSearch}
        onChange={(e) => setLocalSearch(e.target.value)}
        fullWidth
        style={{ marginBottom: '8px' }}
      />
      <EuiSpacer size="xs" />
      <EuiPanel
        paddingSize="s"
        style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '8px' }}
      >
        {filteredUniques.map((u) => (
          <EuiCheckbox
            key={String(u)}
            id={String(u)}
            label={String(u)}
            checked={localSelected.has(u)}
            onChange={(e) => handleToggleValue(u, e.target.checked)}
          />
        ))}
      </EuiPanel>
      <EuiCheckbox
        id="selectAll"
        label="Select All"
        checked={isSelectAllChecked}
        onChange={(e) => handleSelectAll(e.target.checked)}
        style={{ marginBottom: '8px' }}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <EuiButtonEmpty onClick={onClear} style={{ marginRight: '8px' }}>
          Clear filter
        </EuiButtonEmpty>
        <EuiButtonEmpty onClick={onCancel} style={{ marginRight: '8px' }}>
          Cancel
        </EuiButtonEmpty>
        <EuiButton fill size="s" onClick={handleApply}>
          OK
        </EuiButton>
      </div>
    </div>
  );
};
