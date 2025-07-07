/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { ExploreServices } from '../../../../../../../types';
import { AppDispatch, RootState } from '../../../../store';
import {
  QueryAssistParameters,
  QueryAssistResponse,
} from '../../../../../../../../../query_enhancements/common/query_assist';
import {
  AgentError,
  ProhibitedQueryError,
} from '../../../../../../../components/query_panel/utils/error';
import { setEditorMode } from '../../../../slices';
import { EditorMode } from '../../../../types';
import { runQueryActionCreator } from '../../run_query';
import { EditorContextValue } from '../../../../../../context';

export const callAgentActionCreator = createAsyncThunk<
  void,
  { services: ExploreServices; editorContext: EditorContextValue },
  { state: RootState; dispatch: AppDispatch }
>('queryEditor/callAgent', async ({ services, editorContext }, { getState, dispatch }) => {
  const {
    queryEditor: { editorMode },
  } = getState();
  const dataset = services.data.query.queryString.getQuery().dataset;

  const prompt = editorContext.prompt;

  if (!prompt.length) {
    services.notifications.toasts.addWarning({
      title: i18n.translate('explore.queryPanel.missing-prompt-warning-title', {
        defaultMessage: 'Missing prompt',
      }),
      text: i18n.translate('explore.queryPanel.missing-prompt-warning-text', {
        defaultMessage: 'Enter a question to automatically generate a query',
      }),
      id: 'missing-prompt-warning',
    });
    return;
  }

  if (!dataset) {
    services.notifications.toasts.addWarning({
      title: i18n.translate('explore.queryPanel.missing-dataset-warning', {
        defaultMessage: 'Select a dataset to ask a question',
      }),
      id: 'missing-dataset-warning',
    });
    return;
  }

  try {
    const params: QueryAssistParameters = {
      question: prompt,
      index: dataset.title,
      // TODO: when we introduce more query languages, this should be no longer be hardcoded to PPL
      language: 'PPL',
      dataSourceId: dataset.dataSource?.id,
    };

    const response = await services.http.post<QueryAssistResponse>(
      '/api/enhancements/assist/generate',
      {
        body: JSON.stringify(params),
      }
    );

    editorContext.setBottomEditorText(response.query);

    if (editorMode !== EditorMode.DualPrompt) {
      dispatch(setEditorMode(EditorMode.DualPrompt));
    }

    if (response.timeRange) {
      services.data.query.timefilter.timefilter.setTime(response.timeRange);
    }

    dispatch(runQueryActionCreator(services, response.query));
  } catch (error) {
    if (error instanceof ProhibitedQueryError) {
      services.notifications.toasts.addError(error, {
        id: 'prohibited-query-error',
        title: i18n.translate('explore.queryPanel.prohibited-query-error', {
          defaultMessage: 'I am unable to respond to this query. Try another question',
        }),
      });
    } else if (error instanceof AgentError) {
      services.notifications.toasts.addError(error, {
        id: 'agent-error',
        title: i18n.translate('explore.queryPanel.agent-error', {
          defaultMessage: 'I am unable to respond to this query. Try another question',
        }),
      });
    } else {
      services.notifications.toasts.addError(error, {
        id: 'miscellaneous-prompt-error',
        title: i18n.translate('explore.queryPanel.miscellaneous-prompt-error', {
          defaultMessage: 'Failed to generate results',
        }),
      });
    }
  }
});
