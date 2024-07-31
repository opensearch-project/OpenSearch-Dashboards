/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiFlexGroup, EuiFlexItem, EuiForm, EuiFormRow } from '@elastic/eui';
import React, { SyntheticEvent, useEffect, useMemo, useRef, useState } from 'react';
import { SimpleDataSet } from '../../../../data/common';
import {
  IDataPluginServices,
  PersistedLog,
  QueryEditorExtensionDependencies,
} from '../../../../data/public';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { QueryAssistParameters } from '../../../common/query_assist';
import { getStorage } from '../../services';
import { useGenerateQuery } from '../hooks';
import { getPersistedLog, ProhibitedQueryError } from '../utils';
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
  const [selectedDataSet, setSelectedDataSet] = useState<SimpleDataSet | undefined>(
    services.data.query.dataSetManager.getDataSet()
  );
  const selectedIndex = selectedDataSet?.title;
  const previousQuestionRef = useRef<string>();

  useEffect(() => {
    const subscription = services.data.query.dataSetManager.getUpdates$().subscribe((dataSet) => {
      setSelectedDataSet(dataSet);
    });
    return () => subscription.unsubscribe();
  }, [services.data.query.dataSetManager]);

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
    const params: QueryAssistParameters = {
      question: inputRef.current.value,
      index: selectedIndex,
      language: props.dependencies.language,
      dataSourceId: selectedDataSet?.dataSourceRef?.id,
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

  if (props.dependencies.isCollapsed) return null;

  return (
    <EuiForm component="form" onSubmit={onSubmit} className="queryAssist queryAssist__form">
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
