/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { EuiSpacer } from '@elastic/eui';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useOpenSearchDashboards } from '../../../../../../../opensearch_dashboards_react/public';
import { CanvasPanel } from '../../../../../components/panel/canvas_panel';
import { ExploreServices } from '../../../../../types';
import { useDatasetContext } from '../../../../context';
import { useEditorRef } from '../../../../hooks';
import { LoadingSpinner } from '../../../../legacy/discover/application/components/loading_spinner/loading_spinner';
import { DiscoverNoIndexPatterns } from '../../../../legacy/discover/application/components/no_index_patterns/no_index_patterns';
import { DiscoverNoResults } from '../../../../legacy/discover/application/components/no_results/no_results';
import { DiscoverUninitialized } from '../../../../legacy/discover/application/components/uninitialized/uninitialized';
import { defaultPrepareQueryString } from '../../../../utils/state_management/actions/query_actions';
import { onEditorRunActionCreator } from '../../../../utils/state_management/actions/query_editor/on_editor_run/on_editor_run';
import { selectQueryStatusMapByKey } from '../../../../utils/state_management/selectors';
import { RootState } from '../../../../utils/state_management/store';
import { QueryExecutionStatus } from '../../../../utils/state_management/types';
import { ResizableVisControlAndTabs } from './resizable_vis_control_and_tabs';

export const BottomRightContainer = () => {
  const dispatch = useDispatch();
  const { dataset } = useDatasetContext();
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const editorRef = useEditorRef();

  const onRefresh = () => {
    if (services) {
      const editorText = editorRef.current?.getValue() || '';
      dispatch(onEditorRunActionCreator(services, editorText));
    }
  };

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

  if (status === QueryExecutionStatus.NO_RESULTS) {
    return (
      <CanvasPanel>
        <DiscoverNoResults
          queryString={services?.data?.query?.queryString}
          query={services?.data?.query?.queryString?.getQuery()}
          savedQuery={services?.data?.query?.savedQueries}
          timeFieldName={dataset.timeFieldName}
        />
      </CanvasPanel>
    );
  }

  if (status === QueryExecutionStatus.UNINITIALIZED) {
    return (
      <CanvasPanel>
        <DiscoverUninitialized onRefresh={onRefresh} />
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
