/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { FC, useCallback, useEffect, useState } from 'react';
import { EuiPageSideBar, EuiSplitPanel } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { DataSourceGroup, DataSourceSelectable, DataSourceType } from '../../../../data/public';
import { DataSourceOption } from '../../../../data/public/';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { DataExplorerServices } from '../../types';
import { setIndexPattern, useTypedDispatch, useTypedSelector } from '../../utils/state_management';

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
      const matchedOption = dsGroup.options.find((item) => item.value === ipId);
      if (matchedOption !== undefined) return matchedOption;
    }
    return undefined;
  };

  useEffect(() => {
    if (indexPatternId) {
      const option = getMatchedOption(dataSourceOptionList, indexPatternId);
      setSelectedSources(option ? [option] : []);
    }
  }, [indexPatternId, activeDataSources, dataSourceOptionList]);

  const handleSourceSelection = useCallback(
    (selectedDataSources: DataSourceOption[]) => {
      if (selectedDataSources.length === 0) {
        setSelectedSources(selectedDataSources);
        return;
      }
      // Temporary redirection solution for 2.11, where clicking non-index-pattern datasource
      // will redirect user to Observability event explorer
      if (selectedDataSources[0]?.ds?.getType() !== 'DEFAULT_INDEX_PATTERNS') {
        return application.navigateToUrl(
          `../observability-logs#/explorer?datasourceName=${selectedDataSources[0].label}&datasourceType=${selectedDataSources[0].type}`
        );
      }
      setSelectedSources(selectedDataSources);
      dispatch(setIndexPattern(selectedDataSources[0].value));
    },
    [application, dispatch]
  );

  const handleGetDataSetError = useCallback(
    () => (error: Error) => {
      toasts.addError(error, {
        title:
          i18n.translate('dataExplorer.sidebar.failedToGetDataSetErrorDescription', {
            defaultMessage: 'Failed to get data set: ',
          }) + (error.message || error.name),
      });
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
            onGetDataSetError={handleGetDataSetError}
          />
        </EuiSplitPanel.Inner>
        <EuiSplitPanel.Inner paddingSize="none" color="subdued" className="eui-yScroll">
          {children}
        </EuiSplitPanel.Inner>
      </EuiSplitPanel.Outer>
    </EuiPageSideBar>
  );
};
