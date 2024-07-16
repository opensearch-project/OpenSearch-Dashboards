/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  EuiButton,
  EuiFormRow,
  EuiText,
  EuiSpacer,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButtonIcon,
  EuiComboBox,
  EuiComboBoxOptionOption,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { SavedObjectsStart } from '../../../../../core/public';
import { getDataSourcesList } from '../../utils';
import { DataSource } from '../../../common/types';
import { WorkspaceFormError } from './types';

export interface SelectDataSourcePanelProps {
  errors?: { [key: number]: WorkspaceFormError };
  savedObjects: SavedObjectsStart;
  selectedDataSources: DataSource[];
  onChange: (value: DataSource[]) => void;
}

export const SelectDataSourcePanel = ({
  errors,
  onChange,
  selectedDataSources,
  savedObjects,
}: SelectDataSourcePanelProps) => {
  const [dataSourcesOptions, setDataSourcesOptions] = useState<EuiComboBoxOptionOption[]>([]);
  useEffect(() => {
    if (!savedObjects) return;
    getDataSourcesList(savedObjects.client, ['*']).then((result) => {
      const options = result.map(({ title, id }) => ({
        label: title,
        value: id,
      }));
      setDataSourcesOptions(options);
    });
  }, [savedObjects, setDataSourcesOptions]);
  const handleAddNewOne = useCallback(() => {
    onChange?.([
      ...selectedDataSources,
      {
        title: '',
        id: '',
      },
    ]);
  }, [onChange, selectedDataSources]);

  const handleSelect = useCallback(
    (selectedOptions, index) => {
      const newOption = selectedOptions[0]
        ? // Select new data source
          {
            title: selectedOptions[0].label,
            id: selectedOptions[0].value,
          }
        : // Click reset button
          {
            title: '',
            id: '',
          };
      const newSelectedOptions = [...selectedDataSources];
      newSelectedOptions.splice(index, 1, newOption);

      onChange(newSelectedOptions);
    },
    [onChange, selectedDataSources]
  );

  const handleDelete = useCallback(
    (index) => {
      const newSelectedOptions = [...selectedDataSources];
      newSelectedOptions.splice(index, 1);

      onChange(newSelectedOptions);
    },
    [onChange, selectedDataSources]
  );

  return (
    <div>
      <EuiText>
        <strong>
          {i18n.translate('workspace.form.selectDataSource.subTitle', {
            defaultMessage: 'Data source',
          })}
        </strong>
      </EuiText>
      <EuiSpacer size="s" />
      {selectedDataSources.map(({ id, title }, index) => (
        <EuiFormRow
          key={index}
          isInvalid={!!errors?.[index]}
          error={errors?.[index]?.message}
          fullWidth
        >
          <EuiFlexGroup alignItems="flexEnd" gutterSize="m">
            <EuiFlexItem style={{ maxWidth: 400 }}>
              <EuiComboBox
                data-test-subj="workspaceForm-select-dataSource-comboBox"
                singleSelection
                options={dataSourcesOptions}
                selectedOptions={
                  id
                    ? [
                        {
                          label: title,
                          value: id,
                        },
                      ]
                    : []
                }
                onChange={(selectedOptions) => handleSelect(selectedOptions, index)}
                placeholder="Select"
              />
            </EuiFlexItem>
            <EuiFlexItem style={{ maxWidth: 332 }}>
              <EuiButtonIcon
                color="danger"
                aria-label="Delete data source"
                iconType="trash"
                display="empty"
                size="m"
                onClick={() => handleDelete(index)}
                isDisabled={false}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFormRow>
      ))}

      <EuiButton
        fill
        fullWidth={false}
        onClick={handleAddNewOne}
        data-test-subj={`workspaceForm-select-dataSource-addNew`}
      >
        {i18n.translate('workspace.form.selectDataSourcePanel.addNew', {
          defaultMessage: 'Add New',
        })}
      </EuiButton>
    </div>
  );
};
