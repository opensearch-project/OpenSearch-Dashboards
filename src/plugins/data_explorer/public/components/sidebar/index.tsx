/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ComponentType, FC, useCallback, useEffect, useRef, useState } from 'react';
import { EuiPageSideBar, EuiPortal, EuiSplitPanel } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { DataSource, DataSourceGroup, DataSourceSelectable } from '../../../../data/public';
import { DataSourceOption } from '../../../../data/public/';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { DataExplorerServices } from '../../types';
import {
  setIndexPattern,
  setDataSet,
  useTypedDispatch,
  useTypedSelector,
} from '../../utils/state_management';
import './index.scss';
import { DataSetNavigatorProps } from '../../../../data/public/ui/dataset_navigator';
import { batch } from 'react-redux';

export const Sidebar: FC = ({ children }) => {
  const { indexPattern: indexPatternId } = useTypedSelector((state) => state.metadata);
  const dispatch = useTypedDispatch();
  const [selectedSources, setSelectedSources] = useState<DataSourceOption[]>([]);
  const [dataSourceOptionList, setDataSourceOptionList] = useState<DataSourceGroup[]>([]);
  const [activeDataSources, setActiveDataSources] = useState<DataSource[]>([]);
  const [isEnhancementsEnabled, setIsEnhancementsEnabled] = useState<boolean>(false);
  const [DataSetNavigator, setDataSetNavigator] = useState<any>();
  const [selectedDataSet, setSelectedDataSet] = useState();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const {
    services: {
      data: { indexPatterns, dataSources, ui },
      notifications: { toasts },
      application,
    },
  } = useOpenSearchDashboards<DataExplorerServices>();

  const handleDataSetSelection = useCallback(
    (selectedDataSet: any) => {
      setSelectedDataSet(selectedDataSet);
      setSelectedSources([
        {
          key: selectedDataSet.id,
          name: selectedDataSet.name,
          label: selectedDataSet.name,
          value: selectedDataSet.id,
          type: 'OpenSearch Default',
          ds: activeDataSources[0],
        },
      ]);
      batch(() => {
        dispatch(setIndexPattern(selectedDataSet.id));
        dispatch(setDataSet(selectedDataSet));
      });
    },
    [dispatch]
  );

  useEffect(() => {
    const subscriptions = ui.Settings.getEnabledQueryEnhancementsUpdated$().subscribe(
      (enabledQueryEnhancements) => {
        setIsEnhancementsEnabled(enabledQueryEnhancements);
        if (enabledQueryEnhancements)
          setDataSetNavigator(ui.DataSetNavigator(handleDataSetSelection));
      }
    );

    return () => {
      subscriptions.unsubscribe();
    };
  }, [ui.Settings, handleDataSetSelection]);

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
  }, [ui.container$, containerRef, setContainerRef, isEnhancementsEnabled]);

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
      setSelectedSources(option ? [option] : []);
    }
  }, [indexPatternId, activeDataSources, dataSourceOptionList]);

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
      // Temporary redirection solution for 2.11, where clicking non-index-pattern data sources
      // will prompt users with modal explaining they are being redirected to Observability log explorer
      if (selectedDataSources[0]?.ds?.getType() !== 'DEFAULT_INDEX_PATTERNS') {
        redirectToLogExplorer(selectedDataSources[0].label, selectedDataSources[0].type);
        return;
      }
      setSelectedSources(selectedDataSources);
      dispatch(setIndexPattern(selectedDataSources[0].value));
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
        {isEnhancementsEnabled && (
          <EuiPortal
            portalRef={(node) => {
              containerRef.current = node;
            }}
          >
            {DataSetNavigator}
          </EuiPortal>
        )}
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
