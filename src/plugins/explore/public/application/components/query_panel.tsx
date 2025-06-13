/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { EuiPanel, EuiButton, EuiSpacer, EuiText, EuiSuperDatePicker } from '@elastic/eui';
import { monaco } from '@osd/monaco';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../types';
import { DefaultInput, UI_SETTINGS } from '../../../../data/public';
import { setQueryString } from '../utils/state_management/slices/query_slice';
import { RecentQuerySelector } from './recent_query_selector';
import {
  beginTransaction,
  finishTransaction,
} from '../utils/state_management/actions/transaction_actions';
import { clearResults } from '../utils/state_management/slices/results_slice';
import {
  selectQueryString,
  selectQueryLanguage,
  selectIsLoading,
  selectDataset,
} from '../utils/state_management/selectors';
import { ResultStatus, QueryStatus } from '../utils/state_management/types';
import { executeQueries } from '../utils/state_management/actions/query_actions';
import { useIndexPatternContext } from './index_pattern_context';

export interface QueryPanelProps {
  datePickerRef?: React.RefObject<HTMLDivElement>;
}

/**
 * Custom query panel component for the Explore plugin
 * Uses Redux for state management and supports datePickerRef for external date picker
 */
export const QueryPanel: React.FC<QueryPanelProps> = ({ datePickerRef }) => {
  const dispatch = useDispatch();

  // Get services from context
  const { services } = useOpenSearchDashboards<ExploreServices>();

  // Use selectors to get state from Redux
  const queryString = useSelector(selectQueryString);
  const queryLanguage = useSelector(selectQueryLanguage);
  const isLoading = useSelector(selectIsLoading);
  const dataset = useSelector(selectDataset);

  // Get IndexPattern from centralized context
  const { indexPattern: contextIndexPattern } = useIndexPatternContext();

  // Use the centralized IndexPattern for DatePicker
  const indexPattern = useMemo(() => {
    if (contextIndexPattern) {
      return contextIndexPattern;
    } else if (dataset) {
      // Fallback to basic object if context IndexPattern not available yet
      return {
        isTimeBased: () => !!dataset?.timeFieldName,
        timeFieldName: dataset?.timeFieldName,
        id: dataset?.id,
        title: dataset?.title,
      };
    }
    return null;
  }, [dataset, contextIndexPattern]);

  // Determine if DatePicker should be shown (like discover)
  const showDatePicker = useMemo(() => {
    const hasTimeField = dataset?.timeFieldName;
    const result = Boolean(hasTimeField);

    return result;
  }, [dataset]);

  // Time range state for DatePicker
  const [timeRange, setTimeRange] = useState(() => {
    const timefilter = services?.data?.query?.timefilter?.timefilter;
    if (timefilter) {
      const currentTime = timefilter.getTime();
      return {
        from: currentTime.from,
        to: currentTime.to,
      };
    }
    return { from: 'now-15m', to: 'now' };
  });

  useEffect(() => {
    const timefilter = services?.data?.query?.timefilter?.timefilter;
    if (timefilter) {
      const subscription = timefilter.getTimeUpdate$().subscribe(() => {
        const currentTime = timefilter.getTime();
        setTimeRange({
          from: currentTime.from,
          to: currentTime.to,
        });
      });
      return () => subscription.unsubscribe();
    }
  }, [services]);

  const [refreshInterval, setRefreshInterval] = useState(() => {
    const timefilter = services?.data?.query?.timefilter?.timefilter;
    if (timefilter) {
      const currentRefresh = timefilter.getRefreshInterval();
      return {
        pause: currentRefresh.pause,
        value: currentRefresh.value,
      };
    }
    return { pause: true, value: 0 };
  });

  // Sync datePicker with timefilter changes (fixes URL state loading issue)
  useEffect(() => {
    const timefilter = services?.data?.query?.timefilter?.timefilter;
    if (timefilter) {
      const subscription = timefilter.getTimeUpdate$().subscribe(() => {
        const currentTime = timefilter.getTime();
        setTimeRange({
          from: currentTime.from,
          to: currentTime.to,
        });

        const currentRefresh = timefilter.getRefreshInterval();
        setRefreshInterval({
          pause: currentRefresh.pause,
          value: currentRefresh.value,
        });
      });
      return () => subscription.unsubscribe();
    }
  }, [services]);

  // Local state for editor
  const [localQuery, setLocalQuery] = useState(queryString);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // Update local state when Redux state changes
  useEffect(() => {
    setLocalQuery(queryString);
  }, [queryString]);

  // Handle query change
  const handleQueryChange = useCallback((value: string) => {
    setLocalQuery(value);
  }, []);

  // Handle time range changes
  const handleTimeChange = useCallback(
    ({ start, end }: { start: string; end: string }) => {
      const newTimeRange = { from: start, to: end };
      setTimeRange(newTimeRange);

      // Update timefilter
      if (services?.data?.query?.timefilter?.timefilter) {
        services.data.query.timefilter.timefilter.setTime(newTimeRange);
      }
    },
    [services]
  );

  const handleRefreshChange = useCallback(
    ({ isPaused, refreshInterval: interval }: { isPaused: boolean; refreshInterval: number }) => {
      const newRefreshInterval = { pause: isPaused, value: interval };
      setRefreshInterval(newRefreshInterval);

      // Update timefilter
      if (services?.data?.query?.timefilter?.timefilter) {
        services.data.query.timefilter.timefilter.setRefreshInterval(newRefreshInterval);
      }
    },
    [services]
  );

  // Execute query when run button is clicked
  const handleRunQuery = useCallback(async () => {
    dispatch(beginTransaction());
    try {
      // Update query string in Redux
      dispatch(setQueryString(localQuery));

      // EXPLICIT cache clear - separate cache logic
      dispatch(clearResults());

      // Execute queries - cache already cleared
      await dispatch(executeQueries({ services }) as any);
    } finally {
      dispatch(finishTransaction());
    }
  }, [dispatch, localQuery, services]);

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
        // Use centralized IndexPattern from context
        const suggestions = await services?.data?.autocomplete?.getQuerySuggestions({
          query: editorRef.current?.getValue() ?? '',
          selectionStart: model.getOffsetAt(position),
          selectionEnd: model.getOffsetAt(position),
          language: queryLanguage,
          indexPattern: contextIndexPattern,
          datasetType: dataset?.type,
          position,
          services: services as any, // Type cast for compatibility
        });

        // Transform suggestions to Monaco format
        const wordUntil = model.getWordUntilPosition(position);
        const defaultRange = new monaco.Range(
          position.lineNumber,
          wordUntil.startColumn,
          position.lineNumber,
          wordUntil.endColumn
        );

        return {
          suggestions: suggestions
            ? suggestions
                .filter((s: any) => 'detail' in s)
                .map((s: any) => ({
                  label: s.text,
                  kind: s.type as monaco.languages.CompletionItemKind,
                  insertText: s.insertText ?? s.text,
                  insertTextRules: s.insertTextRules ?? undefined,
                  range: s.replacePosition ?? defaultRange,
                  detail: s.detail,
                  command: { id: 'editor.action.triggerSuggest', title: 'Trigger Next Suggestion' },
                  sortText: s.sortText ?? s.text,
                }))
            : [],
          incomplete: false,
        };
      } catch (autocompleteError) {
        // Error getting autocomplete suggestions
        return { suggestions: [], incomplete: false };
      }
    },
    [services, queryLanguage, contextIndexPattern, dataset?.type]
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
          languageId={queryLanguage}
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
                    start={timeRange.from}
                    end={timeRange.to}
                    isPaused={refreshInterval.pause}
                    refreshInterval={refreshInterval.value}
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

        {/* Error handling moved to toast notifications via data.search.showError */}
      </EuiPanel>
    </>
  );
};
