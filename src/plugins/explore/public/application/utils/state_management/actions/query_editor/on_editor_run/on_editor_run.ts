/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { ExploreServices } from '../../../../../../types';
import { AppDispatch, RootState } from '../../../store';
import { EditorMode } from '../../../types';
import { callAgentActionCreator } from './call_agent';
import { setEditorMode } from '../../../slices';
import { runQueryActionCreator } from '../run_query';
import { EditorContextValue } from '../../../../../context';

// This is used when user submits a query or a prompt. This called runQueryActionCreator under the hood
export const onEditorRunActionCreator = (
  services: ExploreServices,
  editorContext: EditorContextValue
) => (dispatch: AppDispatch, getState: () => RootState) => {
  const {
    queryEditor: { editorMode, promptModeIsAvailable },
  } = getState();

  if ([EditorMode.SinglePrompt, EditorMode.DualPrompt].includes(editorMode)) {
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

    dispatch(callAgentActionCreator({ services, editorContext }));
  } else if (
    [EditorMode.SingleEmpty, EditorMode.SingleQuery, EditorMode.DualQuery].includes(editorMode)
  ) {
    const query = editorContext.editorText;

    if (editorMode === EditorMode.DualQuery) {
      // clear bottom editor and convert back to single editor
      editorContext.clearEditorsAndSetText(query);
      dispatch(setEditorMode(EditorMode.SingleQuery));
    }

    dispatch(runQueryActionCreator(services, query));
  } else {
    throw new Error(`onEditorRunActionCreator encountered unknown editorMode: ${editorMode}`);
  }
};
