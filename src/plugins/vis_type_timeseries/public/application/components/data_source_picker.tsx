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
  savedObjectsClient: SavedObjectsClientContract;
  dataSourceManagement: DataSourceManagementPluginSetup;
  toasts: ToastsStart;
  defaultDataSourceId?: string;
  handleChange: (e: Array<{}>) => void;
}

export const DataSourcePicker = (props: DataSourcePickerProps) => {
  const { savedObjectsClient, defaultDataSourceId, handleChange } = props;
  const [defaultOption, setDefaultOption] = useState<Array<{ id: string; label: string }>>();
  const DataSourceSelector = props.dataSourceManagement.ui.DataSourceSelector;

  const onDataSourceSelectChange = (dataSourceOption: Array<{ id: string; label: string }>) => {
    setDefaultOption(dataSourceOption);
    handleChange(dataSourceOption);
  };

  useEffect(() => {
    if (!defaultDataSourceId || defaultDataSourceId === '') {
      // @ts-expect-error
      setDefaultOption(null);
      return;
    }

    getDataSourceTitleFromId(defaultDataSourceId, savedObjectsClient).then((label) => {
      if (!!label) {
        setDefaultOption([
          {
            id: defaultDataSourceId,
            label,
          },
        ]);
        return;
      }
      // @ts-expect-error
      setDefaultOption(null);
    });
  }, [defaultDataSourceId, savedObjectsClient]);

  if (defaultOption === undefined) {
    return <div>Loading...</div>;
  }

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

export const createDataSourcePickerHandler = (handleChange: any) => {
  return (selectedOptions: []): void => {
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
