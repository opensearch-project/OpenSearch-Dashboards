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
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { monaco } from '@osd/monaco';
import {
  IDataPluginServices,
  Query,
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
  const queryControlsContainer = useRef<HTMLDivElement>(null);

  const queryString = getQueryService().queryString;
  const languageManager = queryString.getLanguageService();
  const extensionMap = languageManager.getQueryEditorExtensionMap();
  const services = props.opensearchDashboards.services;

  const persistedLogRef = useRef<PersistedLog>(
    props.persistedLog ||
      getQueryLog(services.uiSettings, services.storage, services.appName, props.query.language)
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

  const getQueryString = useCallback(() => {
    return toUser(props.query.query);
  }, [props.query]);

  const renderQueryEditorExtensions = () => {
    if (
      !(
        headerRef.current &&
        bannerRef.current &&
        queryControlsContainer.current &&
        props.query.language &&
        extensionMap &&
        Object.keys(extensionMap).length > 0
      )
    ) {
      return null;
    }
    return (
      <QueryEditorExtensions
        language={props.query.language}
        onSelectLanguage={onSelectLanguage}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        configMap={extensionMap}
        componentContainer={headerRef.current}
        bannerContainer={bannerRef.current}
        queryControlsContainer={queryControlsContainer.current}
      />
    );
  };

  const onSubmit = (query: Query, dateRange?: TimeRange) => {
    if (props.onSubmit) {
      if (persistedLogRef.current) {
        persistedLogRef.current.add(query.query);
      }

      props.onSubmit(
        {
          query: fromUser(query.query),
          language: query.language,
          dataset: query.dataset,
        },
        dateRange
      );
    }
  };

  const onChange = (query: Query, dateRange?: TimeRange) => {
    if (props.onChange) {
      props.onChange(
        { query: fromUser(query.query), language: query.language, dataset: query.dataset },
        dateRange
      );
    }
  };

  const onQueryStringChange = (value: string) => {
    onChange({
      query: value,
      language: props.query.language,
      dataset: props.query.dataset,
    });
  };

  const onClickRecentQuery = (query: Query, timeRange?: TimeRange) => {
    onSubmit(query, timeRange);
  };

  const onInputChange = (value: string) => {
    onQueryStringChange(value);

    if (!inputRef.current) return;

    const currentLineCount = inputRef.current.getModel()?.getLineCount();
    if (lineCount === currentLineCount) return;
    setLineCount(currentLineCount);
  };

  const onSelectLanguage = (languageId: string) => {
    // Send telemetry info every time the user opts in or out of kuery
    // As a result it is important this function only ever gets called in the
    // UI component's change handler.
    services.http.post('/api/opensearch-dashboards/dql_opt_in_stats', {
      body: JSON.stringify({ opt_in: languageId === 'kuery' }),
    });

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
      query: getQueryString(),
      selectionStart: model.getOffsetAt(position),
      selectionEnd: model.getOffsetAt(position),
      language: props.query.language,
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

  const useQueryEditor = props.query.language !== 'kuery' && props.query.language !== 'lucene';

  const languageSelector = (
    <QueryLanguageSelector
      anchorPosition={props.languageSwitcherPopoverAnchorPosition}
      onSelectLanguage={onSelectLanguage}
      appName={services.appName}
    />
  );

  const baseInputProps = {
    languageId: props.query.language,
    value: getQueryString(),
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
        onSubmit(props.query);
      });

      return () => {
        if (abortControllerRef.current) abortControllerRef.current.abort();
      };
    },
    footerItems: {
      start: [
        <EuiText size="xs" color="subdued" className="queryEditor__footerItem">
          {`${lineCount} ${lineCount === 1 ? 'line' : 'lines'}`}
        </EuiText>,
        <EuiText
          size="xs"
          color="subdued"
          data-test-subj="queryEditorFooterTimestamp"
          className="queryEditor__footerItem"
        >
          {props.query.dataset?.timeFieldName || ''}
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

      const handleEnterPress = () => {
        onSubmit(props.query);
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
    provideCompletionItems,
    prepend: props.prepend,
    footerItems: {
      start: [
        <EuiText size="xs" color="subdued" className="queryEditor__footerItem">
          {`${lineCount ?? 1} ${lineCount === 1 || !lineCount ? 'line' : 'lines'}`}
        </EuiText>,
        <EuiText size="xs" color="subdued" className="queryEditor__footerItem">
          {props.query.dataset?.timeFieldName || ''}
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
          flush="both"
        >
          <EuiText size="xs" color="subdued">
            {'Recent queries'}
          </EuiText>
        </EuiButtonEmpty>,
      ],
    },
  };

  const languageEditorFunc = languageManager.getLanguage(props.query.language)!.editor;

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
      <div className="osdQueryEditor__topBar">
        <div className="osdQueryEditor__input">
          {isCollapsed
            ? languageEditor.TopBar.Collapsed()
            : languageEditor.TopBar.Expanded && languageEditor.TopBar.Expanded()}
        </div>
        {languageSelector}
        <div className="osdQueryEditor__querycontrols">
          <EuiFlexGroup responsive={false} gutterSize="s" alignItems="center">
            <div ref={queryControlsContainer} className="osdQueryEditor__extensionQueryControls" />
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

      {renderQueryEditorExtensions()}
    </div>
  );
};

// eslint-disable-next-line import/no-default-export
export default QueryEditorUI;
