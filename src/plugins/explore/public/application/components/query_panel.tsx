/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { EuiPanel, EuiButton, EuiSuperDatePicker } from '@elastic/eui';
import { monaco } from '@osd/monaco';
import { ExploreServices } from '../../types';
import {
  DefaultInput,
  UI_SETTINGS,
  getEffectiveLanguageForAutoComplete,
} from '../../../../data/public';
import { IndexPattern } from '../../../../data/common/index_patterns';
import { setQuery } from '../utils/state_management/slices/query_slice';

import { RecentQuerySelector } from './recent_query_selector';
import {
  beginTransaction,
  finishTransaction,
} from '../utils/state_management/actions/transaction_actions';
import { clearResults } from '../utils/state_management/slices/results_slice';
import { selectIsLoading, selectDataset, selectQuery } from '../utils/state_management/selectors';
import { ResultStatus, QueryStatus } from '../utils/state_management/types';
import { executeQueries } from '../utils/state_management/actions/query_actions';

/**
 * TEMPORARY: Custom query panel component for the Explore plugin
 *
 * This is a temporary implementation that will be integrated with
 * src/plugins/explore/public/components/query_panel/ in the future.
 *
 * Current purpose: Enable query state updates and maintain application flow
 * Uses Redux for state management and supports datePickerRef for external date picker
 *
 * TODO: Remove this temporary component after integration with the main query panel
 */
export interface QueryPanelProps {
  datePickerRef?: React.RefObject<HTMLDivElement>;
  services: ExploreServices;
  indexPattern: IndexPattern;
}

export const QueryPanel: React.FC<QueryPanelProps> = ({
  datePickerRef,
  services,
  indexPattern,
}) => {
  const dispatch = useDispatch();

  // Use selectors to get state from Redux
  const query = useSelector(selectQuery);
  const isLoading = useSelector(selectIsLoading);
  const dataset = useSelector(selectDataset);

  // Determine if DatePicker should be shown
  const showDatePicker = Boolean(indexPattern?.timeFieldName);

  // Get timefilter directly from services
  const timefilter = services?.data?.query?.timefilter?.timefilter;

  // Local state for editor
  const [localQuery, setLocalQuery] = useState(query.query);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // Handle query change
  const handleQueryChange = useCallback((value: string) => {
    setLocalQuery(value);
  }, []);

  // Handle time range changes
  const handleTimeChange = useCallback(
    ({ start, end }: { start: string; end: string }) => {
      const newTimeRange = { from: start, to: end };

      // Update timefilter - this will trigger re-render automatically
      if (timefilter) {
        timefilter.setTime(newTimeRange);
      }
    },
    [timefilter]
  );

  const handleRefreshChange = useCallback(
    ({ isPaused, refreshInterval: interval }: { isPaused: boolean; refreshInterval: number }) => {
      const newRefreshInterval = { pause: isPaused, value: interval };

      // Update timefilter - this will trigger re-render automatically
      if (timefilter) {
        timefilter.setRefreshInterval(newRefreshInterval);
      }
    },
    [timefilter]
  );

  // Execute query when run button is clicked
  const handleRunQuery = useCallback(async () => {
    dispatch(beginTransaction());
    try {
      dispatch(setQuery({ ...query, query: localQuery }));
      dispatch(clearResults());
      await dispatch(executeQueries({ services }) as any);
    } finally {
      dispatch(finishTransaction());
    }
  }, [dispatch, localQuery, query, services]);

  // Handle editor mount
  const handleEditorDidMount = useCallback(
    (editor: monaco.editor.IStandaloneCodeEditor) => {
      editorRef.current = editor;

      // Add command to execute query on Ctrl+Enter
      const modifierKey = monaco.KeyMod.CtrlCmd;
      const enterKey = monaco.KeyCode.Enter;
      const keyCombo = modifierKey + enterKey;

      editor.addCommand(keyCombo, handleRunQuery);

      return editor;
    },
    [handleRunQuery]
  );

  // Real autocomplete implementation using the data plugin's autocomplete service
  const provideCompletionItems = useCallback(
    async (
      model: monaco.editor.ITextModel,
      position: monaco.Position,
      context: monaco.languages.CompletionContext,
      token: monaco.CancellationToken
    ): Promise<monaco.languages.CompletionList> => {
      if (token.isCancellationRequested) {
        return { suggestions: [], incomplete: false };
      }

      try {
        // Get the effective language for autocomplete (PPL -> PPL_Simplified for explore app)
        const effectiveLanguage = getEffectiveLanguageForAutoComplete(query.language, 'explore');

        // Use centralized IndexPattern from context
        const suggestions = await services?.data?.autocomplete?.getQuerySuggestions({
          query: editorRef.current?.getValue() ?? '',
          selectionStart: model.getOffsetAt(position),
          selectionEnd: model.getOffsetAt(position),
          language: effectiveLanguage,
          indexPattern: indexPattern as any,
          datasetType: dataset?.type,
          position,
          services: services as any, // ExploreServices now includes appName, compatible with IDataPluginServices
        });

        // current completion item range being given as last 'word' at pos
        const wordUntil = model.getWordUntilPosition(position);

        const defaultRange = new monaco.Range(
          position.lineNumber,
          wordUntil.startColumn,
          position.lineNumber,
          wordUntil.endColumn
        );

        const filteredSuggestions = suggestions?.filter((s) => 'detail' in s) || [];

        const monacoSuggestions = filteredSuggestions.map((s: any) => ({
          label: s.text,
          kind: s.type as monaco.languages.CompletionItemKind,
          insertText: s.insertText ?? s.text,
          insertTextRules: s.insertTextRules ?? undefined,
          range: defaultRange,
          detail: s.detail,
          sortText: s.sortText,
        }));

        const result = {
          suggestions: monacoSuggestions,
          incomplete: false,
        };

        return result;
      } catch (autocompleteError) {
        return { suggestions: [], incomplete: false };
      }
    },
    [services, query, indexPattern, dataset?.type]
  );

  // Create query status object for progress indicator
  const queryStatus: QueryStatus = {
    status: isLoading ? ResultStatus.LOADING : ResultStatus.READY,
    elapsedMs: 0,
    startTime: Date.now(),
  };

  return (
    <>
      <EuiPanel paddingSize="s" hasBorder>
        <DefaultInput
          languageId={query.language}
          value={localQuery}
          onChange={handleQueryChange}
          editorDidMount={handleEditorDidMount}
          headerRef={headerRef}
          provideCompletionItems={provideCompletionItems}
          queryStatus={queryStatus}
          footerItems={{
            start: [<RecentQuerySelector size="xs" key="recentQueries" />],
            end: [
              // Date picker will be rendered here via datePickerRef
              datePickerRef && (
                <div
                  ref={datePickerRef}
                  key="datePicker"
                  style={{ display: 'inline-flex', alignItems: 'center', marginRight: '8px' }}
                />
              ),
              // DatePicker using EuiSuperDatePicker directly
              (() => {
                if (!showDatePicker) {
                  return null;
                }
                return (
                  <EuiSuperDatePicker
                    key="datePicker"
                    start={timefilter?.getTime().from}
                    end={timefilter?.getTime().to}
                    isPaused={timefilter?.getRefreshInterval().pause}
                    refreshInterval={timefilter?.getRefreshInterval().value}
                    onTimeChange={handleTimeChange}
                    onRefresh={handleRunQuery}
                    onRefreshChange={handleRefreshChange}
                    showUpdateButton={false}
                    commonlyUsedRanges={services?.uiSettings
                      ?.get(UI_SETTINGS.TIMEPICKER_QUICK_RANGES)
                      ?.map(
                        ({ from, to, display }: { from: string; to: string; display: string }) => ({
                          start: from,
                          end: to,
                          label: display,
                        })
                      )}
                    dateFormat={services?.uiSettings?.get('dateFormat')}
                    compressed={true}
                    data-test-subj="exploreQueryPanelDatePicker"
                  />
                );
              })(),
              // Run button
              <EuiButton
                key="runButton"
                fill
                iconType="play"
                onClick={handleRunQuery}
                isLoading={isLoading}
                disabled={isLoading}
                data-test-subj="exploreRunButton"
              >
                Run query
              </EuiButton>,
            ].filter(Boolean),
          }}
        />
      </EuiPanel>
    </>
  );
};
