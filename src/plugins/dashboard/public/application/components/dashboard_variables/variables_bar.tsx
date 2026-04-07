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
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { VariableService } from '../../../variables/variable_service';
import { VariableWithState } from '../../../variables/types';

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

  const displayText = isAllSelected
    ? i18n.translate('dashboard.variables.allSelected', { defaultMessage: 'All' })
    : selectedValues.length > 0
    ? selectedValues[0]
    : i18n.translate('dashboard.variables.selectValue', { defaultMessage: 'Select value' });
  const selectedCount = isAllSelected ? variable.options.length : selectedValues.length;

  // Button that triggers the popover (without label)
  const button = (
    <EuiSmallButtonEmpty
      onClick={() => setIsOpen(!isOpen)}
      iconType="arrowDown"
      iconSide="right"
      iconSize="s"
      color="text"
      style={{ width: 'fit-content', maxWidth: 'none', padding: '0px' }}
      data-test-subj={`variable-${variable.name}`}
      className="euiSuperSelectControl euiSuperSelectControl--compressed euiSuperSelectControl--inGroup"
    >
      <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
        <EuiFlexItem grow={true}>
          <EuiText
            size="s"
            style={{
              maxWidth: '50vw',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {displayText}
          </EuiText>
        </EuiFlexItem>
        {variable.multi && selectedCount > 0 && (
          <EuiFlexItem grow={false}>
            <EuiBadge color="primary">{selectedCount}</EuiBadge>
          </EuiFlexItem>
        )}
      </EuiFlexGroup>
    </EuiSmallButtonEmpty>
  );

  return (
    <EuiFlexGroup gutterSize="none" alignItems="stretch" responsive={false}>
      <EuiFlexItem
        grow={false}
        className="euiFormControlLayout euiFormControlLayout--compressed euiFormControlLayout--group"
      >
        <EuiText size="xs" color="subdued">
          <strong style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            {variable.label || variable.name}
            {variable.description && (
              <EuiToolTip content={variable.description} position="bottom">
                <EuiIcon type="iInCircle" style={{ padding: 0, width: 16 }} />
              </EuiToolTip>
            )}
          </strong>
        </EuiText>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
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
          >
            {(list, search) => (
              <div>
                <div style={{ padding: '8px 8px 0 8px' }}>{search}</div>
                {list}
              </div>
            )}
          </EuiSelectable>
        </EuiPopover>
      </EuiFlexItem>
    </EuiFlexGroup>
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
