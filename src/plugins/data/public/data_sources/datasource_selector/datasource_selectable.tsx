/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiCompressedComboBox } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import React, { useCallback, useEffect, useMemo } from 'react';
import { DataSetWithDataSource, DataSource, IndexPatternOption } from '../datasource';
import { DataSelectorRefresher } from './data_selector_refresher';
import { DataSourceGroup, DataSourceOption, DataSourceSelectableProps } from './types';

// Asynchronously retrieves and formats dataset from a given data source.
const getAndFormatDataSetFromDataSource = async (
  ds: DataSource
): Promise<DataSetWithDataSource<IndexPatternOption[]>> => {
  const { dataSets } = await ds.getDataSet();
  return { ds, list: dataSets } as DataSetWithDataSource<IndexPatternOption[]>;
};

// Map through all data sources and get their respective data sets.
const getAllDataSets = (dataSources: DataSource[]) =>
  dataSources.map((ds) => getAndFormatDataSetFromDataSource(ds));

export const isIndexPatterns = (dataSet: unknown) =>
  typeof dataSet !== 'string' &&
  'title' in (dataSet as any) &&
  'id' in (dataSet as any) &&
  !!(dataSet as any).title &&
  !!(dataSet as any).id;

// Mapping function to get the option format for the combo box from the dataSource and dataSet.
const mapToOption = (
  dataSource: DataSource,
  dataSet: DataSetWithDataSource | undefined = undefined
): DataSourceOption => {
  const baseOption = {
    type: dataSource.getType(),
    name: dataSource.getName(),
    ds: dataSource,
  };
  if (dataSet && 'title' in dataSet && 'id' in dataSet && isIndexPatterns(dataSet)) {
    return {
      ...baseOption,
      label: dataSet.title as string,
      value: dataSet.id as string,
      key: dataSet.id as string,
    };
  }
  return {
    ...baseOption,
    label: dataSource.getName(),
    value: dataSource.getName(),
    key: dataSource.getId(),
  };
};

// Function to add or update groups in a reduction process
const addOrUpdateGroup = (
  existingGroups: DataSourceGroup[],
  dataSource: DataSource,
  option: DataSourceOption
) => {
  const metadata = dataSource.getMetadata();
  const groupType = metadata.ui.groupType;
  let groupName =
    metadata.ui.typeLabel ||
    i18n.translate('data.dataSourceSelector.defaultGroupTitle', {
      defaultMessage: 'Default Group',
    });

  if (dataSource.getType() !== 'DEFAULT_INDEX_PATTERNS') {
    groupName += i18n.translate('data.dataSourceSelector.redirectionHint', {
      defaultMessage: ' - Opens in Log Explorer',
    });
  }

  const group = existingGroups.find((g: DataSourceGroup) => g.id === groupType);
  if (group && !group.options.some((opt) => opt.key === option.key)) {
    group.options.push(option);
  } else {
    existingGroups.push({
      groupType,
      label: groupName,
      options: [option],
      id: metadata.ui.groupType, // id for each group
    });
  }
};

const consolidateDataSourceGroups = (
  dataSets: DataSetWithDataSource[],
  dataSources: DataSource[]
) => {
  return [...dataSets, ...dataSources].reduce((dsGroup, item) => {
    if ('list' in item && item.ds) {
      // Confirm item is a DataSet
      const options = item.list.map((dataset) => mapToOption(item.ds, dataset));
      options.forEach((option) => addOrUpdateGroup(dsGroup, item.ds, option));
    } else {
      // Handle DataSource directly
      const option = mapToOption(item as InstanceType<typeof DataSource>);
      addOrUpdateGroup(dsGroup, item as InstanceType<typeof DataSource>, option);
    }
    return dsGroup;
  }, []);
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
  onRefresh,
  ...comboBoxProps
}: DataSourceSelectableProps) => {
  // This effect gets data sets and prepares the datasource list for UI rendering.
  useEffect(() => {
    Promise.all(
      getAllDataSets(
        dataSources.filter((ds) => ds.getMetadata().ui.selector.displayDatasetsAsSource)
      )
    )
      .then((dataSetResults) => {
        setDataSourceOptionList(
          consolidateDataSourceGroups(
            dataSetResults as DataSetWithDataSource[],
            dataSources.filter((ds) => !ds.getMetadata().ui.selector.displayDatasetsAsSource)
          )
        );
      })
      .catch((e) => onGetDataSetError(e));
  }, [dataSources, setDataSourceOptionList, onGetDataSetError]);

  const handleSourceChange = useCallback(
    (selectedOptions: any) => onDataSourceSelect(selectedOptions),
    [onDataSourceSelect]
  );

  const memorizedDataSourceOptionList = useMemo(() => {
    return dataSourceOptionList.map((dsGroup: DataSourceGroup) => {
      return {
        ...dsGroup,
        options: [...dsGroup.options].sort((ds1, ds2) => {
          return ds1.label.localeCompare(ds2.label, undefined, { sensitivity: 'base' });
        }),
      };
    });
  }, [dataSourceOptionList]);

  return (
    <EuiCompressedComboBox
      {...comboBoxProps}
      className="dataExplorerDSSelect"
      data-test-subj="dataExplorerDSSelect"
      placeholder={i18n.translate('data.datasource.selectADatasource', {
        defaultMessage: 'Select a data source',
      })}
      options={memorizedDataSourceOptionList as any}
      selectedOptions={selectedSources as any}
      onChange={handleSourceChange}
      singleSelection={singleSelection}
      isClearable={false}
      append={
        <DataSelectorRefresher
          tooltipText={i18n.translate('data.datasource.selector.refreshDataSources', {
            defaultMessage: 'Refresh data selector',
          })}
          onRefresh={onRefresh}
        />
      }
    />
  );
};
