/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { FC, useEffect, useState, useCallback } from 'react';
import { EuiSplitPanel, EuiPageSideBar } from '@elastic/eui';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { DataExplorerServices } from '../../types';
import { useTypedDispatch, useTypedSelector, setIndexPattern } from '../../utils/state_management';
import { DataSourceGroup, DataSourceSelectable, DataSourceType } from '../../../../data/public';
import { DataSourceOption } from '../../../../data/public/';

export const Sidebar: FC = ({ children }) => {
  const { indexPattern: indexPatternId } = useTypedSelector((state) => state.metadata);
  const dispatch = useTypedDispatch();
  const [selectedSources, setSelectedSources] = useState<DataSourceOption[]>([]);
  const [dataSourceOptionList, setDataSourceOptionList] = useState<DataSourceGroup[]>([]);
  const [activeDataSources, setActiveDataSources] = useState<DataSourceType[]>([]);

  const {
    services: {
      data: { indexPatterns, dataSources },
      notifications: { toasts },
      application,
    },
  } = useOpenSearchDashboards<DataExplorerServices>();

  useEffect(() => {
    let isMounted = true;
    const subscription = dataSources.dataSourceService.dataSources$.subscribe(
      (currentDataSources) => {
        if (isMounted) {
          setActiveDataSources(Object.values(currentDataSources));
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      isMounted = false;
    };
  }, [indexPatterns, dataSources]);

  const getMatchedOption = (dataSourceList: DataSourceGroup[], ipId: string) => {
    for (const dsGroup of dataSourceList) {
      return dsGroup.options.find((item) => {
        return item.value === ipId;
      });
    }
  };

  useEffect(() => {
    if (indexPatternId) {
      const option = getMatchedOption(dataSourceOptionList, indexPatternId);
      setSelectedSources(option ? [option] : []);
    }
  }, [indexPatternId, activeDataSources, dataSourceOptionList]);

  const handleSourceSelection = (selectedDataSources: DataSourceOption[]) => {
    if (selectedDataSources.length === 0) {
      setSelectedSources(selectedDataSources);
      return;
    }
    // Temperary redirection solution for 2.11, where clicking non-index-pattern datasource
    // will redirect user to Observability event explorer
    if (selectedDataSources[0].ds?.getType() !== 'DEFAULT_INDEX_PATTERNS') {
      return application.navigateToUrl(
        `../observability-logs#/explorer?datasourceName=${selectedDataSources[0].label}&datasourceType=${selectedDataSources[0].type}`
      );
    }
    setSelectedSources(selectedDataSources);
    dispatch(setIndexPattern(selectedDataSources[0].value));
  };

  const handleDataSetFetchError = useCallback(
    () => (error: Error) => {
      toasts.addError(error, { title: `Data set fetching error: ${error}` });
    },
    [toasts]
  );

  return (
    <EuiPageSideBar className="deSidebar" sticky>
      <EuiSplitPanel.Outer className="eui-yScroll" hasBorder={true} borderRadius="none">
        <EuiSplitPanel.Inner paddingSize="s" color="subdued" grow={false}>
          <DataSourceSelectable
            dataSources={activeDataSources}
            dataSourceOptionList={dataSourceOptionList}
            setDataSourceOptionList={setDataSourceOptionList}
            onDataSourceSelect={handleSourceSelection}
            selectedSources={selectedSources}
            onFetchDataSetError={handleDataSetFetchError}
            singleSelection={{ asPlainText: true }}
          />
        </EuiSplitPanel.Inner>
        <EuiSplitPanel.Inner paddingSize="none" color="subdued" className="eui-yScroll">
          {children}
        </EuiSplitPanel.Inner>
      </EuiSplitPanel.Outer>
    </EuiPageSideBar>
  );
};
