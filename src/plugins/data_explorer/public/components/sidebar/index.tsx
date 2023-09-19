/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { FC, useEffect, useState } from 'react';
import { EuiSplitPanel, EuiPageSideBar } from '@elastic/eui';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { DataExplorerServices } from '../../types';
import { useTypedDispatch, useTypedSelector, setIndexPattern } from '../../utils/state_management';
import { DataSourceSelectable } from '../../../../data/public';

export const Sidebar: FC = ({ children }) => {
  const { indexPattern: indexPatternId } = useTypedSelector((state) => state.metadata);
  const dispatch = useTypedDispatch();
  const [selectedSources, setSelectedSources] = useState([]);
  const [dataSourceOptionList, setDataSourceOptionList] = useState([]);
  const [activeDataSources, setActiveDataSources] = useState([]);

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
          setActiveDataSources([...Object.values(currentDataSources)]);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      isMounted = false;
    };
  }, [indexPatterns, dataSources]);

  const getMatchedOption = (dataSourceList, ipId: string) => {
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

  const handleSourceSelection = (selectedDataSources) => {
    // Temperary redirection solution for 2.11, where clicking non-index-pattern datasource
    // will redirect user to Observability event explorer
    if (selectedDataSources[0].ds?.getType() !== 'Index patterns') {
      return application.navigateToUrl(
        `../observability-logs#/explorer?metadata:(datasource:${JSON.stringify(
          selectedDataSources[0]
        )})`
      );
    }
    setSelectedSources(selectedDataSources);
    dispatch(setIndexPattern(selectedDataSources[0].value));
  };

  return (
    <EuiPageSideBar className="deSidebar" sticky>
      <EuiSplitPanel.Outer className="eui-yScroll" hasBorder={true} borderRadius="none">
        {/* <EuiSplitPanel.Inner paddingSize="s" color="subdued" grow={false}>
          <EuiComboBox */}
        <EuiSplitPanel.Inner paddingSize="s" grow={false}>
          <DataSourceSelectable
            dataSources={activeDataSources}
            dataSourceOptionList={dataSourceOptionList}
            setDataSourceOptionList={setDataSourceOptionList}
            setSelectedSources={handleSourceSelection}
            selectedSources={selectedSources}
          />
          {/* <EuiComboBox
            placeholder="Select a datasource"
            singleSelection={{ asPlainText: true }}
            options={options}
            selectedOptions={selectedOption ? [selectedOption] : []}
            fullWidth
            onChange={(selected) => {
              // TODO: There are many issues with this approach, but it's a start
              // 1. Combo box can delete a selected index pattern. This should not be possible
              // 2. Combo box is severely truncated. This should be fixed in the EUI component
              // 3. The onchange can fire with a option that is not valid. discuss where to handle this.
              // 4. value is optional. If the combobox needs to act as a slecet, this should be required.
              const { value } = selected[0] || {};

              if (!value) {
                toasts.addWarning({
                  id: 'index-pattern-not-found',
                  title: i18n.translate('dataExplorer.indexPatternError', {
                    defaultMessage: 'Index pattern not found',
                  }),
                });
                return;
              }

              dispatch(setIndexPattern(value));
            }}
          /> */}
          {/* Hidden for the 2.10 release of Data Explorer. Uncomment when Data explorer is released */}
          {/* <EuiSpacer size="s" />
          <EuiSelect
            options={viewOptions}
            value={view?.id}
            onChange={(e) => {
              dispatch(setView(e.target.value));
            }}
            fullWidth
          /> */}
        </EuiSplitPanel.Inner>
        <EuiSplitPanel.Inner paddingSize="none" color="subdued" className="eui-yScroll">
          {children}
        </EuiSplitPanel.Inner>
      </EuiSplitPanel.Outer>
    </EuiPageSideBar>
  );
};
