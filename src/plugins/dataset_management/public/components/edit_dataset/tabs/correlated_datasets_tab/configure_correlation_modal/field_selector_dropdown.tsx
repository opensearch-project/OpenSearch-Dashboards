/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiComboBox, EuiComboBoxOptionOption } from '@elastic/eui';
import { IndexPatternField } from '../../../../../../../data/public';

interface FieldSelectorDropdownProps {
  fields: IndexPatternField[];
  selectedField: string | undefined;
  onChange: (fieldName: string | undefined) => void;
  placeholder: string;
  filterFieldTypes?: string[];
  isInvalid?: boolean;
  'data-test-subj'?: string;
}

export const FieldSelectorDropdown: React.FC<FieldSelectorDropdownProps> = ({
  fields,
  selectedField,
  onChange,
  placeholder,
  filterFieldTypes,
  isInvalid = false,
  'data-test-subj': dataTestSubj,
}) => {
  // Filter fields by type if specified
  const filteredFields = filterFieldTypes
    ? fields.filter((field) => filterFieldTypes.includes(field.type))
    : fields;

  // Convert fields to combo box options
  const options: Array<EuiComboBoxOptionOption<string>> = filteredFields.map((field) => ({
    label: field.name,
    value: field.name,
  }));

  // Find selected option
  const selectedOptions = selectedField ? options.filter((opt) => opt.value === selectedField) : [];

  const handleChange = (selectedOpts: Array<EuiComboBoxOptionOption<string>>) => {
    if (selectedOpts.length > 0) {
      onChange(selectedOpts[0].value as string);
    } else {
      onChange(undefined);
    }
  };

  return (
    <EuiComboBox
      placeholder={placeholder}
      singleSelection={{ asPlainText: true }}
      options={options}
      selectedOptions={selectedOptions}
      onChange={handleChange}
      isInvalid={isInvalid}
      isClearable={true}
      data-test-subj={dataTestSubj}
      fullWidth
    />
  );
};
