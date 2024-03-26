/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import _ from 'lodash';

import { SavedObjectsClientContract, ToastsStart } from 'src/core/public';
import { DataSourceManagementPluginSetup } from 'src/plugins/data_source_management/public';
import { DATA_SOURCE_ID_KEY } from '../../../common/constants';

export interface DataSourcePickerProps {
  model: any;
  savedObjectsClient: SavedObjectsClientContract;
  dataSourceManagement: DataSourceManagementPluginSetup;
  toasts: ToastsStart;
  onChange: () => void;
}

export const DataSourcePicker = (props: DataSourcePickerProps) => {
  const { savedObjectsClient, model } = props;
  const [defaultOption, setDefaultOption] = useState<DataSourceOption[]>();
  const handleSelectChange = createDataSourcePickerHandler(props.onChange);
  const DataSourceSelector = props.dataSourceManagement.ui.DataSourceSelector;

  const onDataSourceSelectChange = (dataSourceOption: DataSourceOption[]) => {
    handleSelectChange(dataSourceOption);
  };

  useEffect(() => {
    (async () => {
      const id = model[DATA_SOURCE_ID_KEY] || undefined;
      if (!!id) {
        const label = await getDataSourceTitleFromId(id, savedObjectsClient);
        setDefaultOption([
          {
            id,
            label,
          },
        ]);
      }
    })();
  });

  return (
    <DataSourceSelector
      savedObjectsClient={savedObjectsClient}
      notifications={props.toasts}
      onSelectedDataSource={onDataSourceSelectChange}
      defaultOption={defaultOption}
      disabled={false}
      fullWidth={false}
      removePrepend={true}
      // @ts-expect-error
      filterFunc={(ds) => ds.attributes.auth.type !== 'no_auth'}
    />
  );
};

const createDataSourcePickerHandler = (handleChange: any) => {
  return (selectedOptions: DataSourceOption[]): void => {
    return handleChange?.({
      [DATA_SOURCE_ID_KEY]: _.get(selectedOptions, '[0].id', null),
    });
  };
};

const getDataSourceTitleFromId = async (
  id: string,
  savedObjectsClient: SavedObjectsClientContract
) => {
  return savedObjectsClient.get('data-source', id).then((response) => {
    // @ts-expect-error
    return response.attributes ? response.attributes.title : undefined;
  });
};
