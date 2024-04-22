/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useCallback, useMemo } from 'react';
import { EuiComboBox } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { DataSource, DataSourceDataSet, IndexPatternOption } from '../datasource';
import { DataSourceGroup, DataSourceSelectableProps } from './types';

// Get Index patterns for local cluster.
const getAndFormatDataSetFromDataSource = async (
  ds: DataSource
): Promise<DataSourceDataSet<IndexPatternOption[]>> => {
  const { dataSets } = await ds.getDataSet();
  return { ds, list: dataSets } as DataSourceDataSet<IndexPatternOption[]>;
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

// Mapping function for datasets to get the option format for the combo box from the dataSource and dataSet.
const mapToOption = (
  dataSource: DataSource,
  dataSet: DataSourceDataSet | undefined = undefined
) => {
  const baseOption = {
    type: dataSource.getType(),
    name: dataSource.getName(),
    ds: dataSource,
  };
  if (dataSet && 'title' in dataSet && 'id' in dataSet && isIndexPatterns(dataSet)) {
    return {
      ...baseOption,
      label: dataSet.title,
      value: dataSet.id,
      key: dataSet.id,
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
const addOrUpdateGroup = (acc: DataSourceGroup[], dataSource: DataSource, option) => {
  const metadata = dataSource.getMetadata();
  const groupType = metadata.ui.typeGroup;
  let groupName =
    metadata.ui.typeLabel ||
    i18n.translate('dataExplorer.dataSourceSelector.defaultGroupTitle', {
      defaultMessage: 'Default Group',
    });

  if (dataSource.getType() !== 'DEFAULT_INDEX_PATTERNS') {
    groupName += i18n.translate('dataExplorer.dataSourceSelector.redirectionHint', {
      defaultMessage: ' - Opens in Log Explorer',
    });
  }

  const group = acc.find((g: DataSourceGroup) => g.typeGroup === groupType);
  if (group) {
    if (!group.options.some((opt) => opt.key === option.key)) {
      group.options.push(option);
    }
  } else {
    acc.push({
      typeGroup: groupType,
      label: groupName,
      options: [option],
      id: metadata.ui.typeGroup, // id for each group
    });
  }
  return acc;
};

const consolidateDataSourceGroups = (dataSets: DataSourceDataSet[], dataSources: DataSource[]) => {
  return [...dataSets, ...dataSources].reduce((acc, item) => {
    if ('list' in item && item.ds) {
      // Confirm item is a DataSet
      const options = item.list.map((dataset) => mapToOption(item.ds, dataset));
      options.forEach((option) => addOrUpdateGroup(acc, item.ds, option));
    } else {
      // Handle DataSource directly
      const option = mapToOption(item as InstanceType<typeof DataSource>);
      addOrUpdateGroup(acc, item as InstanceType<typeof DataSource>, option);
    }
    return acc;
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
  ...comboBoxProps
}: DataSourceSelectableProps) => {
  // This effect gets data sets and prepares the datasource list for UI rendering.
  useEffect(() => {
    Promise.all(
      getAllDataSets(
        dataSources.filter((ds) => ds.getMetadata().ui?.selector.displayDatasetsAsSource)
      )
    )
      .then((dataSetResults) => {
        setDataSourceOptionList(
          consolidateDataSourceGroups(
            dataSetResults as DataSourceDataSet[],
            dataSources.filter((ds) => !ds.getMetadata().ui?.selector.displayDatasetsAsSource)
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
    <EuiComboBox
      {...comboBoxProps}
      data-test-subj="dataExplorerDSSelect"
      placeholder={i18n.translate('data.datasource.selectADatasource', {
        defaultMessage: 'Select a datasource',
      })}
      options={memorizedDataSourceOptionList as any}
      selectedOptions={selectedSources as any}
      onChange={handleSourceChange}
      singleSelection={singleSelection}
      isClearable={false}
    />
  );
};
