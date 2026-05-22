/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import {
  EuiFormRow,
  EuiSelectable,
  EuiSelectableOption,
  EuiPopover,
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';

import { FieldSchema } from './index';

interface FieldSelectorProps {
  configField?: string | undefined;
  configFields?: string[];
  availableFields: FieldSchema[];
  updateConfigField?: (fieldSchema: FieldSchema | undefined) => void;
  updateConfigFields?: (fields: FieldSchema[]) => void;
  testSubjPrefix?: string;
  showLabel?: boolean;
  supportMulti?: boolean;
  supportClearSelection?: boolean;
}

export const FieldSelector = ({
  configField,
  configFields,
  availableFields,
  updateConfigField,
  updateConfigFields,
  testSubjPrefix = 'field',
  showLabel = true,
  supportMulti = false,
  supportClearSelection = true,
}: FieldSelectorProps) => {
  const [isFieldPopoverOpen, setIsFieldPopoverOpen] = useState(false);

  const selectedSet = new Set(supportMulti ? configFields ?? [] : configField ? [configField] : []);

  const fieldOptions: EuiSelectableOption[] = availableFields.map((field) => ({
    label: field.name,
    checked: selectedSet.has(field.name) ? 'on' : undefined,
  }));

  const defaultLabel = i18n.translate('explore.transformations.fieldSelector.fieldLabel', {
    defaultMessage: 'Field',
  });

  const placeholder = i18n.translate(
    'explore.transformations.fieldSelector.selectFieldPlaceholder',
    {
      defaultMessage: 'Select field',
    }
  );

  const buttonLabel = supportMulti
    ? configFields && configFields.length > 0
      ? configFields.join(', ')
      : placeholder
    : configField || placeholder;

  const handleClearSelection = () => {
    if (supportMulti) {
      updateConfigFields?.([]);
    } else {
      updateConfigField?.(undefined);
    }
  };

  const hasSelection = supportMulti ? (configFields?.length ?? 0) > 0 : !!configField;

  return (
    <EuiFormRow label={showLabel ? defaultLabel : ''} display="columnCompressed">
      <EuiPopover
        button={
          <EuiFlexGroup gutterSize="none" alignItems="center">
            <EuiFlexItem>
              <EuiButtonEmpty
                size="s"
                onClick={() => setIsFieldPopoverOpen(!isFieldPopoverOpen)}
                iconType="arrowDown"
                iconSide="right"
                flush="left"
                data-test-subj={`${testSubjPrefix}SelectButton`}
              >
                {buttonLabel}
              </EuiButtonEmpty>
            </EuiFlexItem>
            {hasSelection && supportClearSelection && (
              <EuiFlexItem grow={false}>
                <EuiButtonIcon
                  iconType="cross"
                  size="s"
                  color="danger"
                  aria-label="Clear selection"
                  onClick={handleClearSelection}
                  data-test-subj={`${testSubjPrefix}ClearButton`}
                />
              </EuiFlexItem>
            )}
          </EuiFlexGroup>
        }
        isOpen={isFieldPopoverOpen}
        closePopover={() => setIsFieldPopoverOpen(false)}
        panelPaddingSize="none"
        anchorPosition="downLeft"
      >
        <EuiSelectable
          searchable
          searchProps={{
            compressed: true,
          }}
          options={fieldOptions}
          onChange={(newOptions) => {
            if (supportMulti) {
              const selected = newOptions
                .filter((opt) => opt.checked === 'on')
                .map((opt) => availableFields.find((f) => f.name === opt.label)!)
                .filter(Boolean);
              updateConfigFields?.(selected);
            } else {
              const selected = newOptions.find((opt) => opt.checked === 'on');
              const selectedFieldSchema = availableFields.find(
                (field) => field.name === selected?.label
              );
              updateConfigField?.(selectedFieldSchema);
              setIsFieldPopoverOpen(false);
            }
          }}
          singleSelection={!supportMulti}
          listProps={{ bordered: true }}
          height={240}
          data-test-subj={`${testSubjPrefix}Selectable`}
        >
          {(list, search) => (
            <>
              {search}
              {list}
            </>
          )}
        </EuiSelectable>
      </EuiPopover>
    </EuiFormRow>
  );
};
