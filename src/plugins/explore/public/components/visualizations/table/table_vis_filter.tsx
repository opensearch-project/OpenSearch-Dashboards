/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiCheckbox,
  EuiFieldNumber,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiIcon,
  EuiPanel,
  EuiPopover,
  EuiSelect,
  EuiSelectOption,
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
  if (!showColumnFilter || col.schema === 'date') {
    return (
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {col.name}
      </span>
    );
  }

  const defaultOperator = col.schema === 'numerical' ? '=' : 'contains';
  const currentFilter = filters[col.column] || { values: [], operator: defaultOperator };
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
  const numericOps = ['=', '!=', '>', '>=', '<', '<='] as const;
  const [localOperator, setLocalOperator] = useState<string>(() => {
    if (col.schema === 'numerical') {
      return numericOps.includes(currentFilter.operator as any) ? currentFilter.operator : '=';
    }
    return 'contains';
  });
  const [localSearch, setLocalSearch] = useState<string>(currentFilter.search || '');
  const [localUniqueSearch, setLocalUniqueSearch] = useState<string>('');
  const [localSelected, setLocalSelected] = useState<Set<any>>(new Set(currentFilter.values));

  const operatorOptions: EuiSelectOption[] = useMemo(() => {
    if (col.schema === 'numerical') {
      return [
        { value: '=', text: '=' },
        { value: '!=', text: '!=' },
        { value: '>', text: '>' },
        { value: '>=', text: '>=' },
        { value: '<', text: '<' },
        { value: '<=', text: '<=' },
      ];
    } else if (col.schema === 'categorical') {
      return [{ value: 'contains', text: 'contains' }];
    }
    return [];
  }, [col.schema]);

  const showUniqueValues = useMemo(() => {
    if (col.schema === 'categorical') {
      return localOperator === 'contains';
    } else if (col.schema === 'numerical') {
      return localOperator === '=' || localOperator === '!=';
    }
    return false;
  }, [col.schema, localOperator]);

  const showInput = useMemo(() => {
    if (col.schema === 'numerical') {
      return ['>', '>=', '<', '<='].includes(localOperator);
    }
    return false;
  }, [col.schema, localOperator]);

  const filteredUniques = useMemo(() => {
    if (!showUniqueValues) return uniques;
    const search = localUniqueSearch.trim().toLowerCase();
    const filtered = search
      ? uniques.filter((u) => String(u).toLowerCase().includes(search))
      : uniques;
    if (col.schema === 'categorical') {
      return filtered.sort((a, b) => String(a).localeCompare(String(b)));
    } else if (col.schema === 'numerical') {
      return filtered.sort((a, b) => Number(a) - Number(b));
    }
    return filtered;
  }, [uniques, showUniqueValues, localUniqueSearch, col.schema]);

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

  const isSelectAllChecked =
    filteredUniques.length > 0 && filteredUniques.every((u) => localSelected.has(u));

  const handleApply = () => {
    onApply({
      values: Array.from(localSelected),
      operator: localOperator,
      search: localSearch,
    });
  };

  useEffect(() => {
    if (col.schema === 'numerical' && (localOperator === '=' || localOperator === '!=')) {
      setLocalSelected(new Set(currentFilter.values));
    }
  }, [col.schema, localOperator, currentFilter.values]);

  return (
    <div style={{ padding: '8px' }}>
      <EuiFormRow>
        <EuiFlexGroup alignItems="center" gutterSize="s">
          <EuiFlexItem grow={3}>
            <EuiTitle size="xxs">
              <span>{col.name}</span>
            </EuiTitle>
          </EuiFlexItem>
          <EuiFlexItem grow={showInput ? 3 : 7}>
            <EuiSelect
              compressed
              options={operatorOptions}
              value={localOperator}
              onChange={(e) => setLocalOperator(e.target.value)}
            />
          </EuiFlexItem>
          {showInput && (
            <EuiFlexItem grow={4}>
              <EuiFieldNumber
                compressed
                placeholder="Enter value"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
              />
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
      </EuiFormRow>
      {showUniqueValues && (
        <>
          <EuiFormRow>
            <EuiFieldText
              compressed
              placeholder="Filter unique values"
              value={localUniqueSearch}
              onChange={(e) => setLocalUniqueSearch(e.target.value)}
              fullWidth
            />
          </EuiFormRow>
          <EuiFormRow>
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
          </EuiFormRow>
          <EuiCheckbox
            id="selectAll"
            label="Select All"
            checked={isSelectAllChecked}
            onChange={(e) => handleSelectAll(e.target.checked)}
          />
        </>
      )}
      <EuiFormRow>
        <EuiFlexGroup alignItems="center" gutterSize="s">
          <EuiFlexItem>
            <EuiButtonEmpty onClick={onClear}>Clear filter</EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiButtonEmpty onClick={onCancel}>Cancel</EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiButton fill size="s" onClick={handleApply}>
              OK
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFormRow>
    </div>
  );
};
