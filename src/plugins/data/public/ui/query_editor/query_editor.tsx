/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiForm,
  EuiFormRow,
  htmlIdGenerator,
  PopoverAnchorPosition,
} from '@elastic/eui';
import classNames from 'classnames';
import { isEqual } from 'lodash';
import React, { Component, createRef, RefObject } from 'react';
import { monaco } from '@osd/monaco';
import { Settings } from '..';
import {
  DataSource,
  IDataPluginServices,
  IFieldType,
  IIndexPattern,
  Query,
  TimeRange,
} from '../..';
import {
  CodeEditor,
  OpenSearchDashboardsReactContextValue,
} from '../../../../opensearch_dashboards_react/public';
import { QuerySuggestion } from '../../autocomplete';
import { fromUser, getQueryLog, PersistedLog, toUser } from '../../query';
import { SuggestionsListSize } from '../typeahead/suggestions_component';
import { DataSettings } from '../types';
import { fetchIndexPatterns } from './fetch_index_patterns';
import { QueryLanguageSelector } from './language_selector';
import { QueryEditorExtensions } from './query_editor_extensions';
import { QueryEditorBtnCollapse } from './query_editor_btn_collapse';

const LANGUAGE_ID = 'SQL';
monaco.languages.register({ id: LANGUAGE_ID });

export interface QueryEditorProps {
  indexPatterns: Array<IIndexPattern | string>;
  dataSource?: DataSource;
  query: Query;
  container?: HTMLDivElement;
  dataSourceContainerRef?: React.RefCallback<HTMLDivElement>;
  containerRef?: React.RefCallback<HTMLDivElement>;
  languageSelectorContainerRef?: React.RefCallback<HTMLDivElement>;
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
  dataTestSubj?: string;
  size?: SuggestionsListSize;
  className?: string;
  isInvalid?: boolean;
  queryLanguage?: string;
  headerClassName?: string;
  bannerClassName?: string;
  footerClassName?: string;
  filterBar?: any;
}

interface Props extends QueryEditorProps {
  opensearchDashboards: OpenSearchDashboardsReactContextValue<IDataPluginServices>;
}

interface State {
  isDataSourcesVisible: boolean;
  isDataSetsVisible: boolean;
  isSuggestionsVisible: boolean;
  index: number | null;
  suggestions: QuerySuggestion[];
  indexPatterns: IIndexPattern[];
  isCollapsed: boolean;
  timeStamp: IFieldType | null;
  lineCount: number | undefined;
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
    isDataSourcesVisible: false,
    isDataSetsVisible: true,
    isSuggestionsVisible: false,
    index: null,
    suggestions: [],
    indexPatterns: [],
    isCollapsed: false, // default to expand mode
    timeStamp: null,
    lineCount: undefined,
  };

  public inputRef: monaco.editor.IStandaloneCodeEditor | null = null;

  private persistedLog: PersistedLog | undefined;
  private abortController?: AbortController;
  private services = this.props.opensearchDashboards.services;
  private componentIsUnmounting = false;
  private headerRef: RefObject<HTMLDivElement> = createRef();
  private bannerRef: RefObject<HTMLDivElement> = createRef();
  private extensionMap = this.props.settings?.getQueryEditorExtensionMap();

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

  private renderQueryEditorExtensions() {
    if (
      !(
        this.headerRef.current &&
        this.bannerRef.current &&
        this.props.queryLanguage &&
        this.extensionMap &&
        Object.keys(this.extensionMap).length > 0
      )
    ) {
      return null;
    }
    return (
      <QueryEditorExtensions
        language={this.props.queryLanguage}
        configMap={this.extensionMap}
        componentContainer={this.headerRef.current}
        bannerContainer={this.bannerRef.current}
        indexPatterns={this.props.indexPatterns}
        dataSource={this.props.dataSource}
      />
    );
  }

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

    if (!this.inputRef) return;

    const currentLineCount = this.inputRef.getModel()?.getLineCount();
    if (this.state.lineCount === currentLineCount) return;
    this.setState({ lineCount: currentLineCount });
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

    const enhancement = this.props.settings.getQueryEnhancements(newQuery.language);
    const fields = enhancement?.fields;
    const newSettings: DataSettings = {
      userQueryLanguage: newQuery.language,
      userQueryString: newQuery.query,
      ...(fields && { uiOverrides: { fields } }),
    };
    this.props.settings?.updateSettings(newSettings);

    const dateRangeEnhancement = enhancement?.searchBar?.dateRange;
    const dateRange = dateRangeEnhancement
      ? {
          from: dateRangeEnhancement.initialFrom!,
          to: dateRangeEnhancement.initialTo!,
        }
      : undefined;
    this.onChange(newQuery, dateRange);
    this.onSubmit(newQuery, dateRange);
    this.setState({
      isDataSourcesVisible: enhancement?.searchBar?.showDataSourcesSelector ?? true,
      isDataSetsVisible: enhancement?.searchBar?.showDataSetsSelector ?? true,
    });
  };

  private initPersistedLog = () => {
    const { uiSettings, storage, appName } = this.services;
    this.persistedLog = this.props.persistedLog
      ? this.props.persistedLog
      : getQueryLog(uiSettings, storage, appName, this.props.query.language);
  };

  private initDataSourcesVisibility = () => {
    if (this.componentIsUnmounting) return;

    return this.props.settings.getQueryEnhancements(this.props.query.language)?.searchBar
      ?.showDataSourcesSelector;
  };

  private initDataSetsVisibility = () => {
    if (this.componentIsUnmounting) return;

    return this.props.settings.getQueryEnhancements(this.props.query.language)?.searchBar
      ?.showDataSetsSelector;
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
    this.setState({
      isDataSourcesVisible: this.initDataSourcesVisibility() || true,
      isDataSetsVisible: this.initDataSetsVisibility() || true,
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
  }

  handleOnFocus = () => {
    if (this.props.onChangeQueryEditorFocus) {
      this.props.onChangeQueryEditorFocus(true);
    }
  };

  getCodeEditorSuggestionsType = (columnType: string) => {
    switch (columnType) {
      case 'text':
        return monaco.languages.CompletionItemKind.Text;
      case 'function':
        return monaco.languages.CompletionItemKind.Function;
      case 'object':
        return monaco.languages.CompletionItemKind.Struct;
      case 'field':
        return monaco.languages.CompletionItemKind.Field;
      case 'value':
        return monaco.languages.CompletionItemKind.Value;
      default:
        return monaco.languages.CompletionItemKind.Text;
    }
  };

  provideCompletionItems = async (
    model: monaco.editor.ITextModel,
    position: monaco.Position
  ): Promise<monaco.languages.CompletionList> => {
    const wordUntil = model.getWordUntilPosition(position);
    const wordRange = new monaco.Range(
      position.lineNumber,
      wordUntil.startColumn,
      position.lineNumber,
      wordUntil.endColumn
    );
    const enhancements = this.props.settings.getQueryEnhancements(this.props.query.language);
    const connectionService = enhancements?.connectionService;
    const suggestions = await this.services.data.autocomplete.getQuerySuggestions({
      query: this.getQueryString(),
      selectionStart: model.getOffsetAt(position),
      selectionEnd: model.getOffsetAt(position),
      language: this.props.query.language,
      indexPatterns: this.state.indexPatterns,
      position,
      connectionService,
    });

    return {
      suggestions:
        suggestions && suggestions.length > 0
          ? suggestions.map((s) => ({
              label: s.text,
              kind: this.getCodeEditorSuggestionsType(s.type),
              insertText: s.text,
              range: wordRange,
            }))
          : [],
      incomplete: false,
    };
  };

  editorDidMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    this.setState({ lineCount: editor.getModel()?.getLineCount() });
    this.inputRef = editor;
  };

  private onSingleLineInputChange = (value: string) => {
    // Replace new lines with an empty string to prevent multi-line input
    this.onQueryStringChange(value.replace(/[\r\n]+/gm, ''));

    this.setState({ lineCount: undefined });
  };

  singleLineEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    this.inputRef = editor;

    const editorNode = editor.getDomNode();
    if (editorNode) {
      const containerId = 'single-line-editor-wrapper';
      const style = document.createElement('style');
      const customCursorHeight = 20;
      // eslint-disable-next-line no-unsanitized/property
      style.innerHTML = `
      .${containerId} .monaco-editor .view-lines {
        padding-left: 15px; 
      }
      .${containerId} .monaco-editor .cursor {
        height: ${customCursorHeight}px !important;
        margin-top: ${(38 - customCursorHeight) / 2}px !important; 
      }
    `;

      document.head.appendChild(style);
    }
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
  };

  public render() {
    const className = classNames(this.props.className);
    const headerClassName = classNames('osdQueryEditorHeader', this.props.headerClassName);
    const bannerClassName = classNames('osdQueryEditorBanner', this.props.bannerClassName);
    const footerClassName = classNames('osdQueryEditorFooter', this.props.footerClassName);

    const useQueryEditor =
      this.props.query.language !== 'kuery' && this.props.query.language !== 'lucene';

    return (
      <div className={className}>
        <div ref={this.bannerRef} className={bannerClassName} />
        <EuiFlexGroup gutterSize="xs" direction="column">
          <EuiFlexItem grow={false}>
            <EuiFlexGroup gutterSize="xs" alignItems="center" className={`${className}__wrapper`}>
              <EuiFlexItem grow={false} className={`${className}__collapseWrapper`}>
                <QueryEditorBtnCollapse
                  onClick={() => this.setState({ isCollapsed: !this.state.isCollapsed })}
                  isCollapsed={!this.state.isCollapsed}
                />
              </EuiFlexItem>
              {this.state.isDataSourcesVisible && (
                <EuiFlexItem grow={2} className={`${className}__dataSourceWrapper`}>
                  <div ref={this.props.dataSourceContainerRef} />
                </EuiFlexItem>
              )}

              {this.state.isDataSetsVisible && (
                <EuiFlexItem grow={2} className={`${className}__dataSetWrapper`}>
                  <div ref={this.props.containerRef} />
                </EuiFlexItem>
              )}
              <EuiFlexItem grow={10}>
                <EuiFlexGroup gutterSize="none">
                  {(this.state.isCollapsed || !useQueryEditor) && (
                    <EuiFlexItem grow={9}>
                      <div className="single-line-editor-wrapper">
                        <CodeEditor
                          height={40} // Adjusted to match lineHeight for a single line
                          languageId={this.props.query.language}
                          value={this.getQueryString()}
                          onChange={this.onSingleLineInputChange}
                          editorDidMount={this.singleLineEditorDidMount}
                          options={{
                            lineNumbers: 'off', // Disabled line numbers
                            lineHeight: 40,
                            fontSize: 14,
                            fontFamily: 'Roboto Mono',
                            minimap: {
                              enabled: false,
                            },
                            scrollBeyondLastLine: false,
                            wordWrap: 'off', // Disabled word wrapping
                            wrappingIndent: 'none', // No indent since wrapping is off
                            folding: false,
                            glyphMargin: false,
                            lineDecorationsWidth: 0,
                            scrollbar: {
                              vertical: 'hidden',
                            },
                            overviewRulerLanes: 0,
                            hideCursorInOverviewRuler: true,
                            cursorStyle: 'line',
                            wordBasedSuggestions: false,
                          }}
                          suggestionProvider={{
                            provideCompletionItems: this.provideCompletionItems,
                          }}
                        />
                      </div>
                    </EuiFlexItem>
                  )}
                  {!useQueryEditor && (
                    <EuiFlexItem grow={false}>
                      <div className="osdQueryEditor__languageWrapper">
                        <QueryLanguageSelector
                          language={this.props.query.language}
                          anchorPosition={this.props.languageSwitcherPopoverAnchorPosition}
                          onSelectLanguage={this.onSelectLanguage}
                          appName={this.services.appName}
                        />
                      </div>
                    </EuiFlexItem>
                  )}
                </EuiFlexGroup>
              </EuiFlexItem>
              <EuiFlexItem
                grow={false}
                className={`${className}__prependWrapper${
                  !this.state.isCollapsed && useQueryEditor ? '' : '-isCollapsed'
                }`}
              >
                {this.props.prepend}
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>

          <EuiFlexItem onClick={this.onClickInput} grow={true}>
            <div ref={this.headerRef} className={headerClassName} />
            {!this.state.isCollapsed && useQueryEditor && (
              <CodeEditor
                height={70}
                languageId={this.props.query.language}
                value={this.getQueryString()}
                onChange={this.onInputChange}
                editorDidMount={this.editorDidMount}
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
                  lineDecorationsWidth: 0,
                  lineNumbersMinChars: 2,
                  wordBasedSuggestions: false,
                }}
                suggestionProvider={{
                  provideCompletionItems: this.provideCompletionItems,
                }}
              />
            )}

            <div
              className={
                !this.state.isCollapsed && useQueryEditor
                  ? footerClassName
                  : 'osdQueryEditorFooter-isHidden'
              }
            >
              <EuiFlexGroup gutterSize="s" responsive={false}>
                <EuiFlexItem grow={false}>
                  <QueryLanguageSelector
                    language={this.props.query.language}
                    anchorPosition={this.props.languageSwitcherPopoverAnchorPosition}
                    onSelectLanguage={this.onSelectLanguage}
                    appName={this.services.appName}
                    isFooter={true}
                  />
                </EuiFlexItem>

                <EuiFlexItem grow={false}>
                  {this.state.lineCount} {this.state.lineCount === 1 ? 'line' : 'lines'}
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  {typeof this.props.indexPatterns?.[0] !== 'string' &&
                    '@' + this.props.indexPatterns?.[0].timeFieldName}
                </EuiFlexItem>
              </EuiFlexGroup>
            </div>
          </EuiFlexItem>

          {!this.state.isCollapsed && (
            <EuiFlexItem grow={false}>{this.props.filterBar}</EuiFlexItem>
          )}
        </EuiFlexGroup>
        {this.renderQueryEditorExtensions()}
      </div>
    );
  }
}
