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
import { VariableService } from '../../../variables/variable_service';
import { VariableWithState } from '../../../variables/types';
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

const ALL_OPTION_VALUE = '__all__';

const ValueSelector: React.FC<ValueSelectorProps> = ({ variable, onValuesChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Parse current selected values
  const currentValue = variable.current;
  const selectedValues = useMemo(() => {
    return currentValue ?? [];
  }, [currentValue]);

  // Check if "All" is currently selected (all real options are selected)
  const isAllSelected = useMemo(() => {
    if (!variable.includeAll || !variable.multi) return false;
    return (
      variable.options.length > 0 && variable.options.every((opt) => selectedValues.includes(opt))
    );
  }, [variable.includeAll, variable.multi, variable.options, selectedValues]);

  // Convert to EuiSelectable options format, prepend "All" if enabled
  const selectableOptions: EuiSelectableOption[] = useMemo(() => {
    const options: EuiSelectableOption[] = [];

    if (variable.includeAll && variable.multi && variable.options.length > 0) {
      options.push({
        label: i18n.translate('dashboard.variables.allOption', { defaultMessage: 'All' }),
        key: ALL_OPTION_VALUE,
        checked: isAllSelected ? 'on' : undefined,
      });
    }

    variable.options.forEach((opt) => {
      options.push({
        label: opt,
        checked: selectedValues.includes(opt) ? 'on' : undefined,
      });
    });

    return options;
  }, [variable.options, variable.includeAll, variable.multi, selectedValues, isAllSelected]);

  const handleChange = useCallback(
    (newOptions: EuiSelectableOption[]) => {
      // Check if "All" option exists and was toggled
      const allOption = newOptions.find((opt) => opt.key === ALL_OPTION_VALUE);
      const allIsChecked = allOption?.checked === 'on';

      if (variable.includeAll && variable.multi && allOption) {
        if (allIsChecked && !isAllSelected) {
          // "All" was just checked → select all real options
          onValuesChange(variable.id, [...variable.options]);
          return;
        } else if (!allIsChecked && isAllSelected) {
          // "All" was just unchecked → deselect all
          onValuesChange(variable.id, []);
          return;
        }
      }

      // Normal selection: filter out the "All" pseudo-option
      const values = newOptions
        .filter((opt) => opt.checked === 'on' && opt.key !== ALL_OPTION_VALUE)
        .map((opt) => opt.label);
      onValuesChange(variable.id, values);

      // Close popover after selection for single-select mode
      if (!variable.multi && values.length > 0) {
        setIsOpen(false);
      }
    },
    [
      variable.id,
      variable.includeAll,
      variable.multi,
      variable.options,
      isAllSelected,
      onValuesChange,
    ]
  );

  // Calculate popover width based on longest option label
  const popoverWidth = useMemo(() => {
    const longestLength = variable.options.reduce((max, opt) => Math.max(max, opt.length), 0);
    // ~8px per char + 60px for checkbox/padding/scrollbar
    return Math.max(300, Math.min(longestLength * 8 + 60, 700));
  }, [variable.options]);

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
    if (isAllSelected) {
      return i18n.translate('dashboard.variables.allSelected', { defaultMessage: 'All' });
    }
    if (selectedValues.length > 0) {
      return selectedValues[0];
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
      closePopover={() => setIsOpen(false)}
      panelPaddingSize="none"
      anchorPosition="downLeft"
      panelStyle={{ width: popoverWidth }}
    >
      <EuiSelectable
        options={selectableOptions}
        onChange={handleChange}
        searchable
        searchProps={{
          placeholder: i18n.translate('dashboard.variables.searchPlaceholder', {
            defaultMessage: 'Contains...',
          }),
          compressed: true,
        }}
        height={300}
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
          {isEditMode && (
            <EuiFlexItem grow={false}>
              <EuiSmallButtonEmpty
                iconType="list"
                iconSide="left"
                aria-label={i18n.translate('dashboard.variables.manageVariables', {
                  defaultMessage: 'Manage variables',
                })}
                onClick={onManageVariables}
                data-test-subj="manageVariablesButton"
              >
                {i18n.translate('dashboard.variables.manageVariables', {
                  defaultMessage: 'Manage variables',
                })}
              </EuiSmallButtonEmpty>
            </EuiFlexItem>
          )}
          {visibleVariables.map((variable) => (
            <EuiFlexItem key={variable.id} grow={false}>
              <EuiFlexGroup gutterSize="xs" alignItems="center">
                <EuiFlexItem grow={false}>
                  <ValueSelector variable={variable} onValuesChange={handleValueChange} />
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
