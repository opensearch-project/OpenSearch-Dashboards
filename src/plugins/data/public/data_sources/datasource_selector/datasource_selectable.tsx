/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useCallback, useMemo } from 'react';
import { EuiComboBox } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { DataSource, DataSourceDataSet, IndexPatternOption } from '../datasource';
import { DataSourceGroup, DataSourceSelectableProps } from './types';
import { IDataSourceDataSet } from '../datasource/types';

type DataSourceTypeKey = 'DEFAULT_INDEX_PATTERNS' | 's3glue' | 'spark';

// Get Index patterns for local cluster.
const getDataSetFromDataSource = async (
  ds: DataSource
): Promise<DataSourceDataSet<IndexPatternOption[]>> => {
  const dataSets = (await ds.getDataSet()).dataSets;
  return {
    ds,
    list: dataSets,
  } as DataSourceDataSet<IndexPatternOption[]>;
};

// Map through all data sources and get their respective data sets.
const getDataSets = (dataSources: DataSource[]) =>
  dataSources.map((ds) => getDataSetFromDataSource(ds));

export const isIndexPatterns = (dataSet: IndexPatternOption) => {
  if (typeof dataSet === 'string') return false;

  return !!(dataSet.title && dataSet.id);
};

// Get the option format for the combo box from the dataSource and dataSet.
export const getSourceOptions = (dataSource: DataSource, dataSet: IDataSourceDataSet) => {
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
      key: dataSet.id,
    };
  }
  return {
    ...optionContent,
    label: dataSource.getName(),
    value: dataSource.getName(),
  };
};

const getGroupListFromDataSetDS = (
  dsListWithDataSetAsDisplayedDataSources: DataSourceDataSet[],
  groupList: DataSourceGroup[]
) => {
  const finalList = [] as DataSourceGroup[];
  dsListWithDataSetAsDisplayedDataSources.forEach((curDataSet) => {
    const typeKey = curDataSet.ds.getType() as DataSourceTypeKey; // ds type key
    const dsMetadata = curDataSet.ds.getMetadata();
    const groupType = dsMetadata.ui.typeGroup;
    let groupName =
      dsMetadata.ui.typeLabel ||
      i18n.translate('dataExplorer.dataSourceSelector.defaultGroupTitle', {
        defaultMessage: 'Default Group',
      });

    // add '- Opens in Log Explorer' to hint user that selecting these types of data sources
    // will lead to redirection to log explorer
    if (typeKey !== 'DEFAULT_INDEX_PATTERNS') {
      groupName = `${groupName}${i18n.translate('dataExplorer.dataSourceSelector.redirectionHint', {
        defaultMessage: ' - Opens in Log Explorer',
      })}`;
    }

    const existingGroup = finalList.find((item) => item.typeGroup === groupType);
    const mappedOptions = curDataSet.list.map((dataSet) =>
      getSourceOptions(curDataSet.ds, dataSet)
    );

    // check if to add new data source group or add to existing one
    if (existingGroup) {
      // options deduplication
      const existingOptionIds = new Set(existingGroup.options.map((opt) => opt.id));
      const nonDuplicateOptions = mappedOptions.filter((opt) => !existingOptionIds.has(opt.label));

      // 'existingGroup' directly references an item in the finalList
      // pushing options to 'existingGroup' updates the corresponding item in finalList
      existingGroup.options.push(...nonDuplicateOptions);
    } else {
      finalList.push({
        typeGroup: dsMetadata.ui.typeGroup,
        label: groupName,
        options: mappedOptions,
      });
    }
  });

  return [...finalList, ...groupList];
};

const getGroupListFromDS = (dataSources: DataSource[], groupList: DataSourceGroup[]) => {
  const finalList = [] as DataSourceGroup[];
  dataSources.forEach((ds) => {
    const typeKey = ds.getType() as DataSourceTypeKey; // ds type key
    const dsMetadata = ds.getMetadata();
    const typeGroup = dsMetadata.ui.typeGroup;
    let groupName =
      dsMetadata.ui.typeLabel ||
      i18n.translate('dataExplorer.dataSourceSelector.defaultGroupTitle', {
        defaultMessage: 'Default Group',
      });

    // add '- Opens in Log Explorer' to hint user that selecting these types of data sources
    // will lead to redirection to log explorer
    if (typeKey !== 'DEFAULT_INDEX_PATTERNS') {
      groupName = `${groupName}${i18n.translate('dataExplorer.dataSourceSelector.redirectionHint', {
        defaultMessage: ' - Opens in Log Explorer',
      })}`;
    }

    const existingGroup = finalList.find((item) => item.typeGroup === typeGroup);
    const dsOption = {
      type: ds.getType(),
      name: ds.getName(),
      ds,
      label: dsMetadata.ui.label,
      value: dsMetadata.ui.label,
      key: ds.getId(),
    };
    // check if to add new data source group or add to existing one
    if (existingGroup) {
      // options deduplication
      // const existingOptionIds = new Set(existingGroup.options.map((opt) => opt.id));
      // const nonDuplicateOptions = mappedOptions.filter((opt) => !existingOptionIds.has(opt.label));

      // 'existingGroup' directly references an item in the finalList
      // pushing options to 'existingGroup' updates the corresponding item in finalList
      existingGroup.options.push(dsOption);
    } else {
      finalList.push({
        id: dsMetadata.ui.typeGroup,
        typeGroup: dsMetadata.ui.typeGroup,
        label: groupName,
        options: [
          {
            ...dsOption,
          },
        ],
      });
    }
  });

  return [...groupList, ...finalList];
};

// Convert data sets into a structured format suitable for selector rendering.
const getConsolidatedDataSourceGroups = (
  dsListWithDataSetAsDisplayedDataSources: DataSourceDataSet[],
  dsListWithThemselvesAsDisplayedDataSources: DataSource[]
) => {
  // const finalList = [] as DataSourceGroup[];
  const dataSetFinalList = getGroupListFromDataSetDS(dsListWithDataSetAsDisplayedDataSources, []);
  const finalList = getGroupListFromDS(
    dsListWithThemselvesAsDisplayedDataSources,
    dataSetFinalList
  );

  return finalList;
};

const getDataSourcesRequireDataSetFetching = (dataSources: DataSource[]): DataSource[] =>
  dataSources.filter((ds) => ds.getMetadata()?.ui?.selector?.displayDatasetsWithSource);

const getDataSourcesRequireNoDataSetFetching = (dataSources: DataSource[]): DataSource[] =>
  dataSources.filter((ds) => !ds.getMetadata()?.ui?.selector?.displayDatasetsWithSource);

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
    Promise.all(getDataSets(getDataSourcesRequireDataSetFetching(dataSources)))
      .then((results) => {
        const groupList = getConsolidatedDataSourceGroups(
          results,
          getDataSourcesRequireNoDataSetFetching(dataSources)
        );
        setDataSourceOptionList(groupList);
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
