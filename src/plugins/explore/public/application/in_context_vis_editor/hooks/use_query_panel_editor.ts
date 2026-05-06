/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { monaco, PPLValidationContext, revalidatePPLModel } from '@osd/monaco';
import { i18n } from '@osd/i18n';

import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../types';
import {
  usePromptIsTyping,
  promptEditorOptions,
  queryEditorOptions,
  useMultiQueryDecorations,
  languageConfiguration,
  DEFAULT_TRIGGER_CHARACTERS,
  UseQueryPanelEditorReturnType,
  getEditorPlaceholder,
  editorMount,
  buildCompletionItems,
} from '../../../components/query_panel/query_panel_editor';

import { EditorMode } from '../../../application/utils/state_management/types';
import { useEditorOperations } from './use_editor_operations';
import { useQueryBuilderState } from './use_query_builder_state';

import { syncPPLValidationContext, shouldUseRuntimeGrammar } from '../../../../../data/public';

type IStandaloneCodeEditor = monaco.editor.IStandaloneCodeEditor;

export const useQueryPanelEditor = (): UseQueryPanelEditorReturnType => {
  const { queryBuilder, queryState, queryEditorState } = useQueryBuilderState();
  const { promptIsTyping, handleChangeForPromptIsTyping } = usePromptIsTyping();
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { keyboardShortcut } = services;
  const { updateDecorations, clearDecorations } = useMultiQueryDecorations();

  const userQueryString = queryState.query;
  const queryLanguage = queryState.language;
  const isPromptMode = queryEditorState.editorMode === EditorMode.Prompt;
  const promptModeIsAvailable = queryEditorState.promptModeIsAvailable;
  const isQueryEditorDirty = queryEditorState.isQueryEditorDirty;

  const [editorText, setEditorText] = useState<string>(userQueryString);
  const [editorIsFocused, setEditorIsFocused] = useState(false);

  // The 'onRun' functions in editorDidMount uses the context values when the editor is mounted.
  // Using a ref will ensure it always uses the latest value
  const editorTextRef = useRef(editorText);
  const languageTitle = useMemo(() => {
    const languageService = services.data.query.queryString.getLanguageService();
    return languageService.getLanguage(queryLanguage)?.title ?? queryLanguage;
  }, [queryLanguage, services.data.query.queryString]);

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(queryBuilder.getEditorRef());
  const isQueryMode = !isPromptMode;
  const isPromptModeRef = useRef(isPromptMode);
  const promptModeIsAvailableRef = useRef(promptModeIsAvailable);
  const queryLanguageRef = useRef(queryLanguage);

  const { switchEditorMode, setEditorRef: setEditor } = useEditorOperations();
  const detachValidationContextRef = useRef<(() => void) | undefined>();
  const detachGrammarRefreshRef = useRef<(() => void) | undefined>();

  const dataset = queryState.dataset;

  const getValidationContext = useCallback((): PPLValidationContext => {
    const currentQuery = services.data.query.queryString.getQuery();
    const dsId = currentQuery.dataset?.dataSource?.id;
    const dsVersion = currentQuery.dataset?.dataSource?.version;
    return {
      useRuntimeGrammar: shouldUseRuntimeGrammar(dsId, dsVersion),
      dataSourceId: dsId,
      dataSourceVersion: dsVersion,
    };
  }, [services.data.query.queryString]);

  // Keep the refs updated with latest context
  useEffect(() => {
    editorTextRef.current = editorText;
  }, [editorText]);
  useEffect(() => {
    isPromptModeRef.current = isPromptMode;
  }, [isPromptMode]);
  useEffect(() => {
    promptModeIsAvailableRef.current = promptModeIsAvailable;
  }, [promptModeIsAvailable]);
  useEffect(() => {
    queryLanguageRef.current = queryLanguage;
  }, [queryLanguage]);

  // Sync PPL validation context when datasource changes
  useEffect(() => {
    const editor = editorRef.current;
    const dsId = dataset?.dataSource?.id;
    const dsVersion = dataset?.dataSource?.version;
    syncPPLValidationContext(editor, {
      useRuntimeGrammar: shouldUseRuntimeGrammar(dsId, dsVersion),
      dataSourceId: dsId,
      dataSourceVersion: dsVersion,
    });
    const model = editor?.getModel();
    if (model) {
      void revalidatePPLModel(model);
    }
  }, [dataset?.dataSource?.id, dataset?.dataSource?.version, editorRef]);

  // Cleanup validation context on unmount
  useEffect(
    () => () => {
      detachValidationContextRef.current?.();
      detachValidationContextRef.current = undefined;
      detachGrammarRefreshRef.current?.();
      detachGrammarRefreshRef.current = undefined;
    },
    []
  );

  keyboardShortcut?.useKeyboardShortcut({
    id: 'focus_query_bar',
    pluginId: 'explore',
    name: i18n.translate('explore.queryPanelEditor.focusQueryBarShortcut', {
      defaultMessage: 'Focus query bar',
    }),
    category: i18n.translate('explore.queryPanelEditor.searchCategory', {
      defaultMessage: 'Search',
    }),
    keys: '/',
    execute: () => {
      editorRef.current?.focus();
    },
  });

  // The 'triggerSuggestOnFocus' prop of CodeEditor only happens on mount, so I am intentionally not passing it
  // and programmatically doing it here. We should only trigger autosuggestion on focus while on isQueryMode and there is text
  useEffect(() => {
    if (isQueryMode) {
      const onDidFocusDisposable = editorRef.current?.onDidFocusEditorWidget(() => {
        editorRef.current?.trigger('keyboard', 'editor.action.triggerSuggest', {});
      });

      if (!editorText) {
        editorRef.current?.trigger('keyboard', 'editor.action.triggerSuggest', {});
      }

      return () => {
        onDidFocusDisposable?.dispose();
      };
    }
  }, [isQueryMode, editorRef, editorText]);

  const setEditorRef = useCallback(
    (editor: IStandaloneCodeEditor) => {
      if (editorRef.current !== editor) {
        editorRef.current = editor;
        setEditor(editor);
      }
    },
    [editorRef, setEditor]
  );

  // Get variable names from queryBuilder
  const getVariableNames = useCallback(() => {
    return queryBuilder.variableNames$?.value || [];
  }, [queryBuilder]);

  // Real autocomplete implementation using the data plugin's autocomplete service
  const provideCompletionItems = useCallback(
    async (
      model: monaco.editor.ITextModel,
      position: monaco.Position,
      _: monaco.languages.CompletionContext,
      token: monaco.CancellationToken
    ): Promise<monaco.languages.CompletionList> =>
      buildCompletionItems(model, position, _, token, {
        isPromptModeRef,
        queryLanguage,
        services,
        variableNames: getVariableNames(),
      }),
    [isPromptModeRef, queryLanguage, services, getVariableNames]
  );

  const suggestionProvider = useMemo(() => {
    const languageTriggerCharacters = services?.data?.autocomplete?.getTriggerCharacters(
      queryLanguage
    );
    return {
      triggerCharacters: isPromptMode
        ? ['=']
        : languageTriggerCharacters ?? DEFAULT_TRIGGER_CHARACTERS,
      provideCompletionItems,
    };
  }, [isPromptMode, provideCompletionItems, queryLanguage, services]);

  const handleRun = useCallback(() => {
    // Use ref to get the latest editorMode value, avoiding stale state from React's async updates
    if (!isPromptModeRef.current) {
      queryBuilder.updateQueryState({ query: editorTextRef.current });
    }

    queryBuilder.onQueryExecutionSubmit().catch((error) => {
      services.notifications?.toasts.addError(error, {
        title: 'Query execution failed',
        toastLifeTimeMs: 2000,
      });
    });
  }, [queryBuilder, services.notifications?.toasts]);

  const editorDidMount = useCallback(
    (editor: IStandaloneCodeEditor) =>
      editorMount(
        editor,
        {
          promptModeIsAvailableRef,
          isPromptModeRef,
          editorTextRef,
          queryLanguageRef,
          detachValidationContextRef,
          detachGrammarRefreshRef,
        },
        {
          setEditorRef,
          setEditorIsFocused,
          handleRun,
          switchEditorMode,
          updateDecorations,
          clearDecorations,
        },
        getValidationContext
      ),
    [
      setEditorRef,
      handleRun,
      switchEditorMode,
      setEditorIsFocused,
      updateDecorations,
      clearDecorations,
      getValidationContext,
    ]
  );

  const options = useMemo(() => {
    if (isQueryMode) {
      return queryEditorOptions;
    } else {
      return promptEditorOptions;
    }
  }, [isQueryMode]);

  const placeholder = useMemo(
    () =>
      getEditorPlaceholder({
        isPromptMode,
        promptModeIsAvailable,
        languageTitle,
      }),
    [isPromptMode, promptModeIsAvailable, languageTitle]
  );

  const onEditorClick = useCallback(() => {
    editorRef.current?.focus();
  }, [editorRef]);

  const onChange = useCallback(
    (newText: string) => {
      setEditorText(newText);

      if (!isQueryEditorDirty) {
        queryBuilder.updateQueryEditorState({ isQueryEditorDirty: true });
      }

      if (isPromptMode) {
        handleChangeForPromptIsTyping();
      }
    },
    [setEditorText, isPromptMode, handleChangeForPromptIsTyping, isQueryEditorDirty, queryBuilder]
  );

  return {
    editorDidMount,
    isFocused: editorIsFocused,
    isPromptMode,
    languageConfiguration,
    languageId: isPromptMode ? 'AI' : queryLanguage,
    onChange,
    onEditorClick,
    options,
    placeholder,
    promptIsTyping,
    suggestionProvider,
    showPlaceholder: !editorText.length,
    useLatestTheme: true,
    value: editorText,
  };
};
