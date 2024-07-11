/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Fragment, useCallback, useEffect, useMemo } from 'react';
import { EuiSelectable, EuiSpacer } from '@elastic/eui';
import {
  DataSetWithDataSource,
  DataSource,
  IndexPatternOption,
} from '../../data_sources/datasource';
import { DataSourceGroup, DataSourceOption } from '../../data_sources/datasource_selector/types';
import { isIndexPatterns } from '../../data_sources/datasource_selector/datasource_selectable';

const getAndFormatIndexPatternsFromDataSource = async (
  ds: DataSource
): Promise<DataSetWithDataSource<IndexPatternOption>> => {
  const { dataSets } = await ds.getDataSet();
  return { ds, list: dataSets } as DataSetWithDataSource<IndexPatternOption>;
};

const getAllIndexPatterns = (dataSources: DataSource[]) =>
  dataSources.map((ds) => getAndFormatIndexPatternsFromDataSource(ds));

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

function consolidate(
  dataSets: DataSetWithDataSource<IndexPatternOption>[],
  selectedSources: DataSourceOption[]
): DataSourceOption[] {
  const result: DataSourceOption[] = [];
  console.log('selectedSources:', selectedSources);

  dataSets.forEach((dataSet) => {
    dataSet.list.forEach((indexPatternOption) => {
      const dataSourceOption: DataSourceOption = {
        type: 'indexPattern',
        name: dataSet.ds.getName(),
        ds: dataSet.ds,
        key: indexPatternOption.id as string,
        label: indexPatternOption.title as string,
        value: indexPatternOption.id as string,
      };

      if (selectedSources.length !== 0 && selectedSources[0].value === dataSourceOption.value) {
        dataSourceOption.checked = true;
      }

      result.push(dataSourceOption);
    });
  });

  return result;
}

interface IndexPatternSelectableProps {
  dataSources: DataSource[];
  indexPatternOptionList: any;
  selectedSources: any;
  setIndexPatternOptionList: any;
  handleSourceSelection: any;
}

export const IndexPatternSelectable = ({
  dataSources,
  indexPatternOptionList,
  selectedSources,
  // onIndexPatternSelect,
  setIndexPatternOptionList,
  handleSourceSelection,
}: IndexPatternSelectableProps) => {
  useEffect(() => {
    Promise.all(
      getAllIndexPatterns(
        dataSources.filter((ds) => ds.getMetadata().ui.selector.displayDatasetsAsSource)
      )
    ).then((dataSetResults) => {
      setIndexPatternOptionList(consolidate(dataSetResults, selectedSources));
    });
  }, [dataSources, setIndexPatternOptionList]);

  const handleSourceChange = useCallback(
    (selectedOptions: any) => handleSourceSelection(selectedOptions),
    [handleSourceSelection]
  );

  // const memoizedIndexPatternOptionList = useMemo(() => {
  //   return indexPatternOptionList;
  // }, [indexPatternOptionList]);

  return (
    <div>
      <EuiSelectable
        searchable
        options={indexPatternOptionList}
        onChange={(newOptions) => {
          setIndexPatternOptionList(newOptions);
          handleSourceChange(newOptions.filter((option) => option?.checked));
        }}
        singleSelection="always"
      >
        {(list, search) => (
          <Fragment>
            {search}
            {list}
          </Fragment>
        )}
      </EuiSelectable>
    </div>
  );
};
