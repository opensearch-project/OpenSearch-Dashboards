/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { FC, useCallback, useEffect, useState } from 'react';
import {
  EuiPageSideBar,
  EuiSplitPanel,
  EuiModal,
  EuiModalHeader,
  EuiModalBody,
  EuiModalHeaderTitle,
  EuiModalFooter,
  EuiButtonEmpty,
  EuiButton,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { DataSourceGroup, DataSourceSelectable, DataSourceType } from '../../../../data/public';
import { DataSourceOption } from '../../../../data/public/';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { DataExplorerServices } from '../../types';
import { setIndexPattern, useTypedDispatch, useTypedSelector } from '../../utils/state_management';
import './index.scss';

const LOG_EXPLORER_TITLE_HINT = ' - Opens in Log Explorer';
const DATA_SOURCE_SELECTOR_CONFIGS = { customGroupTitleExtension: LOG_EXPLORER_TITLE_HINT };

export const Sidebar: FC = ({ children }) => {
  const { indexPattern: indexPatternId } = useTypedSelector((state) => state.metadata);
  const dispatch = useTypedDispatch();
  const [selectedSources, setSelectedSources] = useState<DataSourceOption[]>([]);
  const [dataSourceOptionList, setDataSourceOptionList] = useState<DataSourceGroup[]>([]);
  const [activeDataSources, setActiveDataSources] = useState<DataSourceType[]>([]);
  const [modalContent, setModalContent] = useState<React.ReactNode | null>(null);

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

  const redirectToLogExplorer = useCallback(
    (dsName: string, dsType: string) => {
      return application.navigateToUrl(
        `../observability-logs#/explorer?datasourceName=${dsName}&datasourceType=${dsType}`
      );
    },
    [application]
  );

  const getRedirectModal = useCallback(
    (dsName: string, dsType: string) => {
      return (
        <EuiModal onClose={() => setModalContent(null)}>
          <EuiModalHeader>
            <EuiModalHeaderTitle>
              <h1>
                {i18n.translate('dataExplorer.sidebar.LogExplorerRedirectionModalTitle', {
                  defaultMessage: 'Open in Log Explorer',
                })}
              </h1>
            </EuiModalHeaderTitle>
          </EuiModalHeader>
          <EuiModalBody>
            <EuiText>
              {i18n.translate('dataExplorer.sidebar.LogExplorerRedirectionModalMessage', {
                defaultMessage:
                  'Selecting this data source will open the Log Explorer application, where you can query \
                data using PPL/SQL.',
              })}
            </EuiText>
          </EuiModalBody>
          <EuiModalFooter>
            <EuiButtonEmpty onClick={() => setModalContent(null)}>
              {i18n.translate(
                'dataExplorer.sidebar.LogExplorerRedirectionModalFooterCancelButtonTxt',
                {
                  defaultMessage: 'Cancel',
                }
              )}
            </EuiButtonEmpty>
            <EuiButton
              onClick={() => {
                redirectToLogExplorer(dsName, dsType);
              }}
              fill
            >
              {i18n.translate('dataExplorer.sidebar.LogExplorerRedirectionModalFooterButtonTxt', {
                defaultMessage: 'Open in Log Explorer ',
              })}
            </EuiButton>
          </EuiModalFooter>
        </EuiModal>
      );
    },
    [redirectToLogExplorer]
  );

  const showModal = useCallback(
    (dsName: string, dsType: string) => {
      setModalContent(getRedirectModal(dsName, dsType));
    },
    [setModalContent, getRedirectModal]
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
        showModal(selectedDataSources[0].label, selectedDataSources[0].type);
        return;
      }
      setSelectedSources(selectedDataSources);
      dispatch(setIndexPattern(selectedDataSources[0].value));
    },
    [dispatch, showModal, setSelectedSources]
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
      <EuiSplitPanel.Outer
        className="eui-yScroll deSidebar_panel"
        hasBorder={true}
        borderRadius="none"
        color="transparent"
      >
        <EuiSplitPanel.Inner
          paddingSize="s"
          grow={false}
          color="transparent"
          className="deSidebar_dataSource"
        >
          <DataSourceSelectable
            dataSources={activeDataSources}
            dataSourceOptionList={dataSourceOptionList}
            setDataSourceOptionList={setDataSourceOptionList}
            onDataSourceSelect={handleSourceSelection}
            selectedSources={selectedSources}
            onGetDataSetError={handleGetDataSetError}
            dataSourceSelectorConfigs={DATA_SOURCE_SELECTOR_CONFIGS}
            fullWidth
          />
        </EuiSplitPanel.Inner>
        <EuiSplitPanel.Inner paddingSize="none" color="transparent" className="eui-yScroll">
          {children}
        </EuiSplitPanel.Inner>
        {modalContent}
      </EuiSplitPanel.Outer>
    </EuiPageSideBar>
  );
};
