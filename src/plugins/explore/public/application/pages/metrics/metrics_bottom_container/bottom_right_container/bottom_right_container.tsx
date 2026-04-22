/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { EuiSpacer } from '@elastic/eui';

import { useSelector } from 'react-redux';
import { CanvasPanel } from '../../../../../components/panel/canvas_panel';
import { useDatasetContext } from '../../../../context';
import { LoadingSpinner } from '../../../../legacy/discover/application/components/loading_spinner/loading_spinner';
import { DiscoverNoIndexPatterns } from '../../../../legacy/discover/application/components/no_index_patterns/no_index_patterns';
import { defaultPrepareQueryString } from '../../../../utils/state_management/actions/query_actions';
import { selectQueryStatusMapByKey } from '../../../../utils/state_management/selectors';
import { RootState } from '../../../../utils/state_management/store';
import { QueryExecutionStatus } from '../../../../utils/state_management/types';
import { ResizableVisControlAndTabs } from './resizable_vis_control_and_tabs';

export const BottomRightContainer = () => {
  const { dataset } = useDatasetContext();

  const query = useSelector((state: RootState) => state.query);
  const status = useSelector((state: RootState) => {
    return state.queryEditor.overallQueryStatus.status || QueryExecutionStatus.UNINITIALIZED;
  });
  const dataTableStatus = useSelector((state: RootState) => {
    return selectQueryStatusMapByKey(state, defaultPrepareQueryString(query))?.status;
  });

  if (dataset == null) {
    return (
      <CanvasPanel>
        <>
          <EuiSpacer size="xxl" />
          <DiscoverNoIndexPatterns />
        </>
      </CanvasPanel>
    );
  }

  if (status === QueryExecutionStatus.NO_RESULTS || status === QueryExecutionStatus.UNINITIALIZED) {
    return (
      <CanvasPanel>
        <ResizableVisControlAndTabs />
      </CanvasPanel>
    );
  }

  if (status === QueryExecutionStatus.LOADING && dataTableStatus === QueryExecutionStatus.LOADING) {
    return (
      <CanvasPanel>
        <LoadingSpinner />
      </CanvasPanel>
    );
  }

  if (
    dataTableStatus === QueryExecutionStatus.READY ||
    dataTableStatus === QueryExecutionStatus.ERROR ||
    status === QueryExecutionStatus.READY ||
    status === QueryExecutionStatus.ERROR
  ) {
    return (
      <>
        <CanvasPanel>
          <ResizableVisControlAndTabs />
        </CanvasPanel>
      </>
    );
  }

  return null;
};
