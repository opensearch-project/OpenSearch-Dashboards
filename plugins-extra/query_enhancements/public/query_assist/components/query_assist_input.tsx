import { EuiFieldText, EuiIcon, EuiOutsideClickDetector, EuiPortal } from '@elastic/eui';
import React, { useMemo, useState } from 'react';
import { PersistedLog, QuerySuggestionTypes } from '../../../../../src/plugins/data/public';
import assistantLogo from '../../assets/query_assist_logo.svg';
import { getData } from '../../services';

interface QueryAssistInputProps {
  inputRef: React.RefObject<HTMLInputElement>;
  persistedLog: PersistedLog;
  initialValue?: string;
  selectedIndex?: string;
  previousQuestion?: string;
}

export const QueryAssistInput: React.FC<QueryAssistInputProps> = (props) => {
  const {
    ui: { SuggestionsComponent },
  } = getData();
  const [isSuggestionsVisible, setIsSuggestionsVisible] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState<number | null>(null);
  const [value, setValue] = useState(props.initialValue ?? '');

  const recentSearchSuggestions = useMemo(() => {
    if (!props.persistedLog) return [];
    return props.persistedLog
      .get()
      .filter((recentSearch) => recentSearch.includes(value))
      .map((recentSearch) => ({
        type: QuerySuggestionTypes.RecentSearch,
        text: recentSearch,
        start: 0,
        end: value.length,
      }));
  }, [props.persistedLog, value]);

  return (
    <EuiOutsideClickDetector onOutsideClick={() => setIsSuggestionsVisible(false)}>
      <div>
        <EuiFieldText
          inputRef={props.inputRef}
          value={value}
          onClick={() => setIsSuggestionsVisible(true)}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={() => setIsSuggestionsVisible(true)}
          placeholder={
            props.previousQuestion ||
            (props.selectedIndex
              ? `Ask a natural language question about ${props.selectedIndex} to generate a query`
              : 'Select an index pattern to ask a question')
          }
          prepend={<EuiIcon type={assistantLogo} />}
          fullWidth
        />
        <EuiPortal>
          <SuggestionsComponent
            show={isSuggestionsVisible}
            suggestions={recentSearchSuggestions}
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
