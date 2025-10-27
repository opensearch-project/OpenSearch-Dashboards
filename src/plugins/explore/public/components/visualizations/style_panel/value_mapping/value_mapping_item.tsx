/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { i18n } from '@osd/i18n';
import { EuiFlexGroup, EuiFlexItem, EuiButtonIcon, EuiFormRow } from '@elastic/eui';

import { RangeValue, ValueMapping } from '../../types';
import { ColorGroupButton } from '../color_group_panel/color_group_button';
import { SelectColorButton } from '../color_group_panel/select_color_button';
import { DebouncedFieldText, DebouncedFieldNumber } from '../utils';

export const ValueMappingItem = ({
  id,
  mapping,
  onChange,
  onDelete,
}: {
  id: number;
  mapping: ValueMapping;
  onChange: (index: number, valueMappings: ValueMapping) => void;
  onDelete: (index: number) => void;
}) => {
  const [localMapping, setLocalMapping] = useState<ValueMapping>(mapping);

  const handleChangeMapping = <K extends keyof ValueMapping>(key: K, value: ValueMapping[K]) => {
    setLocalMapping({
      ...localMapping,
      [key]: value,
    });

    onChange(id, { ...localMapping, [key]: value });
  };

  return (
    <EuiFlexGroup gutterSize="s" alignItems="center">
      <EuiFlexItem>
        {localMapping.type === 'value' ? (
          <EuiFormRow
            label={i18n.translate('explore.vis.valueMapping.value', {
              defaultMessage: 'Value',
            })}
          >
            <DebouncedFieldText
              onChange={(text) => handleChangeMapping('value', text)}
              value={localMapping.value || ''}
              placeholder={i18n.translate('explore.vis.valueMapping.value.input', {
                defaultMessage: 'Exact value to match',
              })}
            />
          </EuiFormRow>
        ) : (
          <EuiFormRow
            label={i18n.translate('explore.vis.valueMapping.range', {
              defaultMessage: 'Range',
            })}
          >
            <EuiFlexGroup alignItems="center">
              {convertRangeValue(localMapping?.range, (val) => handleChangeMapping('range', val))}
            </EuiFlexGroup>
          </EuiFormRow>
        )}
      </EuiFlexItem>

      <EuiFlexItem>
        <EuiFormRow
          label={i18n.translate('explore.vis.valueMapping.displayText', {
            defaultMessage: 'Display text',
          })}
        >
          <DebouncedFieldText
            onChange={(text) => handleChangeMapping('displayText', text)}
            value={localMapping.displayText || ''}
            placeholder={i18n.translate('explore.vis.valueMapping.displayText.input', {
              defaultMessage: 'Optional display text',
            })}
          />
        </EuiFormRow>
      </EuiFlexItem>

      <EuiFlexItem grow={false}>
        <EuiFormRow hasEmptyLabelSpace>
          {localMapping.color ? (
            <EuiFlexGroup alignItems="center" justifyContent="center" gutterSize="none">
              <EuiFlexItem>
                <ColorGroupButton
                  buttonColor={localMapping.color}
                  onChange={(color) => handleChangeMapping('color', color)}
                />
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiButtonIcon
                  size="m"
                  iconType="cross"
                  aria-label="DeleteColor"
                  onClick={() => handleChangeMapping('color', undefined)}
                />
              </EuiFlexItem>
            </EuiFlexGroup>
          ) : (
            <SelectColorButton onChange={(color) => handleChangeMapping('color', color)} />
          )}
        </EuiFormRow>
      </EuiFlexItem>

      <EuiFlexItem grow={false}>
        <EuiFormRow hasEmptyLabelSpace>
          <EuiButtonIcon
            size="m"
            iconType="trash"
            aria-label="Delete"
            color="danger"
            onClick={() => onDelete(id)}
          />
        </EuiFormRow>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

const convertRangeValue = (
  input: RangeValue | undefined,
  updateRange: (rangeValue: RangeValue) => void
) => {
  return (
    <>
      <EuiFlexItem>
        <DebouncedFieldNumber
          value={input?.min}
          placeholder="From"
          onChange={(value) => updateRange({ ...input, min: value })}
        />
      </EuiFlexItem>
      <EuiFlexItem>
        <DebouncedFieldNumber
          value={input?.max}
          placeholder="To"
          onChange={(value) => updateRange({ ...input, max: value })}
        />
      </EuiFlexItem>
    </>
  );
};
