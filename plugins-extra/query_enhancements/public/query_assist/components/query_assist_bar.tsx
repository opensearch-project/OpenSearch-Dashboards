import { EuiFlexGroup, EuiFlexItem, EuiForm, EuiFormRow } from '@elastic/eui';
import React, { SyntheticEvent, useEffect, useMemo, useRef, useState } from 'react';
import { IDataPluginServices, PersistedLog } from '../../../../../src/plugins/data/public';
import { SearchBarExtensionDependencies } from '../../../../../src/plugins/data/public/ui/search_bar_extensions/search_bar_extension';
import { useOpenSearchDashboards } from '../../../../../src/plugins/opensearch_dashboards_react/public';
import { getStorage } from '../../services';
import { useGenerateQuery } from '../hooks';
import { getPersistedLog, ProhibitedQueryError } from '../utils';
import { QueryAssistCallOut, QueryAssistCallOutType } from './call_outs';
import { QueryAssistInput } from './query_assist_input';
import { QueryAssistSubmitButton } from './submit_button';

interface QueryAssistInputProps {
  dependencies: SearchBarExtensionDependencies;
}

export const QueryAssistBar: React.FC<QueryAssistInputProps> = (props) => {
  const { services } = useOpenSearchDashboards<IDataPluginServices>();
  const inputRef = useRef<HTMLInputElement>(null);
  const storage = getStorage();
  const persistedLog: PersistedLog = useMemo(
    () => getPersistedLog(services.uiSettings, storage, 'query-assist'),
    [services.uiSettings, storage]
  );
  const { generateQuery, loading } = useGenerateQuery();
  const [callOutType, setCallOutType] = useState<QueryAssistCallOutType>();
  const dismissCallout = () => setCallOutType(undefined);
  const mounted = useRef(false);
  const selectedIndex = props.dependencies.indexPatterns?.at(0)?.title;
  const previousQuestionRef = useRef<string>();

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const onSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();
    if (!inputRef.current?.value) {
      setCallOutType('empty_query');
      return;
    }
    if (!selectedIndex) {
      setCallOutType('empty_index');
      return;
    }
    dismissCallout();
    previousQuestionRef.current = inputRef.current.value;
    persistedLog.add(inputRef.current.value);
    const params = {
      question: inputRef.current.value,
      index: selectedIndex,
      language: 'PPL',
    };
    const { response, error } = await generateQuery(params);
    if (!mounted.current) return;
    if (error) {
      if (error instanceof ProhibitedQueryError) {
        setCallOutType('invalid_query');
      } else {
        services.notifications.toasts.addError(error, { title: 'Failed to generate results' });
      }
    } else if (response) {
      services.data.query.queryString.setQuery({
        query: response.query,
        language: params.language,
      });
      if (response.timeRange) services.data.query.timefilter.timefilter.setTime(response.timeRange);
      setCallOutType('query_generated');
    }
  };

  return (
    <EuiForm component="form" onSubmit={onSubmit}>
      <EuiFormRow fullWidth>
        <EuiFlexGroup gutterSize="s" responsive={false} alignItems="center">
          <EuiFlexItem>
            <QueryAssistInput
              inputRef={inputRef}
              persistedLog={persistedLog}
              selectedIndex={selectedIndex}
              previousQuestion={previousQuestionRef.current}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <QueryAssistSubmitButton isDisabled={loading} />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFormRow>
      <QueryAssistCallOut type={callOutType} onDismiss={dismissCallout} />
    </EuiForm>
  );
};
