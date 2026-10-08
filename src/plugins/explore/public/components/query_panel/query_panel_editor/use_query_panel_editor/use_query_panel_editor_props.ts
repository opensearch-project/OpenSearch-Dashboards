/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  selectPromptModeIsAvailable,
  selectQueryLanguage,
  selectQueryString,
  selectIsQueryEditorDirty,
  selectDataset,
  selectEditorMode,
} from '../../../../application/utils/state_management/selectors';

import { useLanguageSwitch } from '../../../../application/hooks/editor_hooks/use_switch_language';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../../types';
import { onEditorRunActionCreator } from '../../../../application/utils/state_management/actions/query_editor';

import { setIsQueryEditorDirty } from '../../../../application/utils/state_management/slices/query_editor/query_editor_slice';

import { QueryEditorProps, PartialQueryEditorState } from '../types';
import { useEditorRef } from '../../../../application/hooks';

export const useQueryPanelEditorProps = (): QueryEditorProps => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const userQueryString = useSelector(selectQueryString);
  const queryLanguage = useSelector(selectQueryLanguage);
  const dataset = useSelector(selectDataset);

  const editorMode = useSelector(selectEditorMode);
  const isQueryEditorDirty = useSelector(selectIsQueryEditorDirty);
  const promptModeIsAvailable = useSelector(selectPromptModeIsAvailable);

  const dispatch = useDispatch();

  const onRun = useCallback(
    (queryString: string) => {
      // @ts-expect-error TS2345
      dispatch(onEditorRunActionCreator(services, queryString));
    },
    [dispatch, services]
  );

  const editorRef = useEditorRef();

  const handleEditorChange = useCallback(
    (updates: Partial<PartialQueryEditorState>) => {
      if (updates.isQueryEditorDirty !== undefined) {
        dispatch(setIsQueryEditorDirty(updates.isQueryEditorDirty));
      }
    },
    [dispatch]
  );

  const switchEditorMode = useLanguageSwitch();

  const getEditorContainerHeight = useCallback((domNode: HTMLElement | null) => {
    const panelEl = domNode?.closest('.exploreResizableQueryContainer__queryPanel');
    return panelEl?.clientHeight ?? domNode?.parentElement?.clientHeight ?? 100;
  }, []);

  return {
    services,
    editorRef,
    queryState: {
      query: userQueryString,
      dataset,
      language: queryLanguage,
    },
    queryEditorState: {
      editorMode,
      promptModeIsAvailable,
      isQueryEditorDirty,
    },
    onRun,
    switchEditorMode,
    handleEditorChange,
    focusShortcutId: 'explore_log_focus_query_bar',
    getEditorContainerHeight,
  };
};
