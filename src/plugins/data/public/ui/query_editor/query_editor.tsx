/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PopoverAnchorPosition } from '@elastic/eui';
import classNames from 'classnames';
import { isEqual } from 'lodash';
import React, { Component, createRef, RefObject } from 'react';
import { monaco } from '@osd/monaco';
import { Settings } from '..';
import { IDataPluginServices, IFieldType, IIndexPattern, Query, TimeRange } from '../..';
import { OpenSearchDashboardsReactContextValue } from '../../../../opensearch_dashboards_react/public';
import { QuerySuggestion } from '../../autocomplete';
import { fromUser, getQueryLog, PersistedLog, toUser } from '../../query';
import { SuggestionsListSize } from '../typeahead/suggestions_component';
import { DataSettings } from '../types';
import { QueryLanguageSelector } from './language_selector';
import { QueryEditorExtensions } from './query_editor_extensions';
import { QueryEditorBtnCollapse } from './query_editor_btn_collapse';
import { createDQLEditor, createDefaultEditor } from './editors';
import { getQueryService, getIndexPatterns } from '../../services';
import { DatasetSelector } from '../dataset_selector';

const LANGUAGE_ID_SQL = 'SQL';
monaco.languages.register({ id: LANGUAGE_ID_SQL });

const LANGUAGE_ID_KUERY = 'kuery';
monaco.languages.register({ id: LANGUAGE_ID_KUERY });

export interface QueryEditorProps {
  query: Query;
  settings: Settings;
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
  };

  public inputRef: monaco.editor.IStandaloneCodeEditor | null = null;

  private queryString = getQueryService().queryString;

  private persistedLog: PersistedLog | undefined;
  private abortController?: AbortController;
  private services = this.props.opensearchDashboards.services;
  private headerRef: RefObject<HTMLDivElement> = createRef();
  private bannerRef: RefObject<HTMLDivElement> = createRef();
  private extensionMap = this.props.settings?.getQueryEditorExtensionMap();

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
  private onSelectLanguage = (languageId: string) => {
    // Send telemetry info every time the user opts in or out of kuery
    // As a result it is important this function only ever gets called in the
    // UI component's change handler.
    this.services.http.post('/api/opensearch-dashboards/dql_opt_in_stats', {
      body: JSON.stringify({ opt_in: languageId === 'kuery' }),
    });

    const languageConfig = this.queryString.getLanguageService().getLanguage(languageId);
    const newQuery = this.queryString.getInitialQueryByLanguage(languageId);

    const fields = languageConfig?.fields;
    const newSettings: DataSettings = {
      userQueryLanguage: newQuery.language,
      userQueryString: newQuery.query,
      ...(fields && { uiOverrides: { fields } }),
    };
    this.props.settings?.updateSettings(newSettings);

    const dateRangeEnhancement = languageConfig?.searchBar?.dateRange;
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
    const range = new monaco.Range(
      position.lineNumber,
      wordUntil.startColumn,
      position.lineNumber,
      wordUntil.endColumn
    );

    return {
      suggestions:
        suggestions && suggestions.length > 0
          ? suggestions.map((s: QuerySuggestion) => ({
              label: s.text,
              kind: s.type as monaco.languages.CompletionItemKind,
              insertText: s.insertText ?? s.text,
              range,
            }))
          : [],
      incomplete: false,
    };
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

    const defaultInputProps = {
      ...baseInputProps,
      onChange: this.onInputChange,
      editorDidMount: (editor: monaco.editor.IStandaloneCodeEditor) => {
        editor.setValue(`\n`.repeat(10));
        this.setState({ lineCount: editor.getModel()?.getLineCount() });
        this.inputRef = editor;
      },
      footerItems: {
        start: [
          `${this.state.lineCount} ${this.state.lineCount === 1 ? 'line' : 'lines'}`,
          this.props.query.dataset?.timeFieldName || '',
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
    };

    const languageEditor = useQueryEditor
      ? createDefaultEditor(singleLineInputProps, {}, defaultInputProps)
      : createDQLEditor(singleLineInputProps, singleLineInputProps, {
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
          <QueryEditorBtnCollapse
            onClick={() => this.setState({ isCollapsed: !this.state.isCollapsed })}
            isCollapsed={!this.state.isCollapsed}
          />
          <DatasetSelector onSubmit={this.props.onSubmit} />
          <div className="osdQueryEditor__input">
            {this.state.isCollapsed
              ? languageEditor.TopBar.Collapsed()
              : languageEditor.TopBar.Expanded && languageEditor.TopBar.Expanded()}
          </div>
          {languageSelector}
          {this.props.queryActions}
        </div>
        <div
          ref={this.headerRef}
          className={classNames('osdQueryEditor__header', this.props.headerClassName)}
        />
        {!this.state.isCollapsed && (
          <div className="osdQueryEditor__body">{languageEditor.Body()}</div>
        )}

        {/*  <EuiFlexGroup gutterSize="xs" direction="column">
           <EuiFlexItem grow={false}>
             <EuiFlexGroup gutterSize="xs" alignItems="center" className={`${className}__wrapper`}>
               <EuiFlexItem className={`${className}__collapseWrapper`}>
                 <QueryEditorBtnCollapse
                   onClick={() => this.setState({ isCollapsed: !this.state.isCollapsed })}
                   isCollapsed={!this.state.isCollapsed}
                 />
               </EuiFlexItem>
               <EuiFlexItem className={`${className}__dataSetWrapper`}>
                 <div ref={this.props.dataSetContainerRef} />
               </EuiFlexItem>
               <EuiFlexItem grow={true}>
                 <EuiFlexGroup
                   gutterSize="none"
                   className={
                     !useQueryEditor
                       ? 'euiFormControlLayout euiFormControlLayout--group osdQueryEditor__editorAndSelectorWrapper'
                       : ''
                   }
                 >
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
                           languageConfiguration={{
                             language: LANGUAGE_ID_KUERY,
                             autoClosingPairs: [
                               {
                                 open: '(',
                                 close: ')',
                               },
                               {
                                 open: '"',
                                 close: '"',
                               },
                             ],
                           }}
                         />
                       </div>
                     </EuiFlexItem>
                   )}
                   {!useQueryEditor && (
                     <EuiFlexItem grow={false}>
                       <QueryLanguageSelector
                         language={this.props.query.language}
                         anchorPosition={this.props.languageSwitcherPopoverAnchorPosition}
                         onSelectLanguage={this.onSelectLanguage}
                         appName={this.services.appName}
                       />
                     </EuiFlexItem>
                   )}
                 </EuiFlexGroup>
               </EuiFlexItem>
               <EuiFlexItem
                 className={`${className}__prependWrapper${
                   !this.state.isCollapsed && useQueryEditor ? '' : '-isCollapsed'
                 }`}
               >
                 {this.props.prepend}
               </EuiFlexItem>
             </EuiFlexGroup>
           </EuiFlexItem>

           <EuiFlexItem onClick={this.onClickInput} grow={true}>
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
                 languageConfiguration={{
                   language: LANGUAGE_ID_KUERY,
                   autoClosingPairs: [
                     {
                       open: '(',
                       close: ')',
                     },
                     {
                       open: '"',
                       close: '"',
                     },
                   ],
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
                 <EuiFlexItem grow={false}>{languageSelector}</EuiFlexItem>

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
             <EuiFlexItem grow={false}>
               <div className="osdQueryEditor__filterBarWrapper">{this.props.filterBar}</div>
             </EuiFlexItem>
           )}
         </EuiFlexGroup> */}
        {this.renderQueryEditorExtensions()}
      </div>
    );
  }
}
