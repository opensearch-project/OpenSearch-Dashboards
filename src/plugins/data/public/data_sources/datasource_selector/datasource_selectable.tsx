/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useCallback } from 'react';
import { EuiComboBox } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { ISourceDataSet, IndexPatternOption } from '../datasource';
import { DataSourceType, GenericDataSource } from '../datasource_services';
import { DataSourceGroup, DataSourceSelectableProps } from './types';

type DataSourceTypeKey = 'DEFAULT_INDEX_PATTERNS' | 's3glue' | 'spark';

// Mapping between datasource type and its display name.
const DATASOURCE_TYPE_DISPLAY_NAME_MAP: Record<DataSourceTypeKey, string> = {
  DEFAULT_INDEX_PATTERNS: 'Index patterns',
  s3glue: 'Amazon S3',
  spark: 'Spark',
};

type DataSetType = ISourceDataSet['data_sets'][number];

// Get data sets for a given datasource and returns it along with the source.
const getDataSetWithSource = async (ds: GenericDataSource): Promise<ISourceDataSet> => {
  const dataSet = await ds.getDataSet();
  return {
    ds,
    data_sets: dataSet,
  };
};

// Map through all data sources and get their respective data sets.
const getDataSets = (dataSources: GenericDataSource[]) =>
  dataSources.map((ds) => getDataSetWithSource(ds));

export const isIndexPatterns = (dataSet: DataSetType): dataSet is IndexPatternOption => {
  if (typeof dataSet === 'string') return false;

  return !!(dataSet.title && dataSet.id);
};

// Get the option format for the combo box from the dataSource and dataSet.
export const getSourceOptions = (dataSource: DataSourceType, dataSet: DataSetType) => {
  const optionContent = {
    type: dataSource.getType(),
    name: dataSource.getName(),
    ds: dataSource,
  };
  if (isIndexPatterns(dataSet)) {
    return {
      ...optionContent,
      label: dataSet.title,
      value: dataSet.id,
    };
  }
  return {
    ...optionContent,
    label: dataSource.getName(),
    value: dataSource.getName(),
  };
};

// Convert data sets into a structured format suitable for selector rendering.
const getSourceList = (allDataSets: ISourceDataSet[]) => {
  const finalList = [] as DataSourceGroup[];
  allDataSets.forEach((curDataSet) => {
    const typeKey = curDataSet.ds.getType() as DataSourceTypeKey;
    const groupName = DATASOURCE_TYPE_DISPLAY_NAME_MAP[typeKey] || 'Default Group';

    const existingGroup = finalList.find((item) => item.label === groupName);
    const mappedOptions = curDataSet.data_sets.map((dataSet) =>
      getSourceOptions(curDataSet.ds, dataSet)
    );

    // check if add new datasource group or add to existing one
    if (existingGroup) {
      // options deduplication
      const existingOptionIds = new Set(existingGroup.options.map((opt) => opt.label));
      const nonDuplicateOptions = mappedOptions.filter((opt) => !existingOptionIds.has(opt.label));

      // 'existingGroup' directly references an item in the finalList
      // pushing options to 'existingGroup' updates the corresponding item in finalList
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

/**
 * @experimental This component is experimental and might change in future releases.
 */
export const DataSourceSelectable = ({
  dataSources, // list of all available datasource connections.
  dataSourceOptionList, // combo box renderable option list derived from dataSources
  selectedSources, // current selected datasource in the form of [{ label: xxx, value: xxx }]
  onDataSourceSelect,
  setDataSourceOptionList,
  onGetDataSetError, //   onGetDataSetError, Callback for handling get data set errors. Ensure it's memoized.
  singleSelection = { asPlainText: true },
}: DataSourceSelectableProps) => {
  // This effect gets data sets and prepares the datasource list for UI rendering.
  useEffect(() => {
    Promise.all(getDataSets(dataSources))
      .then((results) => {
        setDataSourceOptionList(getSourceList(results));
      })
      .catch((e) => onGetDataSetError(e));
  }, [dataSources, setDataSourceOptionList, onGetDataSetError]);

  const handleSourceChange = useCallback(
    (selectedOptions: any) => onDataSourceSelect(selectedOptions),
    [onDataSourceSelect]
  );

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
      isClearable={false}
      async
    />
  );
};
