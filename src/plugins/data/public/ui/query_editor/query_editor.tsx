/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLink,
  htmlIdGenerator,
  PopoverAnchorPosition,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import classNames from 'classnames';
import { isEqual, isFunction } from 'lodash';
import React, { Component, createRef, RefObject } from 'react';
import { Toast } from 'src/core/public';
import { Settings } from '..';
import { IDataPluginServices, IIndexPattern, Query, TimeRange } from '../..';
import {
  CodeEditor,
  OpenSearchDashboardsReactContextValue,
  toMountPoint,
} from '../../../../opensearch_dashboards_react/public';
import { QuerySuggestion, QuerySuggestionTypes } from '../../autocomplete';
import { fromUser, getQueryLog, matchPairs, PersistedLog, toUser } from '../../query';
import { SuggestionsListSize } from '../typeahead/suggestions_component';
import { DataSettings, QueryEnhancement } from '../types';
import { fetchIndexPatterns } from './fetch_index_patterns';
import { QueryLanguageSwitcher } from './language_switcher';

export interface QueryEditorProps {
  indexPatterns: Array<IIndexPattern | string>;
  query: Query;
  isEnhancementsEnabled?: boolean;
  queryEnhancements?: Map<string, QueryEnhancement>;
  containerRef?: React.RefCallback<HTMLDivElement>;
  settings?: Settings;
  disableAutoFocus?: boolean;
  screenTitle?: string;
  prepend?: any;
  persistedLog?: PersistedLog;
  bubbleSubmitEvent?: boolean;
  placeholder?: string;
  languageSwitcherPopoverAnchorPosition?: PopoverAnchorPosition;
  onBlur?: () => void;
  onChange?: (query: Query, dateRange?: TimeRange) => void;
  onChangeQueryEditorFocus?: (isFocused: boolean) => void;
  onSubmit?: (query: Query, dateRange?: TimeRange) => void;
  getQueryStringInitialValue?: (language: string) => string;
  dataTestSubj?: string;
  size?: SuggestionsListSize;
  className?: string;
  isInvalid?: boolean;
  queryEditorHeaderRef: React.RefObject<HTMLDivElement>;
}

interface Props extends QueryEditorProps {
  opensearchDashboards: OpenSearchDashboardsReactContextValue<IDataPluginServices>;
}

interface State {
  isSuggestionsVisible: boolean;
  index: number | null;
  suggestions: QuerySuggestion[];
  suggestionLimit: number;
  selectionStart: number | null;
  selectionEnd: number | null;
  indexPatterns: IIndexPattern[];
  queryBarRect: DOMRect | undefined;
}

const KEY_CODES = {
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  ENTER: 13,
  ESC: 27,
  TAB: 9,
  HOME: 36,
  END: 35,
};

// Needed for React.lazy
// TODO: MQL export this and let people extended this
// eslint-disable-next-line import/no-default-export
export default class QueryEditorUI extends Component<Props, State> {
  public state: State = {
    isSuggestionsVisible: false,
    index: null,
    suggestions: [],
    suggestionLimit: 50,
    selectionStart: null,
    selectionEnd: null,
    indexPatterns: [],
    queryBarRect: undefined,
  };

  public inputRef: HTMLTextAreaElement | null = null;

  private persistedLog: PersistedLog | undefined;
  private abortController?: AbortController;
  private services = this.props.opensearchDashboards.services;
  private componentIsUnmounting = false;
  private queryBarInputDivRefInstance: RefObject<HTMLDivElement> = createRef();

  private getQueryString = () => {
    if (!this.props.query.query) {
      return this.props.getQueryStringInitialValue?.(this.props.query.language) ?? '';
    }
    return toUser(this.props.query.query);
  };

  // TODO: MQL don't do this here? || Fetch data sources
  private fetchIndexPatterns = async () => {
    const stringPatterns = this.props.indexPatterns.filter(
      (indexPattern) => typeof indexPattern === 'string'
    ) as string[];
    const objectPatterns = this.props.indexPatterns.filter(
      (indexPattern) => typeof indexPattern !== 'string'
    ) as IIndexPattern[];

    const objectPatternsFromStrings = (await fetchIndexPatterns(
      this.services.savedObjects!.client,
      stringPatterns,
      this.services.uiSettings!
    )) as IIndexPattern[];

    this.setState({
      indexPatterns: [...objectPatterns, ...objectPatternsFromStrings],
    });
  };

  private onSubmit = (query: Query, dateRange?: TimeRange) => {
    if (this.props.onSubmit) {
      if (this.persistedLog) {
        this.persistedLog.add(query.query);
      }

      this.props.onSubmit({ query: fromUser(query.query), language: query.language });
    }
  };

  private onChange = (query: Query, dateRange?: TimeRange) => {
    if (this.props.onChange) {
      this.props.onChange({ query: fromUser(query.query), language: query.language }, dateRange);
    }
  };

  private onQueryStringChange = (value: string) => {
    this.setState({
      isSuggestionsVisible: true,
      index: null,
      suggestionLimit: 50,
    });

    this.onChange({ query: value, language: this.props.query.language });
  };

  private onInputChange = (value: string) => {
    this.onQueryStringChange(value);
  };

  private onClickInput = (event: React.MouseEvent<HTMLTextAreaElement>) => {
    if (event.target instanceof HTMLTextAreaElement) {
      this.onQueryStringChange(event.target.value);
    }
  };

  private onKeyUp = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ([KEY_CODES.LEFT, KEY_CODES.RIGHT, KEY_CODES.HOME, KEY_CODES.END].includes(event.keyCode)) {
      this.setState({ isSuggestionsVisible: true });
      if (event.target instanceof HTMLTextAreaElement) {
        this.onQueryStringChange(event.target.value);
      }
    }
  };

  private onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.target instanceof HTMLTextAreaElement) {
      const { isSuggestionsVisible, index } = this.state;
      const preventDefault = event.preventDefault.bind(event);
      const { target, key, metaKey } = event;
      const { value, selectionStart, selectionEnd } = target;
      const updateQuery = (query: string, newSelectionStart: number, newSelectionEnd: number) => {
        this.onQueryStringChange(query);
        this.setState({
          selectionStart: newSelectionStart,
          selectionEnd: newSelectionEnd,
        });
      };

      switch (event.keyCode) {
        case KEY_CODES.DOWN:
          if (isSuggestionsVisible && index !== null) {
            event.preventDefault();
            this.incrementIndex(index);
            // Note to engineers. `isSuggestionVisible` does not mean the suggestions are visible.
            // This should likely be fixed, it's more that suggestions can be shown.
          } else if ((isSuggestionsVisible && index == null) || this.getQueryString() === '') {
            event.preventDefault();
            this.setState({ isSuggestionsVisible: true, index: 0 });
          }
          break;
        case KEY_CODES.UP:
          if (isSuggestionsVisible && index !== null) {
            event.preventDefault();
            this.decrementIndex(index);
          }
          break;
        case KEY_CODES.ENTER:
          if (!this.props.bubbleSubmitEvent) {
            event.preventDefault();
          }
          if (isSuggestionsVisible && index !== null && this.state.suggestions[index]) {
            event.preventDefault();
            this.selectSuggestion(this.state.suggestions[index]);
          } else {
            this.onSubmit(this.props.query);
            this.setState({
              isSuggestionsVisible: false,
            });
          }
          break;
        case KEY_CODES.ESC:
          event.preventDefault();
          this.setState({ isSuggestionsVisible: false, index: null });
          break;
        case KEY_CODES.TAB:
          this.setState({ isSuggestionsVisible: false, index: null });
          break;
        default:
          if (selectionStart !== null && selectionEnd !== null) {
            matchPairs({
              value,
              selectionStart,
              selectionEnd,
              key,
              metaKey,
              updateQuery,
              preventDefault,
            });
          }

          break;
      }
    }
  };

  private selectSuggestion = (suggestion: QuerySuggestion) => {
    if (!this.inputRef) {
      return;
    }
    const { type, text, start, end, cursorIndex } = suggestion;

    this.handleNestedFieldSyntaxNotification(suggestion);

    const query = this.getQueryString();
    const { selectionStart, selectionEnd } = this.inputRef;
    if (selectionStart === null || selectionEnd === null) {
      return;
    }

    const value = query.substr(0, selectionStart) + query.substr(selectionEnd);
    const newQueryString = value.substr(0, start) + text + value.substr(end);

    this.onQueryStringChange(newQueryString);

    this.setState({
      selectionStart: start + (cursorIndex ? cursorIndex : text.length),
      selectionEnd: start + (cursorIndex ? cursorIndex : text.length),
    });

    if (type === QuerySuggestionTypes.RecentSearch) {
      this.setState({ isSuggestionsVisible: false, index: null });
      this.onSubmit({ query: newQueryString, language: this.props.query.language });
    }
  };

  private handleNestedFieldSyntaxNotification = (suggestion: QuerySuggestion) => {
    if (
      'field' in suggestion &&
      suggestion.field.subType &&
      suggestion.field.subType.nested &&
      !this.services.storage.get('opensearchDashboards.DQLNestedQuerySyntaxInfoOptOut')
    ) {
      const { notifications, docLinks } = this.services;

      const onDQLNestedQuerySyntaxInfoOptOut = (toast: Toast) => {
        if (!this.services.storage) return;
        this.services.storage.set('opensearchDashboards.DQLNestedQuerySyntaxInfoOptOut', true);
        notifications!.toasts.remove(toast);
      };

      if (notifications && docLinks) {
        const toast = notifications.toasts.add({
          title: i18n.translate('data.query.queryBar.DQLNestedQuerySyntaxInfoTitle', {
            defaultMessage: 'DQL nested query syntax',
          }),
          text: toMountPoint(
            <div>
              <p>
                <FormattedMessage
                  id="data.query.queryBar.DQLNestedQuerySyntaxInfoText"
                  defaultMessage="It looks like you're querying on a nested field.
                  You can construct DQL syntax for nested queries in different ways, depending on the results you want.
                  Learn more in our {link}."
                  values={{
                    link: (
                      <EuiLink href={docLinks.links.opensearchDashboards.dql.base} target="_blank">
                        <FormattedMessage
                          id="data.query.queryBar.DQLNestedQuerySyntaxInfoDocLinkText"
                          defaultMessage="docs"
                        />
                      </EuiLink>
                    ),
                  }}
                />
              </p>
              <EuiFlexGroup justifyContent="flexEnd" gutterSize="s">
                <EuiFlexItem grow={false}>
                  <EuiButton size="s" onClick={() => onDQLNestedQuerySyntaxInfoOptOut(toast)}>
                    <FormattedMessage
                      id="data.query.queryBar.DQLNestedQuerySyntaxInfoOptOutText"
                      defaultMessage="Don't show again"
                    />
                  </EuiButton>
                </EuiFlexItem>
              </EuiFlexGroup>
            </div>
          ),
        });
      }
    }
  };

  private increaseLimit = () => {
    this.setState({
      suggestionLimit: this.state.suggestionLimit + 50,
    });
  };

  private incrementIndex = (currentIndex: number) => {
    let nextIndex = currentIndex + 1;
    if (currentIndex === null || nextIndex >= this.state.suggestions.length) {
      nextIndex = 0;
    }
    this.setState({ index: nextIndex });
  };

  private decrementIndex = (currentIndex: number) => {
    const previousIndex = currentIndex - 1;
    if (previousIndex < 0) {
      this.setState({ index: this.state.suggestions.length - 1 });
    } else {
      this.setState({ index: previousIndex });
    }
  };

  // TODO: MQL consider moving language select language of setting search source here
  private onSelectLanguage = (language: string) => {
    // Send telemetry info every time the user opts in or out of kuery
    // As a result it is important this function only ever gets called in the
    // UI component's change handler.
    this.services.http.post('/api/opensearch-dashboards/dql_opt_in_stats', {
      body: JSON.stringify({ opt_in: language === 'kuery' }),
    });

    const newQuery = {
      query: this.props.getQueryStringInitialValue?.(language) ?? '',
      language,
    };

    const fields = this.props.queryEnhancements?.get(newQuery.language)?.fields;
    const newSettings: DataSettings = {
      userQueryLanguage: newQuery.language,
      userQueryString: newQuery.query,
      ...(fields && { uiOverrides: { fields } }),
    };
    this.props.settings?.updateSettings(newSettings);

    const dateRangeEnhancement = this.props.queryEnhancements?.get(language)?.searchBar?.dateRange;
    const dateRange = dateRangeEnhancement
      ? {
          from: dateRangeEnhancement.initialFrom!,
          to: dateRangeEnhancement.initialTo!,
        }
      : undefined;
    this.onChange(newQuery, dateRange);
    this.onSubmit(newQuery, dateRange);
  };

  private onOutsideClick = () => {
    if (this.state.isSuggestionsVisible) {
      this.setState({ isSuggestionsVisible: false, index: null });
    }
    if (this.props.onChangeQueryEditorFocus) {
      this.props.onChangeQueryEditorFocus(false);
    }
  };

  private onInputBlur = () => {
    if (this.props.onChangeQueryEditorFocus) {
      this.props.onChangeQueryEditorFocus(false);
    }
    if (isFunction(this.props.onBlur)) {
      this.props.onBlur();
    }
  };

  private initPersistedLog = () => {
    const { uiSettings, storage, appName } = this.services;
    this.persistedLog = this.props.persistedLog
      ? this.props.persistedLog
      : getQueryLog(uiSettings, storage, appName, this.props.query.language);
  };

  public onMouseEnterSuggestion = (index: number) => {
    this.setState({ index });
  };

  textareaId = htmlIdGenerator()();

  public componentDidMount() {
    const parsedQuery = fromUser(toUser(this.props.query.query));
    if (!isEqual(this.props.query.query, parsedQuery)) {
      this.onChange({ ...this.props.query, query: parsedQuery });
    }

    this.initPersistedLog();
    // this.fetchIndexPatterns().then(this.updateSuggestions);
    this.handleListUpdate();

    window.addEventListener('scroll', this.handleListUpdate, {
      passive: true, // for better performance as we won't call preventDefault
      capture: true, // scroll events don't bubble, they must be captured instead
    });
  }

  public componentDidUpdate(prevProps: Props) {
    const parsedQuery = fromUser(toUser(this.props.query.query));
    if (!isEqual(this.props.query.query, parsedQuery)) {
      this.onChange({ ...this.props.query, query: parsedQuery });
    }

    this.initPersistedLog();

    if (this.state.selectionStart !== null && this.state.selectionEnd !== null) {
      if (this.inputRef != null) {
        this.inputRef.setSelectionRange(this.state.selectionStart, this.state.selectionEnd);
      }

      this.setState({
        selectionStart: null,
        selectionEnd: null,
      });
    }
  }

  public componentWillUnmount() {
    if (this.abortController) this.abortController.abort();
    this.componentIsUnmounting = true;
    window.removeEventListener('scroll', this.handleListUpdate, { capture: true });
  }

  handleListUpdate = () => {
    if (this.componentIsUnmounting) return;

    return this.setState({
      queryBarRect: this.queryBarInputDivRefInstance.current?.getBoundingClientRect(),
    });
  };

  handleOnFocus = () => {
    if (this.props.onChangeQueryEditorFocus) {
      this.props.onChangeQueryEditorFocus(true);
    }
  };

  public render() {
    const isSuggestionsVisible = this.state.isSuggestionsVisible && {
      'aria-controls': 'osdTypeahead__items',
      'aria-owns': 'osdTypeahead__items',
    };
    const ariaCombobox = { ...isSuggestionsVisible, role: 'combobox' };
    // const className = classNames(
    //   'euiFormControlLayout euiFormControlLayout--group osdQueryEditor__wrap',
    //   this.props.className
    // );
    const className = classNames(this.props.className);

    const queryLanguageSwitcher = (
      <QueryLanguageSwitcher
        language={this.props.query.language}
        anchorPosition={this.props.languageSwitcherPopoverAnchorPosition}
        onSelectLanguage={this.onSelectLanguage}
        appName={this.services.appName}
      />
    );

    return (
      <div className={className}>
        {!!this.props.isEnhancementsEnabled && (
          <EuiFlexGroup gutterSize="xs" direction="column">
            <EuiFlexItem grow={false}>
              <EuiFlexGroup gutterSize="xs">
                <EuiFlexItem grow={false}>{this.props.prepend}</EuiFlexItem>
                <EuiFlexItem>
                  <EuiFlexGroup gutterSize="xs">
                    <EuiFlexItem grow={false}>
                      <div ref={this.props.containerRef} />
                    </EuiFlexItem>
                    <EuiFlexItem grow={true}>{queryLanguageSwitcher}</EuiFlexItem>
                  </EuiFlexGroup>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
            <EuiFlexItem onClick={this.onClickInput} grow={true}>
              <div ref={this.props.queryEditorHeaderRef} />
              <CodeEditor
                height={70}
                languageId="xjson"
                value={this.getQueryString()}
                onChange={this.onInputChange}
                options={{
                  lineNumbers: 'on',
                  lineHeight: 24,
                  fontSize: 14,
                  fontFamily: 'Roboto Mono',
                  minimap: {
                    enabled: false,
                  },
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  wrappingIndent: 'indent',
                }}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        )}
      </div>
    );
  }
}
