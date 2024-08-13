/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { EuiSpacer, EuiFormLabel, EuiSelectable, EuiText, EuiSelectableOption } from '@elastic/eui';
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
  const [dataSourcesOptions, setDataSourcesOptions] = useState<EuiSelectableOption[]>([]);
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

  const handleSelect = useCallback(
    (newOptions) => {
      setDataSourcesOptions(newOptions);
      const newSelectedOptions = [];
      for (const option of newOptions) {
        if (option.checked === 'on')
          newSelectedOptions.push({ title: option.label, id: option.value });
      }
      onChange(newSelectedOptions);
    },
    [onChange]
  );

  return (
    <div>
      <EuiFormLabel>
        <EuiText size="xs">
          {i18n.translate('workspace.form.selectDataSource.subTitle', {
            defaultMessage: 'Add data sources that will be available in the workspace',
          })}
        </EuiText>
      </EuiFormLabel>
      <EuiSpacer size="m" />
      <EuiSelectable
        style={{ maxWidth: 400 }}
        searchable
        searchProps={{
          placeholder: i18n.translate('workspace.form.selectDataSource.searchBar', {
            defaultMessage: 'Search',
          }),
        }}
        listProps={{ bordered: true, rowHeight: 32, showIcons: true }}
        options={dataSourcesOptions}
        onChange={handleSelect}
      >
        {(list, search) => (
          <>
            {search}
            {list}
          </>
        )}
      </EuiSelectable>
    </div>
  );
};
