import { EuiFlexGroup, EuiFlexItem, EuiForm, EuiFormRow } from '@elastic/eui';
import React, { SyntheticEvent, useMemo, useRef, useState } from 'react';
import { IDataPluginServices, PersistedLog } from '../../../../../src/plugins/data/public';
import { QueryEditorExtensionDependencies } from '../../../../../src/plugins/data/public/ui/query_editor/query_editor_extensions/query_editor_extension';
import { useOpenSearchDashboards } from '../../../../../src/plugins/opensearch_dashboards_react/public';
import { QueryAssistParameters } from '../../../common/query_assist';
import { getStorage } from '../../services';
import { useGenerateQuery } from '../hooks';
import { getMdsDataSourceId, getPersistedLog, ProhibitedQueryError } from '../utils';
import { QueryAssistCallOut, QueryAssistCallOutType } from './call_outs';
import { QueryAssistInput } from './query_assist_input';
import { QueryAssistSubmitButton } from './submit_button';

interface QueryAssistInputProps {
  dependencies: QueryEditorExtensionDependencies;
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
  const selectedIndexPattern = props.dependencies.indexPatterns?.at(0);
  const selectedIndex =
    selectedIndexPattern &&
    (typeof selectedIndexPattern === 'string' ? selectedIndexPattern : selectedIndexPattern.title);
  const previousQuestionRef = useRef<string>();

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
    const dataSourceId = await getMdsDataSourceId(
      services.data.indexPatterns,
      selectedIndexPattern
    );
    const params: QueryAssistParameters = {
      question: inputRef.current.value,
      index: selectedIndex,
      language: props.dependencies.language,
      dataSourceId,
    };
    const { response, error } = await generateQuery(params);
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
              isDisabled={loading}
              selectedIndex={selectedIndex}
              previousQuestion={previousQuestionRef.current}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <QueryAssistSubmitButton isDisabled={loading} />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFormRow>
      <QueryAssistCallOut
        language={props.dependencies.language}
        type={callOutType}
        onDismiss={dismissCallout}
      />
    </EuiForm>
  );
};
