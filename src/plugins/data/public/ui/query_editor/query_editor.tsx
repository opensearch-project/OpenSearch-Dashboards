/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';

import {
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiCompressedFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  PopoverAnchorPosition,
} from '@elastic/eui';
import { BehaviorSubject } from 'rxjs';
import classNames from 'classnames';
import { isEqual } from 'lodash';
import React, { Component, createRef, RefObject } from 'react';
import { monaco } from '@osd/monaco';
import {
  IDataPluginServices,
  IFieldType,
  IIndexPattern,
  Query,
  QuerySuggestion,
  TimeRange,
  QueryControls,
  RecentQueriesTable,
  QueryResult,
  QueryStatus,
} from '../..';
import { OpenSearchDashboardsReactContextValue } from '../../../../opensearch_dashboards_react/public';
import { fromUser, getQueryLog, PersistedLog, toUser } from '../../query';
import { SuggestionsListSize } from '../typeahead/suggestions_component';
import { QueryLanguageSelector } from './language_selector';
import { QueryEditorExtensions } from './query_editor_extensions';
import { getQueryService, getIndexPatterns } from '../../services';
import { DatasetSelector } from '../dataset_selector';
import { DefaultInputProps } from './editors';
import { MonacoCompatibleQuerySuggestion } from '../../autocomplete/providers/query_suggestion_provider';

export interface QueryEditorProps {
  query: Query;
  disableAutoFocus?: boolean;
  screenTitle?: string;
  queryActions?: any;
  persistedLog?: PersistedLog;
  bubbleSubmitEvent?: boolean;
  placeholder?: string;
  languageSwitcherPopoverAnchorPosition?: PopoverAnchorPosition;
  onBlur?: () => void;
  onChange?: (query: Query, dateRange?: TimeRange) => void;
  onChangeQueryEditorFocus?: (isFocused: boolean) => void;
  onSubmit?: (query: Query, dateRange?: TimeRange) => void;
  dataTestSubj?: string;
  size?: SuggestionsListSize;
  className?: string;
  isInvalid?: boolean;
  headerClassName?: string;
  bannerClassName?: string;
  footerClassName?: string;
  filterBar?: any;
  prepend?: React.ComponentProps<typeof EuiCompressedFieldText>['prepend'];
  savedQueryManagement?: any;
  queryStatus?: QueryStatus;
}

interface Props extends QueryEditorProps {
  opensearchDashboards: OpenSearchDashboardsReactContextValue<IDataPluginServices>;
}

interface State {
  isSuggestionsVisible: boolean;
  index: number | null;
  suggestions: QuerySuggestion[];
  indexPatterns: IIndexPattern[];
  isCollapsed: boolean;
  timeStamp: IFieldType | null;
  lineCount: number | undefined;
  isRecentQueryVisible: boolean;
}

// Needed for React.lazy
// TODO: MQL export this and let people extended this
// eslint-disable-next-line import/no-default-export
export default class QueryEditorUI extends Component<Props, State> {
  public state: State = {
    isSuggestionsVisible: false,
    index: null,
    suggestions: [],
    indexPatterns: [],
    isCollapsed: false, // default to expand mode
    timeStamp: null,
    lineCount: undefined,
    isRecentQueryVisible: false,
  };

  public inputRef: monaco.editor.IStandaloneCodeEditor | null = null;

  private queryString = getQueryService().queryString;
  private languageManager = this.queryString.getLanguageService();

  private persistedLog: PersistedLog | undefined;
  private abortController?: AbortController;
  private services = this.props.opensearchDashboards.services;
  private headerRef: RefObject<HTMLDivElement> = createRef();
  private bannerRef: RefObject<HTMLDivElement> = createRef();
  private extensionMap = this.languageManager.getQueryEditorExtensionMap();

  private getQueryString = () => {
    return toUser(this.props.query.query);
  };

  private setIsCollapsed = (isCollapsed: boolean) => {
    this.setState({ isCollapsed });
  };

  private renderQueryEditorExtensions() {
    if (
      !(
        this.headerRef.current &&
        this.bannerRef.current &&
        this.props.query.language &&
        this.extensionMap &&
        Object.keys(this.extensionMap).length > 0
      )
    ) {
      return null;
    }
    return (
      <QueryEditorExtensions
        language={this.props.query.language}
        onSelectLanguage={this.onSelectLanguage}
        isCollapsed={this.state.isCollapsed}
        setIsCollapsed={this.setIsCollapsed}
        configMap={this.extensionMap}
        componentContainer={this.headerRef.current}
        bannerContainer={this.bannerRef.current}
      />
    );
  }

  private onSubmit = (query: Query, dateRange?: TimeRange) => {
    if (this.props.onSubmit) {
      if (this.persistedLog) {
        this.persistedLog.add(query.query);
      }

      this.props.onSubmit({
        query: fromUser(query.query),
        language: query.language,
        dataset: query.dataset,
      });
    }
  };

  private onChange = (query: Query, dateRange?: TimeRange) => {
    if (this.props.onChange) {
      this.props.onChange(
        { query: fromUser(query.query), language: query.language, dataset: query.dataset },
        dateRange
      );
    }
  };

  private onQueryStringChange = (value: string) => {
    this.setState({
      isSuggestionsVisible: true,
      index: null,
    });

    this.onChange({
      query: value,
      language: this.props.query.language,
      dataset: this.props.query.dataset,
    });
  };

  private onClickRecentQuery = (query: Query, timeRange?: TimeRange) => {
    this.onSubmit(query, timeRange);
  };

  private onInputChange = (value: string) => {
    this.onQueryStringChange(value);

    if (!this.inputRef) return;

    const currentLineCount = this.inputRef.getModel()?.getLineCount();
    if (this.state.lineCount === currentLineCount) return;
    this.setState({ lineCount: currentLineCount });
  };

  // TODO: MQL consider moving language select language of setting search source here
  private onSelectLanguage = (languageId: string) => {
    // Send telemetry info every time the user opts in or out of kuery
    // As a result it is important this function only ever gets called in the
    // UI component's change handler.
    this.services.http.post('/api/opensearch-dashboards/dql_opt_in_stats', {
      body: JSON.stringify({ opt_in: languageId === 'kuery' }),
    });

    const newQuery = this.queryString.getInitialQueryByLanguage(languageId);

    this.onChange(newQuery);
    this.onSubmit(newQuery);
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

  private toggleRecentQueries = () => {
    this.setState((prevState) => ({
      ...prevState,
      isRecentQueryVisible: !prevState.isRecentQueryVisible,
    }));
  };

  public componentDidMount() {
    const parsedQuery = fromUser(toUser(this.props.query.query));
    if (!isEqual(this.props.query.query, parsedQuery)) {
      this.onChange({ ...this.props.query, query: parsedQuery });
    }

    this.initPersistedLog();
  }

  public componentDidUpdate(prevProps: Props) {
    const prevQuery = prevProps.query;

    if (!isEqual(this.props.query.dataset, prevQuery.dataset)) {
      if (this.inputRef) {
        const newQuery = this.queryString.getInitialQuery();
        const newQueryString = newQuery.query;
        if (this.inputRef.getValue() !== newQueryString) {
          this.inputRef.setValue(newQueryString);
          this.onSubmit(newQuery);
        }
      }
    }

    const parsedQuery = fromUser(toUser(this.props.query.query));
    if (!isEqual(this.props.query.query, parsedQuery)) {
      this.onChange({ ...this.props.query, query: parsedQuery });
    }

    this.initPersistedLog();
  }

  public componentWillUnmount() {
    if (this.abortController) this.abortController.abort();
  }

  handleOnFocus = () => {
    if (this.props.onChangeQueryEditorFocus) {
      this.props.onChangeQueryEditorFocus(true);
    }
  };

  private fetchIndexPattern = async () => {
    const dataset = this.queryString.getQuery().dataset;
    if (!dataset) return undefined;
    const indexPattern = await getIndexPatterns().get(dataset.id);
    return indexPattern;
  };

  provideCompletionItems = async (
    model: monaco.editor.ITextModel,
    position: monaco.Position
  ): Promise<monaco.languages.CompletionList> => {
    const indexPattern = await this.fetchIndexPattern();
    const suggestions = await this.services.data.autocomplete.getQuerySuggestions({
      query: this.getQueryString(),
      selectionStart: model.getOffsetAt(position),
      selectionEnd: model.getOffsetAt(position),
      language: this.props.query.language,
      indexPattern,
      position,
      services: this.services,
    });

    // current completion item range being given as last 'word' at pos
    const wordUntil = model.getWordUntilPosition(position);
    const defaultRange = new monaco.Range(
      position.lineNumber,
      wordUntil.startColumn,
      position.lineNumber,
      wordUntil.endColumn
    );

    return {
      suggestions:
        suggestions && suggestions.length > 0
          ? suggestions
              .filter((s) => 'detail' in s) // remove suggestion not of type MonacoCompatible
              .map((s: MonacoCompatibleQuerySuggestion) => {
                return {
                  label: s.text,
                  kind: s.type as monaco.languages.CompletionItemKind,
                  insertText: s.insertText ?? s.text,
                  range: s.replacePosition ?? defaultRange,
                  detail: s.detail,
                  command: { id: 'editor.action.triggerSuggest', title: 'Trigger Next Suggestion' },
                };
              })
          : [],
      incomplete: false,
    };
  };

  private renderToggleIcon = () => {
    return (
      <EuiFlexItem grow={false}>
        <EuiButtonIcon
          iconType={this.state.isCollapsed ? 'expand' : 'minimize'}
          aria-label={i18n.translate('discover.queryControls.languageToggle', {
            defaultMessage: `Language Toggle`,
          })}
          onClick={() => this.setIsCollapsed(!this.state.isCollapsed)}
        />
      </EuiFlexItem>
    );
  };

  private renderQueryControls = (queryControls: React.ReactElement[]) => {
    return <QueryControls queryControls={queryControls} />;
  };

  public render() {
    const className = classNames(this.props.className);

    const useQueryEditor =
      this.props.query.language !== 'kuery' && this.props.query.language !== 'lucene';

    const languageSelector = (
      <QueryLanguageSelector
        query={this.props.query}
        anchorPosition={this.props.languageSwitcherPopoverAnchorPosition}
        onSelectLanguage={this.onSelectLanguage}
        appName={this.services.appName}
      />
    );

    const baseInputProps = {
      languageId: this.props.query.language,
      value: this.getQueryString(),
    };

    const defaultInputProps: DefaultInputProps = {
      ...baseInputProps,
      onChange: this.onInputChange,
      editorDidMount: (editor: monaco.editor.IStandaloneCodeEditor) => {
        editor.setValue(`\n`.repeat(10));
        this.setState({ lineCount: editor.getModel()?.getLineCount() });
        this.inputRef = editor;
      },
      footerItems: {
        start: [
          <EuiText size="xs" color="subdued">
            {`${this.state.lineCount} ${this.state.lineCount === 1 ? 'line' : 'lines'}`}
          </EuiText>,
          <EuiText size="xs" color="subdued">
            {this.props.query.dataset?.timeFieldName || ''}
          </EuiText>,
          <QueryResult queryStatus={this.props.queryStatus!} />,
        ],
        end: [
          <EuiButtonEmpty
            iconSide="left"
            iconType="clock"
            size="xs"
            onClick={this.toggleRecentQueries}
          >
            <EuiText size="xs" color="subdued">
              {'Recent queries'}
            </EuiText>
          </EuiButtonEmpty>,
        ],
      },
      provideCompletionItems: this.provideCompletionItems,
    };

    const singleLineInputProps = {
      ...baseInputProps,
      onChange: (value: string) => {
        // Replace new lines with an empty string to prevent multi-line input
        this.onQueryStringChange(value.replace(/[\r\n]+/gm, ''));
        this.setState({ lineCount: undefined });
      },
      editorDidMount: (editor: monaco.editor.IStandaloneCodeEditor) => {
        this.inputRef = editor;

        const handleEnterPress = () => {
          this.onSubmit(this.props.query);
        };

        const disposable = editor.onKeyDown((e) => {
          if (e.keyCode === monaco.KeyCode.Enter) {
            // Prevent default Enter key behavior
            e.preventDefault();
            handleEnterPress();
          }
        });

        // Optional: Cleanup on component unmount
        return () => {
          disposable.dispose();
        };
      },
      provideCompletionItems: this.provideCompletionItems,
      prepend: this.props.prepend,
    };

    const languageEditorFunc = this.languageManager.getLanguage(this.props.query.language)!.editor;

    const languageEditor = useQueryEditor
      ? languageEditorFunc(singleLineInputProps, {}, defaultInputProps)
      : languageEditorFunc(singleLineInputProps, singleLineInputProps, {
          filterBar: this.props.filterBar,
        });

    return (
      <div
        className={classNames(
          className,
          'osdQueryEditor',
          this.state.isCollapsed ? 'collapsed' : 'expanded',
          !languageEditor.TopBar.Expanded && 'emptyExpanded'
        )}
      >
        <div
          ref={this.bannerRef}
          className={classNames('osdQueryEditor__banner', this.props.bannerClassName)}
        />
        <div className="osdQueryEditor__topBar">
          <DatasetSelector onSubmit={this.props.onSubmit} />
          <div className="osdQueryEditor__input">
            {this.state.isCollapsed
              ? languageEditor.TopBar.Collapsed()
              : languageEditor.TopBar.Expanded && languageEditor.TopBar.Expanded()}
          </div>
          {languageSelector}
          <div className="osdQueryEditor__querycontrols">
            <EuiFlexGroup responsive={false} gutterSize="s" alignItems="center">
              {this.renderQueryControls(languageEditor.TopBar.Controls)}
              {!languageEditor.TopBar.Expanded && this.renderToggleIcon()}
              {this.props.savedQueryManagement}
            </EuiFlexGroup>
          </div>
        </div>
        <div
          ref={this.headerRef}
          className={classNames('osdQueryEditor__header', this.props.headerClassName)}
        />
        {!this.state.isCollapsed && (
          <>
            <div className="osdQueryEditor__body">{languageEditor.Body()}</div>
            <RecentQueriesTable
              isVisible={this.state.isRecentQueryVisible && useQueryEditor}
              queryString={this.queryString}
              onClickRecentQuery={this.onClickRecentQuery}
            />
          </>
        )}

        {this.renderQueryEditorExtensions()}
      </div>
    );
  }
}
