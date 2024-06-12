/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiFlexGroup, EuiFlexItem, htmlIdGenerator, PopoverAnchorPosition } from '@elastic/eui';
import classNames from 'classnames';
import { isEqual } from 'lodash';
import React, { Component, createRef, RefObject } from 'react';
import { Settings } from '..';
import { IDataPluginServices, IIndexPattern, Query, TimeRange } from '../..';
import {
  CodeEditor,
  OpenSearchDashboardsReactContextValue,
} from '../../../../opensearch_dashboards_react/public';
import { QuerySuggestion } from '../../autocomplete';
import { fromUser, getQueryLog, PersistedLog, toUser } from '../../query';
import { SuggestionsListSize } from '../typeahead/suggestions_component';
import { DataSettings, QueryEnhancement } from '../types';
import { fetchIndexPatterns } from './fetch_index_patterns';
import { QueryLanguageSelector } from './language_selector';

export interface QueryEditorProps {
  indexPatterns: Array<IIndexPattern | string>;
  query: Query;
  containerRef?: React.RefCallback<HTMLDivElement>;
  settings: Settings;
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
  // TODO: MQL datasources: we should consider this
  // getQueryStringDataSource?: (language: string) => string;
  dataTestSubj?: string;
  size?: SuggestionsListSize;
  className?: string;
  isInvalid?: boolean;
  queryEditorHeaderRef: React.RefObject<HTMLDivElement>;
  queryEditorHeaderClassName?: string;
}

interface Props extends QueryEditorProps {
  opensearchDashboards: OpenSearchDashboardsReactContextValue<IDataPluginServices>;
}

interface State {
  queryEnhancements: Map<string, QueryEnhancement>;
  isSuggestionsVisible: boolean;
  index: number | null;
  suggestions: QuerySuggestion[];
  indexPatterns: IIndexPattern[];
  queryEditorRect: DOMRect | undefined;
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
    queryEnhancements: new Map(),
    isSuggestionsVisible: false,
    index: null,
    suggestions: [],
    indexPatterns: [],
    queryEditorRect: undefined,
  };

  public inputRef: HTMLTextAreaElement | null = null;

  private persistedLog: PersistedLog | undefined;
  private abortController?: AbortController;
  private services = this.props.opensearchDashboards.services;
  private componentIsUnmounting = false;
  private queryEditorDivRefInstance: RefObject<HTMLDivElement> = createRef();

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

    const fields = this.props.settings.getQueryEnhancements(newQuery.language)?.fields;
    const newSettings: DataSettings = {
      userQueryLanguage: newQuery.language,
      userQueryString: newQuery.query,
      ...(fields && { uiOverrides: { fields } }),
    };
    this.props.settings?.updateSettings(newSettings);

    const dateRangeEnhancement = this.props.settings.getQueryEnhancements(language)?.searchBar
      ?.dateRange;
    const dateRange = dateRangeEnhancement
      ? {
          from: dateRangeEnhancement.initialFrom!,
          to: dateRangeEnhancement.initialTo!,
        }
      : undefined;
    this.onChange(newQuery, dateRange);
    this.onSubmit(newQuery, dateRange);
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
  }

  public componentWillUnmount() {
    if (this.abortController) this.abortController.abort();
    this.componentIsUnmounting = true;
    window.removeEventListener('scroll', this.handleListUpdate, { capture: true });
  }

  handleListUpdate = () => {
    if (this.componentIsUnmounting) return;

    return this.setState({
      queryEditorRect: this.queryEditorDivRefInstance.current?.getBoundingClientRect(),
    });
  };

  handleOnFocus = () => {
    if (this.props.onChangeQueryEditorFocus) {
      this.props.onChangeQueryEditorFocus(true);
    }
  };

  public render() {
    const className = classNames(this.props.className);

    const queryEditorHeaderClassName = classNames(
      'osdQueryEditorHeader',
      this.props.queryEditorHeaderClassName
    );

    return (
      <div className={className}>
        <EuiFlexGroup gutterSize="xs" direction="column">
          <EuiFlexItem grow={false}>
            <EuiFlexGroup gutterSize="xs">
              <EuiFlexItem grow={false}>{this.props.prepend}</EuiFlexItem>
              <EuiFlexItem>
                <EuiFlexGroup gutterSize="xs">
                  <EuiFlexItem grow={false}>
                    <div ref={this.props.containerRef} />
                  </EuiFlexItem>
                  <EuiFlexItem grow={true}>
                    <QueryLanguageSelector
                      language={this.props.query.language}
                      anchorPosition={this.props.languageSwitcherPopoverAnchorPosition}
                      onSelectLanguage={this.onSelectLanguage}
                      appName={this.services.appName}
                    />
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
          <EuiFlexItem onClick={this.onClickInput} grow={true}>
            <div ref={this.props.queryEditorHeaderRef} className={queryEditorHeaderClassName} />
            <CodeEditor
              height={70}
              languageId="opensearchql"
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
      </div>
    );
  }
}
