/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { DataSourceSelector } from './datasource_selector';
import { DataSourceType } from '../datasource_services';
import { DataSourceGroup, DataSourceOption, DataSourceSelectableProps } from './types';
import { ISourceDataSet } from '../datasource/types';
import { IndexPattern } from '../../index_patterns';

type DataSourceTypeKey = 'DEFAULT_INDEX_PATTERNS' | 's3glue' | 'spark';

// Mapping between datasource type and its display name.
const DATASOURCE_TYPE_DISPLAY_NAME_MAP: Record<DataSourceTypeKey, string> = {
  DEFAULT_INDEX_PATTERNS: 'Index patterns',
  s3glue: 'Amazon S3',
  spark: 'Spark',
};

type DataSetType = string | IndexPattern;

interface DataSetWithSource {
  ds: DataSourceType;
  data_sets: string[] | IndexPattern[];
}

export const DataSourceSelectable = ({
  dataSources, // list of all available datasource connections.
  dataSourceOptionList, // combo box renderable option list derived from dataSources
  selectedSources, // current selected datasource in the form of [{ label: xxx, value: xxx }]
  onDataSourceSelect,
  setDataSourceOptionList,
  onFetchDataSetError, //   onFetchDataSetError, Callback for handling dataset fetch errors. Ensure it's memoized.
  singleSelection = true,
}: DataSourceSelectableProps) => {
  // This effect fetches datasets and prepares the datasource list for UI rendering.
  useEffect(() => {
    // Fetches datasets for a given datasource and returns it along with the source.
    const fetchDataSetWithSource = async (ds: DataSourceType): Promise<DataSetWithSource> => {
      const dataSet = await ds.getDataSet();
      return {
        ds,
        data_sets: dataSet,
      };
    };

    // Map through all data sources and fetch their respective datasets.
    const fetchDataSets = () => dataSources.map((ds: DataSourceType) => fetchDataSetWithSource(ds));

    // const isIndexPatterns = (dataset: string | IndexPattern) =>
    //   dataset.attributes?.title && dataset.id;

    const isIndexPatterns = (dataset: string | IndexPattern): boolean => {
      if (typeof dataset === 'object' && 'attributes' in dataset) {
        return Boolean(dataset.attributes?.title && dataset.id);
      }
      return false;
    };

    // Get the option format for the combo box from the dataSource and dataSet.
    const getSourceOptions = (dataSource: DataSourceType, dataSet: DataSetType) => {
      const optionContent = {
        type: dataSource.getType(),
        name: dataSource.getName(),
        ds: dataSource,
      };
      if (isIndexPatterns(dataSet)) {
        return {
          ...optionContent,
          label: dataSet.attributes.title,
          value: dataSet.id,
        };
      }
      return {
        ...optionContent,
        label: dataSource.getName(),
        value: dataSource.getName(),
      };
    };

    // Convert fetched datasets into a structured format suitable for selector rendering.
    const getSourceList = (allDataSets: ISourceDataSet[]) => {
      const finalList = [] as DataSourceGroup[];
      allDataSets.forEach((curDataSet) => {
        const existingGroup = finalList.find(
          (item) => item.label === DATASOURCE_TYPE_DISPLAY_NAME_MAP[curDataSet.ds.getType()]
        );
        // check if add new datasource group or add to existing one
        if (existingGroup) {
          existingGroup.options = [
            ...existingGroup.options,
            ...curDataSet.data_sets?.map((dataSet: DataSetType) =>
              getSourceOptions(curDataSet.ds, dataSet)
            ),
          ];
        } else {
          finalList.push({
            label: DATASOURCE_TYPE_DISPLAY_NAME_MAP[curDataSet.ds.getType()] || 'Default Group',
            options: curDataSet.data_sets?.map((dataSet: DataSetType) =>
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
  }, [dataSources, setDataSourceOptionList, onFetchDataSetError]);

  const handleSourceChange = (selectedOptions: DataSourceOption[]) =>
    onDataSourceSelect(selectedOptions);

  return (
    <DataSourceSelector
      dataSourceList={dataSourceOptionList}
      selectedOptions={selectedSources}
      onDataSourceChange={handleSourceChange}
      singleSelection={singleSelection}
    />
  );
};
