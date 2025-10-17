/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { ExploreServices } from '../../../../../../types';
import { AppDispatch, RootState } from '../../../store';
import { EditorMode } from '../../../types';
import { callAgentActionCreator } from './call_agent';
import { runQueryActionCreator } from '../run_query';
import { clearLastExecutedData, setHasUserInitiatedQuery } from '../../../slices';

// This is used when user submits a query or a prompt. This called runQueryActionCreator under the hood
export const onEditorRunActionCreator = (services: ExploreServices, editorText: string) => (
  dispatch: AppDispatch,
  getState: () => RootState
) => {
  const {
    queryEditor: { editorMode, promptModeIsAvailable, queryExecutionButtonStatus },
  } = getState();

  if (queryExecutionButtonStatus === 'DISABLED') return;

  // Set flag to indicate user has initiated a query
  dispatch(setHasUserInitiatedQuery(true));
  dispatch(clearLastExecutedData());

  if (editorMode === EditorMode.Prompt) {
    // Handle the unlikely situation where user is on prompt mode but does not have prompt available
    if (!promptModeIsAvailable) {
      services.notifications.toasts.addWarning({
        title: i18n.translate('explore.queryPanel.queryAssist-not-available-title', {
          defaultMessage: 'Unavailable',
        }),
        text: i18n.translate('explore.queryPanel.queryAssist-not-available-text', {
          defaultMessage: 'Query assist feature is not enabled or configured.',
        }),
        id: 'queryAssist-not-available',
      });
      return;
    }

    dispatch(callAgentActionCreator({ services, editorText }));
  } else {
    dispatch(runQueryActionCreator(services, editorText));
  }
};
