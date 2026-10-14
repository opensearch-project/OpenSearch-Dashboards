/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiPopover,
  EuiSelectable,
  EuiSelectableOption,
  EuiBadge,
  EuiSmallButtonEmpty,
  EuiToolTip,
  EuiIcon,
  EuiSmallButtonIcon,
  EuiPanel,
  EuiLoadingSpinner,
  EuiIconTip,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { isImeComposing } from '../../../../../../core/public/utils';
import { VariableService, MAX_DISPLAY_OPTIONS } from '../../../variables/variable_service';
import {
  VariableType,
  VariableWithState,
  NormalizedVariableOption,
  ALL_OPTION_VALUE,
  isAllMarker,
} from '../../../variables/types';
import {
  buildVariableOptionDisplayTextMap,
  getVariableOptionDisplayText,
} from '../../../variables/variable_option_display_utils';
import { TextValueEditor } from './text_value_editor';
import './variable_selector.scss';

export interface VariablesBarProps {
  variableService: VariableService;
  isEditMode?: boolean;
  onAddVariable?: () => void;
  onManageVariables?: () => void;
}

/**
 * Value selector using EuiPopover + EuiSelectable
 * - Shows label outside the popover button
 * - Click to open searchable dropdown list
 */
interface ValueSelectorProps {
  variable: VariableWithState;
  onValuesChange: (variableId: string, values: string[]) => void;
}

// EuiSelectable emits display labels on change, so namespaced keys carry the stored values.
const OPTION_VALUE_KEY_PREFIX = '__value:';
// Key of the synthetic "add the value you just typed" row. Never a stored value.
const ADD_CUSTOM_VALUE_KEY = '__addCustomValue__';
const TRUNCATION_HINT_KEY = '__truncation_hint__';

const ValueSelector: React.FC<ValueSelectorProps> = ({ variable, onValuesChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Parse current selected values
  const currentValue = variable.current;
  const selectedValues = useMemo(() => {
    return currentValue ?? [];
  }, [currentValue]);

  const allowCustomValue = !!variable.allowCustomValue;

  const isAllSelected = !!variable.includeAll && !!variable.multi && isAllMarker(variable.current);

  // Committed values that are not in the generated/static option list.
  const customSelectedValues = useMemo(() => {
    if (!allowCustomValue || isAllSelected) return [];
    return selectedValues.filter(
      (value) => !variable.options.some((option) => option.value === value)
    );
  }, [allowCustomValue, isAllSelected, selectedValues, variable.options]);

  const optionDisplayTextMap = useMemo(
    () => buildVariableOptionDisplayTextMap(variable.options),
    [variable.options]
  );

  // The typed term, unless it is already an option or an already-committed value.
  const pendingCustomValue = useMemo(() => {
    if (!allowCustomValue) return '';
    const term = searchTerm.trim();
    if (!term) return '';
    const alreadyExists =
      variable.options.some((option) => option.value === term) || selectedValues.includes(term);
    return alreadyExists ? '' : term;
  }, [allowCustomValue, searchTerm, variable.options, selectedValues]);

  // Convert to EuiSelectable options format with client-side search
  const selectableOptions: EuiSelectableOption[] = useMemo(() => {
    const options: EuiSelectableOption[] = [];

    // Search the full list, then cap what is rendered.
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch = (option: NormalizedVariableOption) => {
      if (!term) return true;
      return (
        option.value.toLowerCase().includes(term) ||
        (option.label != null && option.label.toLowerCase().includes(term))
      );
    };

    const filteredOptions = term ? variable.options.filter(matchesSearch) : variable.options;
    const totalFiltered = filteredOptions.length;
    const displayOptions = filteredOptions.slice(0, MAX_DISPLAY_OPTIONS);

    // First row, under the search box.
    if (pendingCustomValue) {
      options.push({
        label: pendingCustomValue,
        key: ADD_CUSTOM_VALUE_KEY,
        append: (
          <EuiText size="xs" color="subdued">
            {i18n.translate('dashboard.variables.hitEnterToAdd', {
              defaultMessage: 'Hit enter to add',
            })}
          </EuiText>
        ),
      });
    }

    // Hidden while searching: "All" would otherwise look scoped to the matches.
    if (variable.includeAll && variable.multi && variable.options.length > 0 && !term) {
      options.push({
        label: i18n.translate('dashboard.variables.allOption', { defaultMessage: 'All' }),
        key: ALL_OPTION_VALUE,
        checked: isAllSelected ? 'on' : undefined,
      });
    }

    displayOptions.forEach((option) => {
      options.push({
        label: getVariableOptionDisplayText(option, optionDisplayTextMap),
        key: `${OPTION_VALUE_KEY_PREFIX}${option.value}`,
        checked: isAllSelected || selectedValues.includes(option.value) ? 'on' : undefined,
      });
    });

    // Committed off-list values need rows too, or they cannot be de-selected.
    customSelectedValues.forEach((value) => {
      options.push({
        label: value,
        key: `${OPTION_VALUE_KEY_PREFIX}${value}`,
        checked: 'on',
        'data-test-subj': 'variable-custom-value-option',
      });
    });

    if (totalFiltered > MAX_DISPLAY_OPTIONS) {
      options.push({
        label: term
          ? i18n.translate('dashboard.variables.moreMatchesHint', {
              defaultMessage: 'Showing {displayed} of {total} matches',
              values: { displayed: MAX_DISPLAY_OPTIONS, total: totalFiltered },
            })
          : i18n.translate('dashboard.variables.moreOptionsHint', {
              defaultMessage: 'Showing {displayed} of {total} options — type to search all',
              values: { displayed: MAX_DISPLAY_OPTIONS, total: totalFiltered },
            }),
        key: TRUNCATION_HINT_KEY,
        disabled: true,
        className: 'variableSelectorTruncationHint',
      });
    }

    return options;
  }, [
    variable.options,
    variable.includeAll,
    variable.multi,
    selectedValues,
    isAllSelected,
    optionDisplayTextMap,
    customSelectedValues,
    pendingCustomValue,
    searchTerm,
  ]);

  const commitCustomValue = useCallback(() => {
    if (!pendingCustomValue) return;
    const next = variable.multi
      ? Array.from(new Set([...selectedValues, pendingCustomValue]))
      : [pendingCustomValue];
    onValuesChange(variable.id, next);
    // Keep the search term: the value now renders as a checked row that still
    // matches it, which is the only confirmation this popover can show.
    if (!variable.multi) {
      setIsOpen(false);
      setSearchTerm('');
    }
  }, [pendingCustomValue, variable.multi, variable.id, selectedValues, onValuesChange]);

  const handleChange = useCallback(
    (newOptions: EuiSelectableOption[]) => {
      // Synthetic "add" row: commit a custom value instead of storing a selection.
      const addCustomOption = newOptions.find((opt) => opt.key === ADD_CUSTOM_VALUE_KEY);
      if (addCustomOption?.checked === 'on') {
        commitCustomValue();
        return;
      }

      const allOption = newOptions.find((opt) => opt.key === ALL_OPTION_VALUE);
      if (variable.includeAll && variable.multi && allOption) {
        const allIsChecked = allOption.checked === 'on';
        if (allIsChecked !== isAllSelected) {
          // The "All" row itself was toggled.
          onValuesChange(variable.id, allIsChecked ? [ALL_OPTION_VALUE] : []);
          return;
        }
      }

      // newOptions only holds the visible (search-filtered, truncated) rows,
      // so apply their toggles to the full selection instead of replacing it.
      const visibleChecked = new Set<string>();
      const visibleUnchecked = new Set<string>();
      newOptions.forEach((opt) => {
        if (opt.disabled || opt.key === ALL_OPTION_VALUE || opt.key === ADD_CUSTOM_VALUE_KEY) {
          return;
        }
        const value =
          typeof opt.key === 'string' && opt.key.startsWith(OPTION_VALUE_KEY_PREFIX)
            ? opt.key.slice(OPTION_VALUE_KEY_PREFIX.length)
            : opt.label;
        (opt.checked === 'on' ? visibleChecked : visibleUnchecked).add(value);
      });

      let values: string[];
      if (variable.multi) {
        // Under "All", every option counts as selected.
        const next = new Set(isAllSelected ? variable.options.map((o) => o.value) : selectedValues);
        visibleUnchecked.forEach((v) => next.delete(v));
        visibleChecked.forEach((v) => next.add(v));
        values = Array.from(next);
      } else {
        // The previous value may be hidden by the search; the visible pick wins.
        values = Array.from(visibleChecked);
      }

      onValuesChange(variable.id, values);

      // Close popover after selection for single-select mode
      if (!variable.multi && values.length > 0) {
        setIsOpen(false);
        setSearchTerm('');
      }
    },
    [
      variable.id,
      variable.includeAll,
      variable.multi,
      variable.options,
      isAllSelected,
      selectedValues,
      onValuesChange,
      commitCustomValue,
    ]
  );

  // Calculate popover width based on longest option label
  const popoverWidth = useMemo(() => {
    const longestLength = variable.options.reduce((max, option) => {
      const displayText = getVariableOptionDisplayText(option, optionDisplayTextMap);
      return Math.max(max, displayText.length);
    }, 0);
    // ~8px per char + 60px for checkbox/padding/scrollbar
    return Math.max(300, Math.min(longestLength * 8 + 60, 700));
  }, [variable.options, optionDisplayTextMap]);

  const isLoading = !!variable.loading;
  const isError = !!variable.error;

  const getDisplayText = () => {
    // Priority order: loading > error > selected values > empty state
    if (isLoading) {
      return i18n.translate('dashboard.variables.loading', { defaultMessage: 'Loading...' });
    }
    if (isError) {
      return i18n.translate('dashboard.variables.error', { defaultMessage: 'Error' });
    }
    // Only a plain "All" when nothing off-list is also selected.
    if (isAllSelected && customSelectedValues.length === 0) {
      return i18n.translate('dashboard.variables.allSelected', { defaultMessage: 'All' });
    }
    if (selectedValues.length > 0) {
      const selectedOption = variable.options.find((option) => option.value === selectedValues[0]);
      return selectedOption
        ? getVariableOptionDisplayText(selectedOption, optionDisplayTextMap)
        : selectedValues[0];
    }
    if (variable.options.length === 0) {
      return i18n.translate('dashboard.variables.displayNoOptions', {
        defaultMessage: 'No options',
      });
    }
    return i18n.translate('dashboard.variables.selectValue', { defaultMessage: 'Select value' });
  };
  const selectedCount = isAllSelected ? variable.options.length : selectedValues.length;
  const displayLabel = variable.label || variable.name;
  const calculatedMinWidth = Math.max(60, displayLabel.length * 5 + 60);

  // Container class with error state
  const containerClassName = `variableSelectorContainer ${
    variable.error ? 'variableSelectorContainer--error' : ''
  }`;

  // Button that triggers the popover
  const button = (
    <EuiToolTip content={variable.description} position="bottom">
      <div
        className={containerClassName}
        data-label={displayLabel}
        data-test-subj={`variable-${variable.name}`}
        style={{ minWidth: `${calculatedMinWidth}px` }}
      >
        <EuiPanel
          data-test-subj="variable-selector-button"
          paddingSize="none"
          color="transparent"
          hasBorder={false}
          hasShadow={false}
          onClick={() => setIsOpen(!isOpen)}
          className="variableSelectorPopoverButton"
          disabled={isLoading || isError}
        >
          <EuiFlexGroup
            alignItems="center"
            gutterSize="s"
            justifyContent="spaceBetween"
            responsive={false}
          >
            <EuiFlexItem>
              <EuiFlexGroup gutterSize="s" justifyContent="flexStart" responsive={false}>
                <EuiFlexItem style={{ maxWidth: '300px' }}>
                  <EuiText color="subdued" size="s" data-test-subj="variable-selector-current">
                    <div className="eui-textTruncate">{getDisplayText()}</div>
                  </EuiText>
                </EuiFlexItem>
                {!isError && !isLoading && variable.multi && selectedCount > 0 && (
                  <EuiFlexItem grow={false}>
                    <EuiBadge>{selectedCount}</EuiBadge>
                  </EuiFlexItem>
                )}
              </EuiFlexGroup>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              {isLoading ? (
                <EuiLoadingSpinner />
              ) : isError ? (
                <span className="variableSelectorErrorIcon">
                  <EuiIconTip color="warning" type="alert" size="m" content={variable.error} />
                </span>
              ) : (
                <EuiIcon type="arrowDown" size="m" />
              )}
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPanel>
      </div>
    </EuiToolTip>
  );

  return (
    <EuiPopover
      button={button}
      isOpen={isOpen}
      closePopover={() => {
        setIsOpen(false);
        setSearchTerm('');
      }}
      panelPaddingSize="none"
      anchorPosition="downLeft"
      panelStyle={{ width: popoverWidth }}
    >
      <EuiSelectable
        options={selectableOptions}
        onChange={handleChange}
        searchable
        isPreFiltered
        searchProps={{
          placeholder: allowCustomValue
            ? i18n.translate('dashboard.variables.searchOrAddPlaceholder', {
                defaultMessage: 'Contains... or type to add',
              })
            : i18n.translate('dashboard.variables.searchPlaceholder', {
                defaultMessage: 'Contains...',
              }),
          compressed: true,
          // onSearch receives the raw string; onChange would give (options, value).
          onSearch: setSearchTerm,
          onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (isImeComposing(e)) {
              // Keep it from EuiSelectable too, which would toggle its active row (often the add row).
              e.stopPropagation();
              return;
            }
            if (e.key === 'Enter' && pendingCustomValue) {
              e.preventDefault();
              e.stopPropagation();
              commitCustomValue();
            }
          },
        }}
        height={300}
        listProps={pendingCustomValue ? { onFocusBadge: false } : undefined}
        singleSelection={variable.multi ? false : 'always'}
        emptyMessage={i18n.translate('dashboard.variables.noOptions', {
          defaultMessage: 'No options available',
        })}
      >
        {(list, search) => (
          <div>
            <div style={{ padding: '8px 8px 0 8px' }}>{search}</div>
            {list}
          </div>
        )}
      </EuiSelectable>
    </EuiPopover>
  );
};

/**
 * VariablesBar - Displays variable dropdowns at the top of the dashboard
 */
export const VariablesBar: React.FC<VariablesBarProps> = ({
  variableService,
  isEditMode = false,
  onAddVariable,
  onManageVariables,
}) => {
  const [variables, setVariables] = useState<VariableWithState[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const subscription = variableService.getVariables$().subscribe((newVariables) => {
      setVariables(newVariables);
    });
    return () => subscription.unsubscribe();
  }, [variableService]);

  // Handler for value change
  const handleValueChange = useCallback(
    (variableId: string, values: string[]) => {
      variableService.updateVariableValue(variableId, values);
    },
    [variableService]
  );

  const visibleVariables = variables.filter((v) => !v.hide);

  if (variables.length === 0 && !isEditMode) {
    return null;
  }

  return (
    <EuiFlexGroup
      gutterSize="s"
      alignItems="center"
      wrap
      className="variablesBar"
      style={{
        margin: '0px',
        padding: '8px 4px 0 4px',
      }}
      data-test-subj="dashboardVariablesBar"
    >
      {visibleVariables.length > 0 && (
        <EuiFlexItem grow={false}>
          <EuiToolTip
            content={
              isCollapsed
                ? i18n.translate('dashboard.variables.showVariables', {
                    defaultMessage: 'Show variables',
                  })
                : i18n.translate('dashboard.variables.hideVariables', {
                    defaultMessage: 'Hide variables',
                  })
            }
          >
            <EuiSmallButtonIcon
              iconType={isCollapsed ? 'arrowRight' : 'arrowDown'}
              aria-label={
                isCollapsed
                  ? i18n.translate('dashboard.variables.showVariables', {
                      defaultMessage: 'Show variables',
                    })
                  : i18n.translate('dashboard.variables.hideVariables', {
                      defaultMessage: 'Hide variables',
                    })
              }
              onClick={() => setIsCollapsed(!isCollapsed)}
              data-test-subj="toggleVariablesBarButton"
            />
          </EuiToolTip>
        </EuiFlexItem>
      )}
      {!isCollapsed && (
        <>
          {isEditMode && variables.length > 0 && (
            <EuiFlexItem grow={false}>
              <EuiToolTip
                content={i18n.translate('dashboard.variables.manageVariables', {
                  defaultMessage: 'Manage variables',
                })}
              >
                <EuiSmallButtonIcon
                  iconType="list"
                  aria-label={i18n.translate('dashboard.variables.manageVariables', {
                    defaultMessage: 'Manage variables',
                  })}
                  onClick={onManageVariables}
                  data-test-subj="manageVariablesButton"
                  display="base"
                  className="manageVariablesButton"
                />
              </EuiToolTip>
            </EuiFlexItem>
          )}
          {visibleVariables.map((variable) => (
            <EuiFlexItem key={variable.id} grow={false}>
              <EuiFlexGroup gutterSize="xs" alignItems="center">
                <EuiFlexItem grow={false}>
                  {variable.type === VariableType.Text ? (
                    <TextValueEditor variable={variable} onValuesChange={handleValueChange} />
                  ) : (
                    <ValueSelector variable={variable} onValuesChange={handleValueChange} />
                  )}
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
          ))}
          {isEditMode && (
            <EuiFlexItem grow={false}>
              <EuiSmallButtonEmpty
                iconType="plusInCircle"
                iconSide="left"
                aria-label={i18n.translate('dashboard.variables.addVariable', {
                  defaultMessage: 'Add variable',
                })}
                onClick={onAddVariable}
                data-test-subj="addVariableButton"
              >
                {i18n.translate('dashboard.variables.addVariable', {
                  defaultMessage: 'Add variable',
                })}
              </EuiSmallButtonEmpty>
            </EuiFlexItem>
          )}
        </>
      )}
      {isCollapsed && visibleVariables.length > 0 && (
        <EuiFlexItem grow={false}>
          <EuiText size="xs" color="subdued">
            {i18n.translate('dashboard.variables.hiddenCount', {
              defaultMessage: '{count} {count, plural, one {variable} other {variables}} hidden',
              values: { count: visibleVariables.length },
            })}
          </EuiText>
        </EuiFlexItem>
      )}
    </EuiFlexGroup>
  );
};
