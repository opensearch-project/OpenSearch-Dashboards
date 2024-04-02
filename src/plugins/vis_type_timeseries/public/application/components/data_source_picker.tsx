/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import _ from 'lodash';

import { SavedObjectsClientContract, ToastsStart } from 'src/core/public';
import {
  DataSourceManagementPluginSetup,
  DataSourceOption,
} from 'src/plugins/data_source_management/public';
import { PanelSchema } from 'src/plugins/vis_type_timeseries/common/types';
import { DATA_SOURCE_ID_KEY } from '../../../common/constants';

/**
 * Provide only the necessary plugin setup/start and dataSourceId and this component will render a DataSourceSelector with a default selection
 *
 * @property {SavedObjectsClientContract} savedObjectsClient
 * @property {DataSourceManagementPluginSetup} dataSourceManagement
 * @property {ToastsStart} toasts
 * @property {string} [defaultDataSourceId] - the datasource id as the default option when the component first renders
 * @property {(e: DataSourceOption[]) => void} handleChange - the function that will update the model when a datasource is selected
 * @property {boolean} hideLocalCluster - the config option to hide the local cluster
 */
export interface DataSourcePickerProps {
  savedObjectsClient: SavedObjectsClientContract;
  dataSourceManagement: DataSourceManagementPluginSetup;
  toasts: ToastsStart;
  defaultDataSourceId?: string;
  handleChange: (e: DataSourceOption[]) => void;
  hideLocalCluster: boolean;
}

/**
 * Provides a wrapper around the DataSourceSelector component exposed by core
 *
 * @param {DataSourcePickerProps} props
 * @returns the DataSourceSelector
 */
export const DataSourcePicker = (props: DataSourcePickerProps) => {
  const { savedObjectsClient, defaultDataSourceId, handleChange } = props;
  const [defaultOption, setDefaultOption] = useState<DataSourceOption[]>();
  const DataSourceSelector = props.dataSourceManagement.ui.DataSourceSelector;

  const onDataSourceSelectChange = (dataSourceOption: DataSourceOption[]) => {
    setDefaultOption(dataSourceOption);
    handleChange(dataSourceOption);
  };

  useEffect(() => {
    if (!defaultDataSourceId) {
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
      hideLocalCluster={props.hideLocalCluster}
    />
  );
};

export const createDataSourcePickerHandler = (handleChange: (e: PanelSchema) => void) => {
  return (selectedOptions: []): void => {
    return handleChange?.({
      [DATA_SOURCE_ID_KEY]: _.get(selectedOptions, '[0].id', null),
    } as PanelSchema);
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
