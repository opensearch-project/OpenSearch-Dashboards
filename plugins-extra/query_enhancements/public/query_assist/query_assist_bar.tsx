import { EuiButtonIcon, EuiFlexGroup, EuiFlexItem, EuiForm, EuiFormRow } from '@elastic/eui';
import React, { SyntheticEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { PersistedLog } from '../../../../src/plugins/data/public';
import { SearchBarExtensionDependencies } from '../../../../src/plugins/data/public/ui/search_bar_extensions/search_bar_extension';
import { DataExplorerServices } from '../../../../src/plugins/data_explorer/public';
import { useOpenSearchDashboards } from '../../../../src/plugins/opensearch_dashboards_react/public';
import { getCore, getStorage } from '../services';
import { QueryAssistCallOut, QueryAssistCallOutType } from './call_outs';
import { getPersistedLog } from './get_persisted_log';
import { useGenerateQuery } from './hooks/use_generate';
import { QueryAssistInput } from './query_assist_input';
import {
  createOsdUrlStateStorage,
  withNotifyOnErrors,
} from '../../../../src/plugins/opensearch_dashboards_utils/public';
import { ProhibitedQueryError } from './errors';
import { QueryAssistSubmitButton } from './submit_button';

export interface QueryAssistGlobalState {
  question: string;
  callOutType: QueryAssistCallOutType;
}

interface QueryAssistInputProps {
  dependencies: SearchBarExtensionDependencies;
}

const state: QueryAssistGlobalState = {
  question: '',
  callOutType: undefined,
};

let previousQuestion: string;

export const QueryAssistBar: React.FC<QueryAssistInputProps> = (props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const core = getCore();
  const storage = getStorage();
  const persistedLog: PersistedLog = useMemo(
    () => getPersistedLog(core.uiSettings, storage, 'query-assist'),
    [core.uiSettings, storage]
  );
  const { generateQuery, loading, abortControllerRef } = useGenerateQuery({ persistedLog });
  const [callOutType, setCallOutType] = useState<QueryAssistCallOutType>(state.callOutType);
  const mounted = useRef(false);
  const selectedIndex = props.dependencies.indexPatterns?.at(0)?.title;
  // const previousQuestionRef = useRef<string>();

  const {
    services: { osdUrlStateStorage },
  } = useOpenSearchDashboards<DataExplorerServices>();
  const osdUrlState = createOsdUrlStateStorage({
    history: useHistory(),
    useHash: core.uiSettings.get('state:storeInSessionStorage'),
    ...withNotifyOnErrors(core.notifications.toasts),
  });

  // const stateContainer = createStateContainer<QueryAssistUrlState>({
  //   question: '',
  //   callOutType: undefined,
  // });
  // const { start, stop: stopSyncingWithUrl } = syncState({
  //   stateStorage: osdUrlStateStorage,
  //   stateContainer: {
  //     ...stateContainer,
  //     set: (state) => {
  //       if (state) stateContainer.set(state);
  //     },
  //   },
  //   storageKey: '_qa',
  // });
  // useEffect(() => {
  //   start();
  //   return () => stopSyncingWithUrl();
  // }, [start, stopSyncingWithUrl]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // useEffect(() => () => abortControllerRef.current?.abort(), [abortControllerRef]);

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
    // stateContainer.set({ ...stateContainer.get(), question: inputRef.current.value });
    // void osdUrlStateStorage.set('_qa', { question: inputRef.current.value }, { replace = true });
    state.question = inputRef.current.value;
    previousQuestion = inputRef.current.value;
    const { response, error } = await generateQuery({
      question: inputRef.current.value,
      index: selectedIndex,
      language: 'PPL',
    });
    // if (!mounted.current) return;
    if (error) {
      if (error instanceof ProhibitedQueryError) {
        setCallOutType('invalid_query');
      } else {
        core.notifications.toasts.addError(error, { title: 'Failed to generate results' });
      }
    } else if (response) {
      setCallOutType('query_generated');
      state.callOutType = 'query_generated';
    }
  };

  return (
    <EuiForm component="form" onSubmit={onSubmit}>
      <EuiFormRow fullWidth>
        <EuiFlexGroup gutterSize="s" responsive={false} alignItems="center">
          <EuiFlexItem>
            <QueryAssistInput
              initialValue={state.question}
              inputRef={inputRef}
              persistedLog={persistedLog}
              selectedIndex={selectedIndex}
              previousQuestion={previousQuestion}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <QueryAssistSubmitButton isDisabled={loading} />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFormRow>
      <QueryAssistCallOut type={callOutType} onDismiss={() => setCallOutType(undefined)} />
    </EuiForm>
  );
};
