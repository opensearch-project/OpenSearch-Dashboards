/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { DataExplorerServices } from '../../../../../../data_explorer/public';
import { DataView as Dataset } from '../../../../../../data/common';
import { OpenSearchSearchHit } from '../../../../types/doc_views_types';
import { getTraceDetailsUrlParams } from '../../../../components/data_table/table_cell/trace_utils/trace_utils';

interface TraceFlyoutData {
  traceId: string;
  spanId: string;
  dataset: Dataset;
  rowData: OpenSearchSearchHit<Record<string, unknown>>;
}

interface TraceFlyoutContextType {
  isFlyoutOpen: boolean;
  flyoutData: TraceFlyoutData | undefined;
  openTraceFlyout: (record: TraceFlyoutData) => void;
  closeTraceFlyout: () => void;
}

const TraceFlyoutContext = createContext<TraceFlyoutContextType | undefined>(undefined);

export const TraceFlyoutProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isFlyoutOpen, setIsFlyoutOpen] = useState<boolean>(false);
  const [flyoutData, setFlyoutData] = useState<TraceFlyoutData | undefined>(undefined);
  const {
    services: { osdUrlStateStorage },
  } = useOpenSearchDashboards<DataExplorerServices>();

  const openTraceFlyout = (record: TraceFlyoutData) => {
    const urlParams = getTraceDetailsUrlParams(record.spanId, record.traceId, record.dataset);
    osdUrlStateStorage.set('_a', urlParams, { replace: true });
    setFlyoutData(record);
    setIsFlyoutOpen(true);
  };

  const closeTraceFlyout = () => {
    setIsFlyoutOpen(false);
  };

  return (
    <TraceFlyoutContext.Provider
      value={{
        isFlyoutOpen,
        flyoutData,
        openTraceFlyout,
        closeTraceFlyout,
      }}
    >
      {children}
    </TraceFlyoutContext.Provider>
  );
};

export const useTraceFlyoutContext = (): TraceFlyoutContextType => {
  const context = useContext(TraceFlyoutContext);
  if (context === undefined) {
    throw new Error('useTraceFlyoutContext must be used within a TraceFlyoutProvider');
  }
  return context;
};
