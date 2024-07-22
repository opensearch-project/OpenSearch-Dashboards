/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiComboBox,
  EuiComboBoxOptionOption,
  EuiExpression,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPopover,
  EuiPopoverTitle,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import React, { useState } from 'react';
import { ACCELERATION_ADD_FIELDS_TEXT } from '../../../../../../framework/constants';
import { CreateAccelerationForm } from '../../../../../../framework/types';
import { hasError } from '../../create/utils';

interface CoveringIndexBuilderProps {
  accelerationFormData: CreateAccelerationForm;
  setAccelerationFormData: React.Dispatch<React.SetStateAction<CreateAccelerationForm>>;
}

export const CoveringIndexBuilder = ({
  accelerationFormData,
  setAccelerationFormData,
}: CoveringIndexBuilderProps) => {
  const [isPopOverOpen, setIsPopOverOpen] = useState(false);
  const [columnsValue, setColumnsValue] = useState(ACCELERATION_ADD_FIELDS_TEXT);
  const [selectedOptions, setSelectedOptions] = useState<EuiComboBoxOptionOption[]>([]);

  const onChange = (_selectedOptions: EuiComboBoxOptionOption[]) => {
    let expressionValue = ACCELERATION_ADD_FIELDS_TEXT;
    if (_selectedOptions.length > 0) {
      expressionValue = `(${_selectedOptions.map((option) => option.label).join(', ')})`;
    }
    setAccelerationFormData({
      ...accelerationFormData,
      coveringIndexQueryData: _selectedOptions.map((option) => option.label),
    });
    setColumnsValue(expressionValue);
    setSelectedOptions(_selectedOptions);
  };

  return (
    <>
      <EuiText data-test-subj="covering-index-builder">
        <h3>Covering index definition</h3>
      </EuiText>
      <EuiSpacer size="s" />
      <EuiFlexGroup direction="column" gutterSize="xs">
        <EuiFlexItem grow={false}>
          <EuiExpression
            description="CREATE INDEX"
            value={accelerationFormData.accelerationIndexName}
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiExpression
            description="ON"
            color="accent"
            value={`${accelerationFormData.dataSource}.${accelerationFormData.database}.${accelerationFormData.dataTable}`}
          />
          <EuiPopover
            id="coveringIndexFieldsPopOver"
            button={
              <EuiExpression
                description=""
                value={columnsValue}
                isActive={isPopOverOpen}
                onClick={() => setIsPopOverOpen(true)}
                isInvalid={
                  hasError(accelerationFormData.formErrors, 'coveringIndexError') &&
                  columnsValue === ACCELERATION_ADD_FIELDS_TEXT
                }
              />
            }
            isOpen={isPopOverOpen}
            closePopover={() => setIsPopOverOpen(false)}
            panelPaddingSize="s"
            anchorPosition="downLeft"
          >
            <>
              <EuiPopoverTitle paddingSize="l">Columns</EuiPopoverTitle>
              <EuiComboBox
                placeholder="Select one or more options"
                options={accelerationFormData.dataTableFields.map((x) => ({ label: x.fieldName }))}
                selectedOptions={selectedOptions}
                onChange={onChange}
              />
            </>
          </EuiPopover>
        </EuiFlexItem>
      </EuiFlexGroup>
    </>
  );
};
