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
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { monaco } from '@osd/monaco';
import {
  IDataPluginServices,
  Query,
  TimeRange,
  QueryControls,
  RecentQueriesTable,
  QueryResult,
  QueryStatus,
  useQueryStringManager,
} from '../..';
import { OpenSearchDashboardsReactContextValue } from '../../../../opensearch_dashboards_react/public';
import { fromUser, getQueryLog, PersistedLog, toUser } from '../../query';
import { SuggestionsListSize } from '../typeahead/suggestions_component';
import { QueryLanguageSelector } from './language_selector';
import { QueryEditorExtensions } from './query_editor_extensions';
import { getQueryService, getIndexPatterns } from '../../services';
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

export const QueryEditorUI: React.FC<Props> = (props) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [lineCount, setLineCount] = useState<number | undefined>(undefined);
  const [isRecentQueryVisible, setIsRecentQueryVisible] = useState(false);

  const inputRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);
  const bottomPanelRef = useRef<HTMLDivElement>(null);
  const queryControlsContainer = useRef<HTMLDivElement>(null);
  // TODO: https://github.com/opensearch-project/OpenSearch-Dashboards/issues/8801
  const editorQuery = props.query; // local query state managed by the editor. Not to be confused by the app query state.

  const queryString = getQueryService().queryString;
  const timefilter = getQueryService().timefilter.timefilter;
  const languageManager = queryString.getLanguageService();
  const extensionMap = languageManager.getQueryEditorExtensionMap();
  const services = props.opensearchDashboards.services;
  const { query } = useQueryStringManager({
    queryString,
  });
  const queryRef = useRef(query);

  // Monaco commands are registered once at startup, we need a ref to access the latest query state inside command callbacks
  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  const persistedLogRef = useRef<PersistedLog>(
    props.persistedLog ||
      getQueryLog(services.uiSettings, services.storage, services.appName, query.language)
  );
  const abortControllerRef = useRef<AbortController>();

  useEffect(() => {
    const abortController = abortControllerRef.current;
    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  }, []);

  const renderQueryEditorExtensions = () => {
    if (
      !(
        headerRef.current &&
        bannerRef.current &&
        queryControlsContainer.current &&
        bottomPanelRef.current &&
        query.language &&
        extensionMap &&
        Object.keys(extensionMap).length > 0
      )
    ) {
      return null;
    }
    return (
      <QueryEditorExtensions
        language={query.language}
        onSelectLanguage={onSelectLanguage}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        configMap={extensionMap}
        componentContainer={headerRef.current}
        bannerContainer={bannerRef.current}
        queryControlsContainer={queryControlsContainer.current}
        bottomPanelContainer={bottomPanelRef.current}
        query={query}
        fetchStatus={props.queryStatus?.status}
      />
    );
  };

  const onSubmit = (currentQuery: Query, dateRange?: TimeRange) => {
    if (props.onSubmit) {
      if (persistedLogRef.current) {
        persistedLogRef.current.add(currentQuery.query);
      }

      props.onSubmit(
        {
          ...currentQuery,
          query: fromUser(currentQuery.query),
        },
        dateRange
      );
    }
  };

  const onChange = (currentQuery: Query, dateRange?: TimeRange) => {
    if (props.onChange) {
      props.onChange(
        {
          ...currentQuery,
          query: fromUser(currentQuery.query),
        },
        dateRange
      );
    }
  };

  const onQueryStringChange = (value: string) => {
    onChange({
      query: value,
      language: query.language,
      dataset: query.dataset,
    });
  };

  const onClickRecentQuery = (currentQuery: Query, timeRange?: TimeRange) => {
    onSubmit(currentQuery, timeRange);
  };

  const onInputChange = (value: string) => {
    onQueryStringChange(value);

    if (!inputRef.current) return;

    const currentLineCount = inputRef.current.getModel()?.getLineCount();
    if (lineCount === currentLineCount) return;
    setLineCount(currentLineCount);
  };

  const onSelectLanguage = (languageId: string) => {
    const newQuery = queryString.getInitialQueryByLanguage(languageId);

    onChange(newQuery);
    onSubmit(newQuery);
  };

  const toggleRecentQueries = () => {
    setIsRecentQueryVisible(!isRecentQueryVisible);
  };

  const renderToggleIcon = () => {
    return (
      <EuiFlexItem grow={false}>
        <EuiButtonIcon
          iconType={isCollapsed ? 'expand' : 'minimize'}
          aria-label={i18n.translate('data.queryControls.languageToggle', {
            defaultMessage: `Language Toggle`,
          })}
          onClick={() => setIsCollapsed(!isCollapsed)}
          data-test-subj="osdQueryEditorLanguageToggle"
        />
      </EuiFlexItem>
    );
  };

  const renderQueryControls = (queryControls: React.ReactElement[]) => {
    return <QueryControls queryControls={queryControls} />;
  };

  const fetchIndexPattern = async () => {
    const dataset = queryString.getQuery().dataset;
    if (!dataset) return undefined;
    const indexPattern = await getIndexPatterns().get(dataset.id);
    return indexPattern;
  };

  const provideCompletionItems = async (
    model: monaco.editor.ITextModel,
    position: monaco.Position
  ): Promise<monaco.languages.CompletionList> => {
    const indexPattern = await fetchIndexPattern();
    const suggestions = await services.data.autocomplete.getQuerySuggestions({
      query: inputRef.current?.getValue() ?? '',
      selectionStart: model.getOffsetAt(position),
      selectionEnd: model.getOffsetAt(position),
      language: queryRef.current.language,
      indexPattern,
      position,
      services,
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
              .filter((s) => 'detail' in s) // designed to remove suggestion not of type MonacoCompatible
              .map((s: MonacoCompatibleQuerySuggestion) => {
                return {
                  label: s.text,
                  kind: s.type as monaco.languages.CompletionItemKind,
                  insertText: s.insertText ?? s.text,
                  insertTextRules: s.insertTextRules ?? undefined,
                  range: s.replacePosition ?? defaultRange,
                  detail: s.detail,
                  command: { id: 'editor.action.triggerSuggest', title: 'Trigger Next Suggestion' },
                  sortText: s.sortText, // when undefined, the falsy value will default to the label
                };
              })
          : [],
      incomplete: false,
    };
  };

  const useQueryEditor = query.language !== 'kuery' && query.language !== 'lucene';

  const languageSelector = (
    <QueryLanguageSelector
      anchorPosition={props.languageSwitcherPopoverAnchorPosition}
      onSelectLanguage={onSelectLanguage}
      appName={services.appName}
    />
  );

  const baseInputProps = {
    languageId: query.language,
    value: toUser(editorQuery.query),
  };

  const defaultInputProps: DefaultInputProps = {
    ...baseInputProps,
    onChange: onInputChange,
    editorDidMount: (editor: monaco.editor.IStandaloneCodeEditor) => {
      editor.setValue(`\n`.repeat(10));
      setLineCount(editor.getModel()?.getLineCount());
      inputRef.current = editor;
      // eslint-disable-next-line no-bitwise
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
        const newQuery = {
          ...queryRef.current,
          query: editor.getValue(),
        };

        onSubmit(newQuery, timefilter.getTime());
      });

      return () => {
        if (abortControllerRef.current) abortControllerRef.current.abort();
      };
    },
    footerItems: {
      start: [
        <EuiText
          size="xs"
          color="subdued"
          className="queryEditor__footerItem"
          data-test-subj="queryEditorFooterLineCount"
        >
          {`${lineCount} ${lineCount === 1 ? 'line' : 'lines'}`}
        </EuiText>,
        <EuiText
          size="xs"
          color="subdued"
          data-test-subj="queryEditorFooterTimestamp"
          className="queryEditor__footerItem"
        >
          {query.dataset?.timeFieldName || ''}
        </EuiText>,
        <QueryResult queryStatus={props.queryStatus!} />,
      ],
      end: [
        <EuiButtonEmpty
          iconSide="left"
          iconType="clock"
          size="xs"
          onClick={toggleRecentQueries}
          className="queryEditor__footerItem"
          data-test-subj="queryEditorFooterToggleRecentQueriesButton"
        >
          <EuiText size="xs" color="subdued">
            {'Recent queries'}
          </EuiText>
        </EuiButtonEmpty>,
      ],
    },
    provideCompletionItems,
  };

  const singleLineInputProps = {
    ...baseInputProps,
    onChange: (value: string) => {
      // Replace new lines with an empty string to prevent multi-line input
      onQueryStringChange(value.replace(/[\r\n]+/gm, ''));
      setLineCount(undefined);
    },
    editorDidMount: (editor: monaco.editor.IStandaloneCodeEditor) => {
      inputRef.current = editor;

      editor.addCommand(monaco.KeyCode.Enter, () => {
        const newQuery = {
          ...queryRef.current,
          query: editor.getValue(),
        };

        onSubmit(newQuery, timefilter.getTime());
      });
    },
    provideCompletionItems,
    prepend: props.prepend,
    footerItems: {
      start: [
        <EuiText
          size="xs"
          color="subdued"
          className="queryEditor__footerItem"
          data-test-subj="queryEditorFooterLineCount"
        >
          {`${lineCount ?? 1} ${lineCount === 1 || !lineCount ? 'line' : 'lines'}`}
        </EuiText>,
        <EuiText
          size="xs"
          color="subdued"
          className="queryEditor__footerItem"
          data-test-subj="queryEditorFooterTimestamp"
        >
          {query.dataset?.timeFieldName || ''}
        </EuiText>,
        <QueryResult queryStatus={props.queryStatus!} />,
      ],
      end: [
        <EuiButtonEmpty
          iconSide="left"
          iconType="clock"
          iconGap="s"
          size="xs"
          onClick={toggleRecentQueries}
          className="queryEditor__footerItem"
          data-test-subj="queryEditorFooterToggleRecentQueriesButton"
          flush="both"
        >
          <EuiText size="xs" color="subdued">
            {'Recent queries'}
          </EuiText>
        </EuiButtonEmpty>,
      ],
    },
  };

  const languageEditorFunc = languageManager.getLanguage(query.language)!.editor;

  const languageEditor = useQueryEditor
    ? languageEditorFunc(singleLineInputProps, {}, defaultInputProps)
    : languageEditorFunc(singleLineInputProps, singleLineInputProps, {
        filterBar: props.filterBar,
      });

  return (
    <div
      className={classNames(
        props.className,
        'osdQueryEditor',
        isCollapsed ? 'collapsed' : 'expanded',
        !languageEditor.TopBar.Expanded && 'emptyExpanded'
      )}
    >
      <div
        ref={bannerRef}
        className={classNames('osdQueryEditor__banner', props.bannerClassName)}
      />
      <div className="osdQueryEditor__topBar" data-test-subj="osdQueryEditorTopBar">
        <div className="osdQueryEditor__input" data-test-subj="osdQueryEditorInput">
          {isCollapsed
            ? languageEditor.TopBar.Collapsed()
            : languageEditor.TopBar.Expanded && languageEditor.TopBar.Expanded()}
        </div>
        {languageSelector}
        <div className="osdQueryEditor__querycontrols" data-test-subj="osdQueryEditorQueryControls">
          <EuiFlexGroup responsive={false} gutterSize="s" alignItems="center">
            <div
              ref={queryControlsContainer}
              className="osdQueryEditor__extensionQueryControls"
              data-test-subj="osdQueryEditorExtensionQueryControls"
            />
            {renderQueryControls(languageEditor.TopBar.Controls)}
            {!languageEditor.TopBar.Expanded && renderToggleIcon()}
            {props.savedQueryManagement}
          </EuiFlexGroup>
        </div>
      </div>
      <div
        ref={headerRef}
        className={classNames('osdQueryEditor__header', props.headerClassName)}
      />
      {!isCollapsed && (
        <>
          <div className="osdQueryEditor__body">{languageEditor.Body()}</div>
        </>
      )}
      <RecentQueriesTable
        isVisible={isRecentQueryVisible && useQueryEditor}
        queryString={queryString}
        onClickRecentQuery={onClickRecentQuery}
      />
      <div ref={bottomPanelRef} />
      {renderQueryEditorExtensions()}
    </div>
  );
};

// eslint-disable-next-line import/no-default-export
export default QueryEditorUI;
