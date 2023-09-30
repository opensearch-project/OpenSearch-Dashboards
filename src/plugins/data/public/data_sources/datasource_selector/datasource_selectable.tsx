/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useCallback } from 'react';
import { DataSourceSelector } from './datasource_selector';
import { DataSourceType } from '../datasource_services';
import { DataSourceGroup, DataSourceOptionType, DataSourceSelectableProps } from './types';
import { ISourceDataSet } from '../datasource/types';
import { IndexPattern } from '../../index_patterns';

const DATASOURCE_GRUOP_MAP = {
  DEFAULT_INDEX_PATTERNS: 'Index patterns',
  s3glue: 'Amazon S3',
  spark: 'Spark',
};

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

  const isIndexPatterns = (dataset: string | IndexPattern) =>
    dataset.attributes?.title && dataset.id;

  useEffect(() => {
    const getSourceOptions = (dataSource: DataSourceType, dataSet: string | IndexPattern) => {
      if (isIndexPatterns(dataSet)) {
        return {
          label: dataSet.attributes.title,
          value: dataSet.id,
          type: dataSource.getType(),
          name: dataSource.getName(),
          ds: dataSource,
        };
      }
      return {
        label: dataSet,
        type: dataSource.getType(),
        name: dataSource.getName(),
        ds: dataSource,
      };
    };

    const getSourceList = (allDataSets: ISourceDataSet[]) => {
      const finalList = [] as DataSourceGroup[];
      allDataSets.forEach((curDataSet) => {
        const existingGroup = finalList.find(
          (item) => item.label === DATASOURCE_GRUOP_MAP[curDataSet.ds.getType()]
        );
        // check if add new datasource group or add to existing one
        if (existingGroup) {
          existingGroup.options = [
            ...existingGroup.options,
            ...curDataSet.data_sets?.map((dataSet) => getSourceOptions(curDataSet.ds, dataSet)),
          ];
        } else {
          finalList.push({
            label: DATASOURCE_GRUOP_MAP[curDataSet.ds.getType()] || 'Default Group',
            options: curDataSet.data_sets?.map((dataSet) =>
              getSourceOptions(curDataSet.ds, dataSet)
            ),
          });
        }
      });
      return finalList;
    };

    Promise.all(fetchDataSets())
      .then((results) => {
        setDataSourceOptionList(getSourceList(results));
      })
      .catch((e) => onFetchDataSetError(e));
  }, [fetchDataSets, setDataSourceOptionList, onFetchDataSetError]);

  const handleSourceChange = (selectedOptions: DataSourceOptionType[]) => {
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
