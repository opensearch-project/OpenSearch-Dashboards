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
import { FilterOperator, VisColumn } from '../types';

import './table_vis_filter.scss';

export interface FilterConfig {
  values: unknown[];
  operator: FilterOperator;
  search?: string;
}

interface TableColumnHeaderProps {
  col: VisColumn;
  showColumnFilter?: boolean;
  popoverOpen: boolean;
  setPopoverOpen: (open: boolean) => void;
  filters: Record<string, FilterConfig>;
  setFilters: Dispatch<SetStateAction<Record<string, FilterConfig>>>;
  uniques: unknown[];
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
    return <span>{col.name}</span>;
  }

  const defaultOperator =
    col.schema === 'numerical' ? FilterOperator.Equal : FilterOperator.Contains;
  const currentFilter = filters[col.column] || { values: [], operator: defaultOperator };
  const isFilterActive = currentFilter.values.length > 0 || !!currentFilter.search;

  return (
    <div className="visTableColumnHeader">
      <span className="visTableColumnHeader_text">{col.name}</span>
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
          className="visTableColumnHeader_filterPopover"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
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

const numericOps = [
  FilterOperator.Equal,
  FilterOperator.NotEqual,
  FilterOperator.GreaterThan,
  FilterOperator.GreaterThanOrEqual,
  FilterOperator.LessThan,
  FilterOperator.LessThanOrEqual,
] as const;

export const ColumnFilterContent: React.FC<ColumnFilterContentProps> = ({
  col,
  currentFilter,
  onApply,
  onClear,
  onCancel,
  uniques,
}) => {
  const [localOperator, setLocalOperator] = useState<FilterOperator>(() => {
    if (col.schema === 'numerical') {
      return numericOps.includes(currentFilter.operator as any)
        ? currentFilter.operator
        : FilterOperator.Equal;
    }
    return FilterOperator.Contains;
  });
  const [localSearch, setLocalSearch] = useState<string>(currentFilter.search || '');
  const [localUniqueSearch, setLocalUniqueSearch] = useState<string>('');
  const [localSelected, setLocalSelected] = useState<Set<any>>(new Set(currentFilter.values));

  const operatorOptions: EuiSelectOption[] = useMemo(() => {
    if (col.schema === 'numerical') {
      return [
        { value: FilterOperator.Equal, text: '=' },
        { value: FilterOperator.NotEqual, text: '!=' },
        { value: FilterOperator.GreaterThan, text: '>' },
        { value: FilterOperator.GreaterThanOrEqual, text: '>=' },
        { value: FilterOperator.LessThan, text: '<' },
        { value: FilterOperator.LessThanOrEqual, text: '<=' },
      ];
    } else if (col.schema === 'categorical') {
      return [
        { value: FilterOperator.Contains, text: 'contains' },
        { value: FilterOperator.Equals, text: 'equals' },
      ];
    }
    return [];
  }, [col.schema]);

  const showUniqueValues = useMemo(() => {
    if (col.schema === 'categorical') {
      return localOperator === FilterOperator.Equals;
    } else if (col.schema === 'numerical') {
      return localOperator === FilterOperator.Equal || localOperator === FilterOperator.NotEqual;
    }
    return false;
  }, [col.schema, localOperator]);

  const showInput = useMemo(() => {
    if (col.schema === 'numerical') {
      return [
        FilterOperator.GreaterThan,
        FilterOperator.GreaterThanOrEqual,
        FilterOperator.LessThan,
        FilterOperator.LessThanOrEqual,
      ].includes(localOperator);
    } else if (col.schema === 'categorical') {
      return localOperator === FilterOperator.Contains;
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
    const normalizedValues = Array.from(localSelected).map((v) =>
      col.schema === 'numerical' ? Number(v) : v
    );
    const needsInput =
      (col.schema === 'numerical' &&
        [
          FilterOperator.GreaterThan,
          FilterOperator.GreaterThanOrEqual,
          FilterOperator.LessThan,
          FilterOperator.LessThanOrEqual,
        ].includes(localOperator)) ||
      (col.schema === 'categorical' && localOperator === FilterOperator.Contains);

    onApply({
      values: normalizedValues,
      operator: localOperator,
      search: needsInput ? localSearch : '',
    });
  };

  useEffect(() => {
    if (
      col.schema === 'numerical' &&
      (localOperator === FilterOperator.Equal || localOperator === FilterOperator.NotEqual)
    ) {
      setLocalSelected(new Set(currentFilter.values));
    } else if (col.schema === 'categorical' && localOperator === FilterOperator.Equals) {
      setLocalSelected(new Set(currentFilter.values));
    }
  }, [col.schema, localOperator, currentFilter.values]);

  return (
    <>
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
              onChange={(e) => setLocalOperator(e.target.value as FilterOperator)}
            />
          </EuiFlexItem>
          {showInput && (
            <EuiFlexItem grow={4}>
              {col.schema === 'numerical' ? (
                <EuiFieldNumber
                  compressed
                  placeholder="Enter value"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                />
              ) : (
                <EuiFieldText
                  compressed
                  placeholder="Enter text to filter"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                />
              )}
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
          {filteredUniques.length > 0 && (
            <>
              <EuiFormRow>
                <EuiPanel
                  paddingSize="s"
                  borderRadius="m"
                  hasShadow={false}
                  className="visTableColumnHeader_uniqueValuesPanel"
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
              <EuiFormRow>
                <EuiCheckbox
                  id="selectAll"
                  label="Select All"
                  checked={isSelectAllChecked}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  data-test-subj="selectAllCheckbox"
                />
              </EuiFormRow>
            </>
          )}
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
    </>
  );
};
