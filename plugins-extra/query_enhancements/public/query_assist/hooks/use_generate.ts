import { useRef, useState } from 'react';
import { PersistedLog } from '../../../../../src/plugins/data/public';
import { QueryAssistParameters, QueryAssistResponse } from '../../../common/query_assist';
import { getCore, getData } from '../../services';
import { formatError } from '../errors';

interface SubmitOptions {
  persistedLog: PersistedLog;
}

export const useGenerateQuery = ({ persistedLog }: SubmitOptions) => {
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef<AbortController>();
  const core = getCore();
  const data = getData();

  const generateQuery = async (
    params: QueryAssistParameters
  ): Promise<{ response?: QueryAssistResponse; error?: Error }> => {
    abortControllerRef.current = new AbortController();
    persistedLog.add(params.question);
    setLoading(true);
    try {
      const response = await core.http.post<QueryAssistResponse>('/api/ql/query_assist/generate', {
        body: JSON.stringify(params),
        signal: abortControllerRef.current?.signal,
      });
      data.query.queryString.setQuery({ query: response.query, language: params.language });
      if (response.timeRange) data.query.timefilter.timefilter.setTime(response.timeRange);
      return { response };
    } catch (error) {
      return { error: formatError(error) };
    } finally {
      setLoading(false);
    }
  };

  return { generateQuery, loading, abortControllerRef };
};
