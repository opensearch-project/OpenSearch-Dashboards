/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiFieldText, EuiIcon, EuiOutsideClickDetector, EuiPortal } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import React, { useMemo, useState } from 'react';
import { PersistedLog, QuerySuggestionTypes } from '../../../../data/public';
import assistantMark from '../../assets/sparkle_mark.svg';
import { getData } from '../../services';
import { AgentError } from '../utils';
import { WarningBadge } from './warning_badge';

interface QueryAssistInputProps {
  inputRef: React.RefObject<HTMLInputElement>;
  persistedLog: PersistedLog;
  isDisabled: boolean;
  initialValue?: string;
  selectedIndex?: string;
  previousQuestion?: string;
  error?: AgentError;
}

export const QueryAssistInput: React.FC<QueryAssistInputProps> = (props) => {
  const {
    ui: { SuggestionsComponent },
  } = getData();
  const [isSuggestionsVisible, setIsSuggestionsVisible] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState<number | null>(null);
  const [value, setValue] = useState(props.initialValue ?? '');

  const sampleDataSuggestions = useMemo(() => {
    switch (props.selectedIndex) {
      case 'opensearch_dashboards_sample_data_ecommerce':
        return [
          'How many unique customers placed orders this week?',
          'Count the number of orders grouped by manufacturer and category',
          'find customers with first names like Eddie',
        ];

      case 'opensearch_dashboards_sample_data_logs':
        return [
          'Are there any errors in my logs?',
          'How many requests were there grouped by response code last week?',
          "What's the average request size by week?",
        ];

      case 'opensearch_dashboards_sample_data_flights':
        return [
          'how many flights were there this week grouped by destination country?',
          'what were the longest flight delays this week?',
          'what carriers have the furthest flights?',
        ];

      default:
        return [];
    }
  }, [props.selectedIndex]);

  const suggestions = useMemo(() => {
    if (!props.persistedLog) return [];
    return props.persistedLog
      .get()
      .concat(sampleDataSuggestions)
      .filter(
        (suggestion, i, array) => array.indexOf(suggestion) === i && suggestion.includes(value)
      )
      .map((suggestion) => ({
        type: QuerySuggestionTypes.RecentSearch,
        text: suggestion,
        start: 0,
        end: value.length,
      }));
  }, [props.persistedLog, value, sampleDataSuggestions]);

  return (
    <EuiOutsideClickDetector onOutsideClick={() => setIsSuggestionsVisible(false)}>
      <div className="queryAssist__inputWrapper">
        <EuiFieldText
          className="queryAssist__input"
          data-test-subj="query-assist-input-field-text"
          inputRef={props.inputRef}
          value={value}
          disabled={props.isDisabled}
          onClick={() => setIsSuggestionsVisible(true)}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={() => setIsSuggestionsVisible(true)}
          placeholder={
            props.previousQuestion ||
            (props.selectedIndex
              ? i18n.translate('queryEnhancements.queryAssist.input.placeholderWithIndex', {
                  defaultMessage:
                    'Ask a natural language question about {selectedIndex} to generate a query',
                  values: { selectedIndex: props.selectedIndex },
                })
              : i18n.translate('queryEnhancements.queryAssist.input.placeholderWithoutIndex', {
                  defaultMessage: 'Select an index to ask a question',
                }))
          }
          prepend={<EuiIcon type={assistantMark} />}
          append={<WarningBadge error={props.error} />}
          fullWidth
        />
        <EuiPortal>
          <SuggestionsComponent
            show={isSuggestionsVisible}
            suggestions={suggestions}
            index={suggestionIndex}
            onClick={(suggestion) => {
              if (!props.inputRef.current) return;
              setValue(suggestion.text);
              setIsSuggestionsVisible(false);
              setSuggestionIndex(null);
              props.inputRef.current.focus();
            }}
            onMouseEnter={(i) => setSuggestionIndex(i)}
            loadMore={() => {}}
            queryBarRect={props.inputRef.current?.getBoundingClientRect()}
            size="s"
          />
        </EuiPortal>
      </div>
    </EuiOutsideClickDetector>
  );
};
