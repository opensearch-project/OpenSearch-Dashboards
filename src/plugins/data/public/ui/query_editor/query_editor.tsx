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
import { monaco, PPLValidationContext, PPLLintContext, revalidatePPLModel } from '@osd/monaco';
import {
  IDataPluginServices,
  Query,
  TimeRange,
  QueryControls,
  RecentQueriesTable,
  QueryResult,
  QueryStatus,
  useQueryStringManager,
  UI_SETTINGS,
} from '../..';
import { OpenSearchDashboardsReactContextValue } from '../../../../opensearch_dashboards_react/public';
import { fromUser, getQueryLog, PersistedLog, toUser } from '../../query';
import { SuggestionsListSize } from '../typeahead/suggestions_component';
import { QueryLanguageSelector } from './language_selector';
import { QueryEditorExtensions } from './query_editor_extensions';
import { getQueryService, getIndexPatterns } from '../../services';
import { DefaultInputProps } from './editors';
import { MonacoCompatibleQuerySuggestion } from '../../autocomplete/providers/query_suggestion_provider';
import { getEffectiveLanguageForAutoComplete } from './utils';
import {
  pplGrammarCache,
  shouldUseRuntimeGrammar,
} from '../../antlr/opensearch_ppl/ppl_grammar_cache';
import { syncPPLValidationContext } from './validation_context';
import {
  syncPPLLintContext,
  attachPPLContexts,
  cleanupPPLContexts,
  PPLDetachRefs,
} from './lint_context';
import {
  buildPPLLintContext,
  extractFieldMetadata,
  LintFieldsCache,
} from '../../ppl_lint/lint_context_builder';
import { fetchDisabledObjectFields } from '../../ppl_lint/disabled_object_fields';
import { fetchVisibleIndices } from '../../ppl_lint/visible_indices';
import { getAiAgentAvailableForDataSource } from '../../ppl_lint/ai_agent_availability';
import { storePPLLintFixSession } from '../../chat_tools/ppl_lint_fix_session';
import { PPL_LINT_FIX_DATA_HOST } from '../../chat_tools/ppl_lint_fix_tool_registration';
import type { AskPPLLintFixRequest } from '../../chat_tools/ppl_lint_fix_session';
import { addPPLLintFixAssistantContext, PPLLintFixLifecycle } from './ppl_lint_fix_lifecycle';

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
  const [currentAppId, setCurrentAppId] = useState<string>(''); // Add app ID state

  const inputRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const detachRefs = useRef<PPLDetachRefs>({
    validationContext: { current: undefined },
    grammarRefresh: { current: undefined },
    lintContext: { current: undefined },
    lintGrammarRefresh: { current: undefined },
    lintContextRefresh: { current: undefined },
    lintHoverPersistence: { current: undefined },
  });
  // Cache of index-pattern field names per dataset id, populated asynchronously
  // for field-validation lint. Self-suppresses until loaded.
  const lintFieldsRef = useRef<LintFieldsCache>({});
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
  // Owns the in-flight AI lint-fix request for this editor mount: serializes
  // chat launches, expires abandoned requests, and releases only its own
  // request when async launch work completes out of order.
  const pplLintFixLifecycleRef = useRef<PPLLintFixLifecycle>();
  if (!pplLintFixLifecycleRef.current) {
    pplLintFixLifecycleRef.current = new PPLLintFixLifecycle(
      PPL_LINT_FIX_DATA_HOST,
      (contextId) => {
        services.contextProvider?.getAssistantContextStore()?.removeContextById(contextId);
      }
    );
  }
  const pplLintFixLifecycle = pplLintFixLifecycleRef.current;
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

  const getValidationContext = (): PPLValidationContext => {
    const dsId = queryRef.current.dataset?.dataSource?.id;
    const dsVersion = queryRef.current.dataset?.dataSource?.version;
    const dsEngineType =
      queryRef.current.dataset?.dataSource?.engineType ??
      queryRef.current.dataset?.dataSource?.type;
    return {
      useRuntimeGrammar: shouldUseRuntimeGrammar(dsId, dsVersion, dsEngineType),
      dataSourceId: dsId,
      dataSourceVersion: dsVersion,
    };
  };

  function onAskAiFix(request: AskPPLLintFixRequest): void {
    pplLintFixLifecycle.beginRequest(request.requestId);
    const session = {
      host: PPL_LINT_FIX_DATA_HOST,
      request,
      getCurrentQuery: () => inputRef.current?.getValue() ?? toUser(queryRef.current.query),
      getCurrentQueryState: () => queryString.getQuery(),
      getLintContext,
    };

    const chat = services.chat;
    if (!chat?.sendMessageWithWindow || !(chat.isAvailable?.() ?? true)) {
      pplLintFixLifecycle.abandonRequest(request.requestId);
      services.notifications.toasts.addWarning(
        i18n.translate('data.pplLint.aiFix.chatUnavailable', {
          defaultMessage: 'AI is not available for this PPL lint fix.',
        })
      );
      return;
    }

    // Send the fix request's machine plumbing (correlation ids + tool-calling
    // instructions) out-of-band via the assistant context store so the model
    // receives it without it rendering as a chat bubble. The visible bubble is
    // the short human message (request.chatMessage). Keyed by requestId.
    const contextStore = services.contextProvider?.getAssistantContextStore?.();
    addPPLLintFixAssistantContext(request, contextStore, PPL_LINT_FIX_DATA_HOST);

    void pplLintFixLifecycle
      .waitForChatLaunch(request.requestId, () =>
        chat.sendMessageWithWindow!(request.chatMessage, [], { clearConversation: true })
      )
      .then((failure) => {
        if (!failure) {
          // Activate only after the fresh chat reset so an older card cannot
          // capture this request while its previous conversation is still live.
          if (pplLintFixLifecycle.ownsRequest(request.requestId)) {
            storePPLLintFixSession({
              ...session,
              chatThreadId: chat.getThreadId(),
              getCurrentChatThreadId: () => chat.getThreadId(),
            });
          }
          return;
        }
        // A late failure for a replaced request still cleans that exact context,
        // but should not warn for or disturb the newer owned request.
        if (!failure.abandonedOwnedRequest) {
          return;
        }
        services.notifications.toasts.addWarning(
          i18n.translate('data.pplLint.aiFix.openChatError', {
            defaultMessage: 'Could not open AI for this PPL lint fix.',
          })
        );
      });
  }

  function getLintContext(): PPLLintContext {
    const aiFixToolName = (
      services as IDataPluginServices & {
        pplLintFixToolName?: string;
      }
    ).pplLintFixToolName;
    const chatAvailable = Boolean(
      aiFixToolName &&
      services.chat?.sendMessageWithWindow &&
      (services.chat.isAvailable?.() ?? true)
    );
    return buildPPLLintContext(
      queryRef.current.dataset,
      lintFieldsRef.current,
      services,
      chatAvailable ? { onAskAiFix, aiFixToolName } : undefined
    );
  }

  useEffect(
    () => () => {
      pplLintFixLifecycle.dispose();
      cleanupPPLContexts(detachRefs.current);
    },
    [pplLintFixLifecycle]
  );

  // Load index-pattern field names for the active dataset and feed them to the
  // lint context. Field-validation self-suppresses until this resolves; we push
  // the context in a single phase after the async load to avoid flicker.
  useEffect(() => {
    const datasetId = query.dataset?.id;
    const dataSourceId = query.dataset?.dataSource?.id;
    const datasetType = query.dataset?.type;
    const sourcePattern = query.dataset?.title;
    let cancelled = false;

    const loadFields = async () => {
      if (!datasetId) {
        // No dataset: drop cached fields so field-validation self-suppresses
        // rather than running against a previous dataset's metadata.
        lintFieldsRef.current = {};
      } else {
        try {
          // Probe per-source AI reachability alongside the field load, only when
          // chat is wired at all — otherwise the AI action is already hidden by
          // the missing opener, so the probe would be a wasted call on every
          // dataset switch. Fail-open when unprobed (undefined leaves it shown).
          const shouldProbeAi = Boolean(services.http && (services.chat?.isAvailable?.() ?? false));
          const [indexPattern, aiAgentAvailableForSource] = await Promise.all([
            getIndexPatterns().get(datasetId),
            shouldProbeAi
              ? getAiAgentAvailableForDataSource(services.http, dataSourceId, 5000)
              : Promise.resolve(undefined),
          ]);
          if (cancelled || !indexPattern) {
            return;
          }
          const { fields, typeMap } = extractFieldMetadata(indexPattern);
          // Two metadata probes the field list cannot supply: `enabled:false` is
          // stripped by _field_caps, and the visible-index list is cluster-wide.
          // Both are best-effort — their rules self-suppress when absent.
          const [disabledObjectFields, visibleIndices] = await Promise.all([
            fetchDisabledObjectFields(services.http, indexPattern),
            fetchVisibleIndices(services.http, dataSourceId),
          ]);
          if (cancelled) {
            return;
          }
          lintFieldsRef.current = {
            datasetId,
            dataSourceId,
            datasetType,
            selectedSourcePattern: sourcePattern,
            fields,
            typeMap,
            disabledObjectFields,
            visibleIndices,
            aiAgentAvailableForSource,
          };
        } catch {
          // On failure leave fields unset so field-validation self-suppresses.
          if (cancelled) {
            return;
          }
          lintFieldsRef.current = {};
        }
      }

      syncPPLLintContext(inputRef.current, getLintContext());
      const model = inputRef.current?.getModel();
      if (model) {
        void revalidatePPLModel(model);
      }
    };

    void loadFields();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.dataset?.id, query.dataset?.dataSource?.id, query.dataset?.type, query.dataset?.title]);

  useEffect(() => {
    const subscription = services.application?.currentAppId$?.subscribe?.((appId) => {
      setCurrentAppId(appId || '');
    });
    return () => subscription?.unsubscribe();
  }, [services.application?.currentAppId$]);

  useEffect(() => {
    const dsId = query.dataset?.dataSource?.id;
    const dsVersion = query.dataset?.dataSource?.version;
    const dsEngineType = query.dataset?.dataSource?.engineType ?? query.dataset?.dataSource?.type;
    syncPPLValidationContext(inputRef.current, {
      useRuntimeGrammar: shouldUseRuntimeGrammar(dsId, dsVersion, dsEngineType),
      dataSourceId: dsId,
      dataSourceVersion: dsVersion,
    });

    const model = inputRef.current?.getModel();
    if (model) {
      void revalidatePPLModel(model);
    }
  }, [
    query.dataset?.dataSource?.id,
    query.dataset?.dataSource?.version,
    query.dataset?.dataSource?.engineType,
    query.dataset?.dataSource?.type,
  ]);

  useEffect(() => {
    syncPPLLintContext(inputRef.current, getLintContext());
    const model = inputRef.current?.getModel();
    if (model) {
      void revalidatePPLModel(model);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    query.dataset?.id,
    query.dataset?.dataSource?.id,
    query.dataset?.dataSource?.version,
    services.uiSettings,
  ]);

  useEffect(() => {
    const subscription = services.uiSettings.getUpdate$().subscribe(({ key }) => {
      if (key !== UI_SETTINGS.QUERY_ENHANCEMENTS_PPL_LINT_RULES) {
        return;
      }
      syncPPLLintContext(inputRef.current, getLintContext());
      const model = inputRef.current?.getModel();
      if (model) {
        void revalidatePPLModel(model);
      }
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [services.uiSettings]);

  const renderQueryEditorExtensions = () => {
    if (!(
      headerRef.current &&
      bannerRef.current &&
      queryControlsContainer.current &&
      bottomPanelRef.current &&
      query.language &&
      extensionMap &&
      Object.keys(extensionMap).length > 0
    )) {
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

      // Add query to queryString history for Recent Queries feature
      if (currentQuery.query?.trim()) {
        queryString.addToQueryHistory(currentQuery, dateRange);
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

  const provideCompletionItems = async (
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    context: monaco.languages.CompletionContext,
    token: monaco.CancellationToken
  ): Promise<monaco.languages.CompletionList> => {
    if (token.isCancellationRequested) {
      return { suggestions: [], incomplete: false };
    }

    const dataset = queryString.getQuery().dataset;
    let indexPattern;
    if (dataset) {
      try {
        indexPattern = await getIndexPatterns().get(dataset.id);
      } catch {
        // INDEXES datasets use a cached temporary index pattern that may not
        // exist as a saved object. Gracefully degrade — keyword suggestions
        // still work without an index pattern.
      }
    }

    const language = getEffectiveLanguageForAutoComplete(queryRef.current.language, currentAppId);

    const suggestions = await services.data.autocomplete.getQuerySuggestions({
      query: inputRef.current?.getValue() ?? '',
      selectionStart: model.getOffsetAt(position), // not needed, position handles same thing. remove
      selectionEnd: model.getOffsetAt(position),
      language,
      indexPattern,
      datasetType: dataset?.type,
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
          ? (suggestions.filter((s) => 'detail' in s) as MonacoCompatibleQuerySuggestion[]) // Cast the filtered array
              .map(
                (
                  s: MonacoCompatibleQuerySuggestion,
                  _index: number,
                  _array: MonacoCompatibleQuerySuggestion[]
                ) => {
                  return {
                    label: s.text,
                    kind: s.type as monaco.languages.CompletionItemKind,
                    insertText: s.insertText ?? s.text,
                    insertTextRules: s.insertTextRules ?? undefined,
                    range: s.replacePosition ?? defaultRange,
                    detail: s.detail,
                    command: {
                      id: 'editor.action.triggerSuggest',
                      title: 'Trigger Next Suggestion',
                    },
                    sortText: s.sortText ?? s.text, // when undefined, the falsy value will default to the label
                  };
                }
              )
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
      setLineCount(editor.getModel()?.getLineCount());
      inputRef.current = editor;
      attachPPLContexts(
        editor,
        detachRefs.current,
        getValidationContext,
        getLintContext,
        (listener) => pplGrammarCache.subscribeToGrammarUpdates(listener),
        revalidatePPLModel,
        (listener) => pplGrammarCache.subscribeToVersionResolved(listener)
      );
      const editorModel = editor.getModel();
      if (editorModel) {
        void revalidatePPLModel(editorModel);
      }
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
    queryStatus: props.queryStatus,
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
      attachPPLContexts(
        editor,
        detachRefs.current,
        getValidationContext,
        getLintContext,
        (listener) => pplGrammarCache.subscribeToGrammarUpdates(listener),
        revalidatePPLModel,
        (listener) => pplGrammarCache.subscribeToVersionResolved(listener)
      );
      const singleLineModel = editor.getModel();
      if (singleLineModel) {
        void revalidatePPLModel(singleLineModel);
      }

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
    queryStatus: props.queryStatus,
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
        isVisible={isRecentQueryVisible}
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
