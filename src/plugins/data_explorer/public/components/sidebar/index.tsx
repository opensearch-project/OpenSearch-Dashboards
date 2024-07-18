/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import { EuiPageSideBar, EuiPortal, EuiSplitPanel } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { DataSource, DataSourceGroup, DataSetNavigator, DataSourceSelectable } from '../../../../data/public';
import { DataSourceOption } from '../../../../data/public/';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { DataExplorerServices } from '../../types';
import {
  setIndexPattern,
  setDataset,
  useTypedDispatch,
  useTypedSelector,
} from '../../utils/state_management';
import './index.scss';

export const Sidebar: FC = ({ children }) => {
  const { indexPattern: indexPatternId } = useTypedSelector((state) => state.metadata);
  const dispatch = useTypedDispatch();
  const [selectedSources, setSelectedSources] = useState<DataSourceOption[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<any>();
  const [indexPatternOptionList, setIndexPatternOptionList] = useState<DataSourceOption[]>([]);
  const [dataSourceOptionList, setDataSourceOptionList] = useState<DataSourceGroup[]>([]);
  const [activeDataSources, setActiveDataSources] = useState<DataSource[]>([]);
  const [isEnhancementsEnabled, setIsEnhancementsEnabled] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const {
    services: {
      data: { indexPatterns, dataSources, ui },
      notifications: { toasts },
      application,
    },
  } = useOpenSearchDashboards<DataExplorerServices>();

  useEffect(() => {
    const subscriptions = ui.Settings.getEnabledQueryEnhancementsUpdated$().subscribe(
      (enabledQueryEnhancements) => {
        setIsEnhancementsEnabled(enabledQueryEnhancements);
      }
    );

    return () => {
      subscriptions.unsubscribe();
    };
  }, [ui.Settings]);

  const setContainerRef = useCallback((uiContainerRef) => {
    uiContainerRef.appendChild(containerRef.current);
  }, []);

  useEffect(() => {
    if (!isEnhancementsEnabled) return;
    const subscriptions = ui.container$.subscribe((container) => {
      if (container === null) return;
      if (containerRef.current) {
        setContainerRef(container);
      }
    });

    return () => {
      subscriptions.unsubscribe();
    };
  }, [
    ui.container$,
    containerRef,
    setContainerRef,
    ui.dataSourceContainer$,
    isEnhancementsEnabled,
  ]);

  useEffect(() => {
    let isMounted = true;
    const subscription = dataSources.dataSourceService
      .getDataSources$()
      .subscribe((currentDataSources) => {
        if (isMounted) {
          setActiveDataSources(Object.values(currentDataSources));
        }
      });

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
      setSelectedSources((prev) => option ? [option] : prev);
    }
  }, [indexPatternId, activeDataSources, dataSourceOptionList]);

  const getMatchedIndexPattern = (indexPatternList: DataSourceOption[], ipId: string) => {
    return indexPatternList.find((indexPattern) => indexPattern.value === ipId);
  };

  useEffect(() => {
    if (indexPatternId) {
      const option = getMatchedIndexPattern(indexPatternOptionList, indexPatternId);
      setSelectedSources((prev) => option ? [option] : prev);
    }
  }, [indexPatternId, activeDataSources, indexPatternOptionList]);

  const redirectToLogExplorer = useCallback(
    (dsName: string, dsType: string) => {
      return application.navigateToUrl(
        `../observability-logs#/explorer?datasourceName=${dsName}&datasourceType=${dsType}`
      );
    },
    [application]
  );

  const handleSourceSelection = useCallback(
    (selectedDataSources: DataSourceOption[]) => {
      if (selectedDataSources.length === 0) {
        setSelectedSources(selectedDataSources);
        return;
      }
      setSelectedSources(selectedDataSources);
      dispatch(setIndexPattern(selectedDataSources[0].value));
      // dispatch(
      //   setDataset({
      //     id: selectedDataSources[0].value,
      //     datasource: { ref: selectedDataSources[0]?.ds?.getId() },
      //   })
      // );
    },
    [dispatch, redirectToLogExplorer, setSelectedSources]
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

  const memorizedReload = useCallback(() => {
    dataSources.dataSourceService.reload();
  }, [dataSources.dataSourceService]);

  const dataSourceSelector = (
    <DataSourceSelectable
      dataSources={activeDataSources}
      dataSourceOptionList={dataSourceOptionList}
      setDataSourceOptionList={setDataSourceOptionList}
      onDataSourceSelect={handleSourceSelection}
      selectedSources={selectedSources}
      onGetDataSetError={handleGetDataSetError}
      onRefresh={memorizedReload}
      fullWidth
    />
  );

  return (
    <EuiPageSideBar className="deSidebar" sticky>
      <EuiSplitPanel.Outer
        className="eui-yScroll deSidebar_panel"
        hasBorder={true}
        borderRadius="none"
        color="transparent"
      >
        {!isEnhancementsEnabled && (
          <EuiSplitPanel.Inner
            paddingSize="s"
            grow={false}
            color="transparent"
            className="deSidebar_dataSource"
          >
            {dataSourceSelector}
          </EuiSplitPanel.Inner>
        )}
        <EuiSplitPanel.Inner paddingSize="none" color="transparent" className="eui-yScroll">
          {children}
        </EuiSplitPanel.Inner>
      </EuiSplitPanel.Outer>
    </EuiPageSideBar>
  );
};
