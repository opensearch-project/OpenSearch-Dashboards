/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { IDataPluginServices } from '../../../../../data/public';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { PromptParameters, PromptResponse } from '../components/editor_stack/types';
import { formatError } from '../utils/error';
import { ABORT_DATA_QUERY_TRIGGER, UiActionsStart } from '../../../../../ui_actions/public';

export const useGenerateQuery = (uiActions: UiActionsStart) => {
  const mounted = useRef(false);
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef<AbortController>();
  const { services } = useOpenSearchDashboards<IDataPluginServices>();

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = undefined;
      }
    };
  }, []);

  const generateQuery = async (
    params: PromptParameters
  ): Promise<{ response?: PromptResponse; error?: Error }> => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    setLoading(true);
    try {
      uiActions
        .getTrigger(ABORT_DATA_QUERY_TRIGGER)
        .exec({ reason: 'trigger abort action if trying to use query assistant' });
      const response = await services.http.post<PromptResponse>('/api/explore/assist/generate', {
        body: JSON.stringify(params),
        signal: abortControllerRef.current?.signal,
      });
      if (mounted.current) return { response };
    } catch (error) {
      console.log('Error generating query:', error);
      //   if (mounted.current) return { error: formatError(error) };
    } finally {
      if (mounted.current) setLoading(false);
    }
    return {};
  };

  return { generateQuery, loading, abortControllerRef };
};
