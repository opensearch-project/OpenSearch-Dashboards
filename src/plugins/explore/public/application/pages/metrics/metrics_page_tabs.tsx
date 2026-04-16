/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './metrics_page_tabs.scss';
import React, { createContext, useContext } from 'react';
import { EuiTabs, EuiTab, EuiPageBody } from '@elastic/eui';
import { useSelector, useDispatch } from 'react-redux';
import { MetricsExploreTab } from './explore';
import { QueryPanel } from '../../../components/query_panel';
import { ResizableQueryContainer } from '../../../components/container/resizable_query_container';
import { BottomRightContainer } from './metrics_bottom_container/bottom_right_container';
import { DatasetSelectWidget } from '../../../components/query_panel/query_panel_widgets/dataset_select';
import { RootState } from '../../utils/state_management/store';
import { setMetricsPageMode } from '../../utils/state_management/slices/ui/ui_slice';

type MetricsPageMode = 'explore' | 'query';
const MetricsPageModeContext = createContext<MetricsPageMode>('explore');
export const useMetricsPageMode = () => useContext(MetricsPageModeContext);

const PAGE_TABS: Array<{ id: MetricsPageMode; label: string }> = [
  { id: 'explore', label: 'Explore' },
  { id: 'query', label: 'Query' },
];

export const MetricsPageTabs: React.FC = () => {
  const dispatch = useDispatch();
  const mode = useSelector((state: RootState) => state.ui.metricsPageMode) || 'explore';
  return (
    <MetricsPageModeContext.Provider value={mode}>
      <div className="metricsPageTabs__tabBar">
        <DatasetSelectWidget />
        <EuiTabs size="s" className="metricsPageTabs__tabs">
          {PAGE_TABS.map((tab) => (
            <EuiTab
              key={tab.id}
              isSelected={mode === tab.id}
              onClick={() => dispatch(setMetricsPageMode(tab.id))}
              data-test-subj={`metricsPageTab-${tab.id}`}
            >
              {tab.label}
            </EuiTab>
          ))}
        </EuiTabs>
      </div>
      {mode === 'explore' ? (
        <div className="explore-layout__canvas metricsPageTabs__exploreCanvas">
          <MetricsExploreTab />
        </div>
      ) : (
        <ResizableQueryContainer queryPanel={<QueryPanel />}>
          <EuiPageBody className="explore-layout__canvas">
            <BottomRightContainer />
          </EuiPageBody>
        </ResizableQueryContainer>
      )}
    </MetricsPageModeContext.Provider>
  );
};
