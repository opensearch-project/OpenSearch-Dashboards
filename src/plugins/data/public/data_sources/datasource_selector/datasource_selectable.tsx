/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { i18n } from '@osd/i18n';
import { EuiComboBox } from '@elastic/eui';
import { DataSourceType, GenericDataSource } from '../datasource_services';
import { DataSourceGroup, DataSourceSelectableProps } from './types';
import { ISourceDataSet, IndexPatternOption } from '../datasource';

type DataSourceTypeKey = 'DEFAULT_INDEX_PATTERNS' | 's3glue' | 'spark';

// Mapping between datasource type and its display name.
const DATASOURCE_TYPE_DISPLAY_NAME_MAP: Record<DataSourceTypeKey, string> = {
  DEFAULT_INDEX_PATTERNS: 'Index patterns',
  s3glue: 'Amazon S3',
  spark: 'Spark',
};

type DataSetType = string | IndexPatternOption;

interface DataSetWithSource {
  ds: GenericDataSource;
  data_sets: string[] | IndexPatternOption[];
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
    const fetchDataSetWithSource = async (ds: GenericDataSource): Promise<DataSetWithSource> => {
      const dataSet = await ds.getDataSet();
      return {
        ds,
        data_sets: dataSet,
      };
    };

    // Map through all data sources and fetch their respective datasets.
    const fetchDataSets = () => dataSources.map((ds: DataSourceType) => fetchDataSetWithSource(ds));

    const isIndexPatterns = (dataset: string | IndexPatternOption): boolean => {
      if (typeof dataset === 'string') return false;

      return dataset.title !== undefined && dataset.id !== undefined;
    };

    // Get the option format for the combo box from the dataSource and dataSet.
    const getSourceOptions = (dataSource: DataSourceType, dataSet: DataSetType) => {
      const optionContent = {
        type: dataSource.getType(),
        name: dataSource.getName(),
        ds: dataSource,
      };
      if (isIndexPatterns(dataSet)) {
        const ip = dataSet as IndexPatternOption;
        return {
          ...optionContent,
          label: ip.title,
          value: ip.id,
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
        const typeKey = curDataSet.ds.getType() as DataSourceTypeKey;
        const groupName = DATASOURCE_TYPE_DISPLAY_NAME_MAP[typeKey] || 'Default Group';

        const existingGroup = finalList.find((item) => item.label === groupName);
        const mappedOptions = curDataSet.data_sets?.map((dataSet) =>
          getSourceOptions(curDataSet.ds, dataSet)
        );

        // check if add new datasource group or add to existing one
        if (existingGroup) {
          const existingOptionIds = new Set(existingGroup.options.map((opt) => opt.label));
          const nonDuplicateOptions = mappedOptions.filter(
            (opt) => !existingOptionIds.has(opt.label)
          );
          existingGroup.options.push(...nonDuplicateOptions);
        } else {
          finalList.push({
            label: groupName,
            options: mappedOptions,
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

  const handleSourceChange = (selectedOptions: any) => onDataSourceSelect(selectedOptions);

  return (
    <EuiComboBox
      data-test-subj="dataExplorerDSSelect"
      placeholder={i18n.translate('data.datasource.selectADatasource', {
        defaultMessage: 'Select a datasource',
      })}
      options={dataSourceOptionList as any}
      selectedOptions={selectedSources as any}
      onChange={handleSourceChange}
      singleSelection={singleSelection}
      async
    />
  );
};
