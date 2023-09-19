/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useCallback } from 'react';
import { DataSourceSelector } from './datasource_selector';
import { DataSourceType } from '../datasource_services';
import { DataSourceList, DataSourceSelectableProps } from './types';

export const DataSourceSelectable = ({
  dataSources,
  dataSourceOptionList,
  selectedSources,
  setSelectedSources,
  setDataSourceOptionList,
  onFetchDataSetError,
  singleSelection = true,
}: DataSourceSelectableProps) => {
  const fetchDataSets = useCallback(
    () => dataSources.map((ds: DataSourceType) => ds.getDataSet()),
    [dataSources]
  );

  const isIndexPatterns = (dataset) => dataset.attributes;

  useEffect(() => {
    const getSourceOptions = (dataSource: DataSourceType, dataSet) => {
      if (isIndexPatterns(dataSet)) {
        return {
          label: dataSet.attributes.title,
          value: dataSet.id,
          ds: dataSource,
        };
      }
      return { label: dataSet, ds: dataSource };
    };

    const getSourceList = (allDataSets) => {
      const finalList = [] as DataSourceList[];
      allDataSets.map((curDataSet) => {
        const existingGroup = finalList.find((item) => item.label === curDataSet.ds.getType());
        // check if add new datasource group or add to existing one
        if (existingGroup) {
          existingGroup.options = [
            ...existingGroup.options,
            ...curDataSet.data_sets?.map((dataSet) => {
              return getSourceOptions(curDataSet.ds, dataSet);
            }),
          ];
        } else {
          finalList.push({
            label: curDataSet.ds.getType(),
            options: curDataSet.data_sets?.map((dataSet) => {
              return getSourceOptions(curDataSet.ds, dataSet);
            }),
          });
        }
      });
      return finalList;
    };

    Promise.all(fetchDataSets())
      .then((results) => {
        setDataSourceOptionList([...getSourceList(results)]);
      })
      .catch((e) => onFetchDataSetError(e));
  }, [dataSources, fetchDataSets, setDataSourceOptionList, onFetchDataSetError]);

  const handleSourceChange = (selectedOptions) => {
    setSelectedSources(selectedOptions);
  };

  return (
    <DataSourceSelector
      dataSourceList={dataSourceOptionList}
      selectedOptions={selectedSources}
      onDataSourceChange={handleSourceChange}
      singleSelection={singleSelection}
    />
  );
};
