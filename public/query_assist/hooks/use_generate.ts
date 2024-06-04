import { useEffect, useRef, useState } from 'react';
import { IDataPluginServices } from '../../../../../src/plugins/data/public';
import { useOpenSearchDashboards } from '../../../../../src/plugins/opensearch_dashboards_react/public';
import { QueryAssistParameters, QueryAssistResponse } from '../../../common/query_assist';
import { formatError } from '../utils';

export const useGenerateQuery = () => {
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef<AbortController>();
  const { services } = useOpenSearchDashboards<IDataPluginServices>();

  useEffect(() => () => abortControllerRef.current?.abort(), []);

  const generateQuery = async (
    params: QueryAssistParameters
  ): Promise<{ response?: QueryAssistResponse; error?: Error }> => {
    abortControllerRef.current = new AbortController();
    setLoading(true);
    try {
      const response = await services.http.post<QueryAssistResponse>(
        '/api/ql/query_assist/generate',
        {
          body: JSON.stringify(params),
          signal: abortControllerRef.current?.signal,
        }
      );
      return { response };
    } catch (error) {
      return { error: formatError(error) };
    } finally {
      setLoading(false);
    }
  };

  return { generateQuery, loading, abortControllerRef };
};
