/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiButton,
  EuiButtonEmpty,
  EuiComboBox,
  EuiComboBoxOptionOption,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiPopover,
  EuiPopoverFooter,
  EuiPopoverTitle,
  EuiSpacer,
  htmlIdGenerator,
} from '@elastic/eui';
import producer from 'immer';
import React, { ChangeEvent, useEffect, useState } from 'react';
import { ACCELERATION_AGGREGRATION_FUNCTIONS } from '../../../../../../framework/constants';
import {
  AggregationFunctionType,
  CreateAccelerationForm,
  MaterializedViewColumn,
} from '../../../../../../framework/types';

interface AddColumnPopOverProps {
  isColumnPopOverOpen: boolean;
  setIsColumnPopOverOpen: React.Dispatch<React.SetStateAction<boolean>>;
  columnExpressionValues: MaterializedViewColumn[];
  setColumnExpressionValues: React.Dispatch<React.SetStateAction<MaterializedViewColumn[]>>;
  accelerationFormData: CreateAccelerationForm;
  setAccelerationFormData: React.Dispatch<React.SetStateAction<CreateAccelerationForm>>;
}

export const AddColumnPopOver = ({
  isColumnPopOverOpen,
  setIsColumnPopOverOpen,
  columnExpressionValues,
  setColumnExpressionValues,
  accelerationFormData,
  setAccelerationFormData,
}: AddColumnPopOverProps) => {
  const [selectedFunction, setSelectedFunction] = useState([
    ACCELERATION_AGGREGRATION_FUNCTIONS[0],
  ]);
  const [selectedField, setSelectedField] = useState<EuiComboBoxOptionOption[]>([]);
  const [selectedAlias, setSeletedAlias] = useState('');

  const resetSelectedField = () => {
    if (accelerationFormData.dataTableFields.length > 0) {
      const defaultFieldName = accelerationFormData.dataTableFields[0].fieldName;
      setSelectedField([{ label: defaultFieldName }]);
    }
  };

  const resetValues = () => {
    setSelectedFunction([ACCELERATION_AGGREGRATION_FUNCTIONS[0]]);
    resetSelectedField();
    setSeletedAlias('');
  };

  const onChangeAlias = (e: ChangeEvent<HTMLInputElement>) => {
    setSeletedAlias(e.target.value);
  };

  const onAddExpression = () => {
    const newColumnExpresionValue = [
      ...columnExpressionValues,
      {
        id: htmlIdGenerator()(),
        functionName: selectedFunction[0].label as AggregationFunctionType,
        functionParam: selectedField[0].label,
        fieldAlias: selectedAlias,
      },
    ];

    setAccelerationFormData(
      producer((accData) => {
        accData.materializedViewQueryData.columnsValues = newColumnExpresionValue;
      })
    );

    setColumnExpressionValues(newColumnExpresionValue);
    setIsColumnPopOverOpen(false);
  };

  useEffect(() => {
    resetSelectedField();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <EuiPopover
      panelPaddingSize="s"
      button={
        <EuiButtonEmpty
          iconType="plusInCircle"
          aria-label="add column"
          onClick={() => {
            resetValues();
            setIsColumnPopOverOpen(!isColumnPopOverOpen);
          }}
          size="xs"
        >
          Add Column
        </EuiButtonEmpty>
      }
      isOpen={isColumnPopOverOpen}
      closePopover={() => setIsColumnPopOverOpen(false)}
    >
      <EuiPopoverTitle>Add Column</EuiPopoverTitle>
      <>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiFormRow label="Function">
              <EuiComboBox
                singleSelection={{ asPlainText: true }}
                options={ACCELERATION_AGGREGRATION_FUNCTIONS}
                selectedOptions={selectedFunction}
                onChange={setSelectedFunction}
                isClearable={false}
              />
            </EuiFormRow>
          </EuiFlexItem>
          {selectedFunction[0].label !== 'window.start' && (
            <EuiFlexItem>
              <EuiFormRow label="Aggregation field">
                <EuiComboBox
                  singleSelection={{ asPlainText: true }}
                  options={[
                    { label: '*', disabled: selectedFunction[0].label !== 'count' },
                    ...accelerationFormData.dataTableFields.map((x) => ({ label: x.fieldName })),
                  ]}
                  selectedOptions={selectedField}
                  onChange={setSelectedField}
                  isClearable={false}
                />
              </EuiFormRow>
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
        <EuiSpacer size="m" />
        <EuiFormRow label="Column alias - optional">
          <EuiFieldText name="aliasField" onChange={onChangeAlias} />
        </EuiFormRow>
      </>
      <EuiPopoverFooter>
        <EuiButton size="s" fill onClick={onAddExpression}>
          Add
        </EuiButton>
      </EuiPopoverFooter>
    </EuiPopover>
  );
};
